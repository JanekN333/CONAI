#!/usr/bin/env python3
"""Seedance 2.5 (ByteDance) - generowanie wideo przez oficjalne API BytePlus ModelArk.

Bez zaleznosci - tylko biblioteka standardowa Pythona 3.8+.

Konfiguracja (zmienne srodowiskowe albo plik .env w katalogu repo):
  ARK_API_KEY        klucz API z konsoli BytePlus ModelArk (wymagany)
  SEEDANCE_MODEL     ID modelu lub endpointu (domyslnie dreamina-seedance-2-5-260628)
  ARK_BASE_URL       domyslnie https://ark.ap-southeast.bytepluses.com/api/v3

Przyklady:
  python3 tools/seedance.py "Butelka perfum na marmurze, poranne swiatlo, wolny dolly-in" \
      --ratio 9:16 --duration 8
  python3 tools/seedance.py "Model w kurtce idzie ulica miasta noca, neon, slow motion" \
      --ref produkt1.jpg --ref produkt2.jpg --ratio 9:16 --duration 10
  python3 tools/seedance.py "Kubek obraca sie na stole" --first-frame kubek.png
"""
import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_MODEL = "dreamina-seedance-2-5-260628"
DEFAULT_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3"


def load_env():
    env_file = REPO / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def media_url(src):
    """URL zostawia bez zmian, plik lokalny zamienia na data URL (base64)."""
    if src.startswith(("http://", "https://", "data:", "asset://")):
        return src
    path = Path(src)
    if not path.exists():
        sys.exit(f"Nie ma pliku: {src}")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def api(method, url, key, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"Blad API {e.code}: {e.read().decode(errors='replace')}")


def build_content(args):
    content = [{"type": "text", "text": args.prompt}]
    for src, role in ([(args.first_frame, "first_frame")] if args.first_frame else []) + \
                     ([(args.last_frame, "last_frame")] if args.last_frame else []) + \
                     [(r, "reference_image") for r in args.ref]:
        content.append({"type": "image_url", "image_url": {"url": media_url(src)}, "role": role})
    for v in args.ref_video:
        content.append({"type": "video_url", "video_url": {"url": media_url(v)}, "role": "reference_video"})
    for a in args.ref_audio:
        content.append({"type": "audio_url", "audio_url": {"url": media_url(a)}, "role": "reference_audio"})
    return content


def main():
    load_env()
    p = argparse.ArgumentParser(description="Generuj wideo Seedance 2.5 przez BytePlus ModelArk")
    p.add_argument("prompt", nargs="?", help="Opis sceny (najlepiej po angielsku)")
    p.add_argument("--ratio", default="adaptive", help="16:9, 9:16, 1:1, 4:3, 3:4, 21:9 lub adaptive")
    p.add_argument("--duration", type=int, default=5, help="Dlugosc w sekundach (4-30)")
    p.add_argument("--resolution", default="720p", help="480p, 720p lub 1080p")
    p.add_argument("--no-audio", action="store_true", help="Wideo bez dzwieku")
    p.add_argument("--seed", type=int, help="Ziarno dla powtarzalnosci")
    p.add_argument("--first-frame", help="Obraz pierwszej klatki (plik lub URL)")
    p.add_argument("--last-frame", help="Obraz ostatniej klatki (plik lub URL)")
    p.add_argument("--ref", action="append", default=[], help="Zdjecie referencyjne produktu (mozna wiele razy)")
    p.add_argument("--ref-video", action="append", default=[], help="Wideo referencyjne (URL)")
    p.add_argument("--ref-audio", action="append", default=[], help="Audio referencyjne (URL)")
    p.add_argument("--out", help="Sciezka pliku .mp4 (domyslnie videos/seedance-<id>.mp4)")
    p.add_argument("--status", metavar="TASK_ID", help="Tylko sprawdz/pobierz istniejace zadanie")
    p.add_argument("--no-wait", action="store_true", help="Wyslij zadanie i nie czekaj na wynik")
    p.add_argument("--dry-run", action="store_true", help="Pokaz request bez wysylania")
    args = p.parse_args()

    key = os.environ.get("ARK_API_KEY")
    base = os.environ.get("ARK_BASE_URL", DEFAULT_BASE).rstrip("/")
    model = os.environ.get("SEEDANCE_MODEL", DEFAULT_MODEL)

    if args.status:
        task_id = args.status
    else:
        if not args.prompt:
            p.error("podaj prompt albo --status TASK_ID")
        body = {
            "model": model,
            "content": build_content(args),
            "ratio": args.ratio,
            "duration": args.duration,
            "resolution": args.resolution,
            "generate_audio": not args.no_audio,
            "watermark": False,
        }
        if args.seed is not None:
            body["seed"] = args.seed
        if args.dry_run:
            preview = json.loads(json.dumps(body))
            for c in preview["content"]:
                for k in ("image_url", "video_url", "audio_url"):
                    if k in c and c[k]["url"].startswith("data:"):
                        c[k]["url"] = c[k]["url"][:40] + "...(base64)"
            print(json.dumps(preview, indent=2, ensure_ascii=False))
            return
        if not key:
            sys.exit("Brak ARK_API_KEY - dodaj go do .env (patrz .env.example)")
        task_id = api("POST", f"{base}/contents/generations/tasks", key, body)["id"]
        print(f"Zadanie wyslane: {task_id}", flush=True)
        if args.no_wait:
            return

    if not key:
        sys.exit("Brak ARK_API_KEY - dodaj go do .env (patrz .env.example)")
    while True:
        task = api("GET", f"{base}/contents/generations/tasks/{task_id}", key)
        status = task.get("status")
        if status == "succeeded":
            break
        if status in ("failed", "cancelled", "expired"):
            sys.exit(f"Zadanie {status}: {json.dumps(task.get('error', task), ensure_ascii=False)}")
        print(f"  status: {status}...", flush=True)
        time.sleep(10)

    video_url = task["content"]["video_url"]
    out = Path(args.out) if args.out else REPO / "videos" / f"seedance-{task_id}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(video_url, out)
    print(f"Gotowe: {out}")
    print(f"URL (wazny ok. 24h): {video_url}")


if __name__ == "__main__":
    main()
