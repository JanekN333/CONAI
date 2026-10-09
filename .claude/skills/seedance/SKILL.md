---
name: seedance
description: Generuj realistyczne filmy reklamowe AI (Seedance 2.5 od ByteDance, przez BytePlus ModelArk) do promocji produktow sklepu e-commerce. Uzyj, gdy uzytkownik prosi o film, wideo, reklame, klip na TikTok/Reels/Shorts lub animacje zdjecia produktu.
---

# Seedance 2.5 - filmy reklamowe do sklepu

Narzedzie: `python3 tools/seedance.py` (wymaga `ARK_API_KEY` w `.env`).

## Przeplyw pracy
1. Ustal: produkt, platforme (TikTok/Reels/Shorts -> `--ratio 9:16`; strona/YouTube -> `16:9`; feed -> `1:1`), dlugosc, klimat.
2. Zdjecia produktu przekaz przez `--ref` (do 4 najlepiej z roznych stron) - model trzyma wyglad produktu.
   Gdy produkt ma zaczynac scene dokladnie jak na zdjeciu, uzyj `--first-frame`.
3. Najpierw tani podglad: `--resolution 480p --duration 5`. Po akceptacji finalna wersja w `1080p`.
4. Sprawdz request przez `--dry-run`, zanim wydasz kredyty. Nie powtarzaj wywolania po bledzie sieci bez sprawdzenia `--status TASK_ID`, bo kazde wywolanie kosztuje.
5. Wynik trafia do `videos/`. Wyslij uzytkownikowi plik.

## Pisanie promptow (po angielsku daje najlepsze wyniki)
Struktura: **podmiot + akcja + otoczenie + swiatlo + kamera + styl**.
- Realizm: `photorealistic, shot on 35mm, shallow depth of field, natural skin texture, soft daylight`.
- Kamera: `slow dolly-in`, `orbit around the product`, `handheld UGC style`, `macro close-up`, `top-down`.
- Produkt: opisz material, kolor i logo dokladnie; dodaj `the product stays identical to the reference images`.
- Ujecia w czasie: `[0-3s] ... [3-6s] ...` dla dluzszych narracji (do 30 s).
- Unikaj tekstu na ekranie w prompcie - napisy dodaj w montazu.

## Przyklady
```bash
# Packshot do TikToka z referencja
python3 tools/seedance.py "Photorealistic product commercial: the white ceramic mug from the reference images on a wooden cafe table, steam rising, morning sunlight through window, slow orbit camera, shallow depth of field" --ref mug1.jpg --ref mug2.jpg --ratio 9:16 --duration 8 --resolution 480p

# UGC - osoba prezentuje produkt
python3 tools/seedance.py "Handheld UGC selfie video: a young woman in her bathroom holds the serum bottle from the reference image, smiles and applies a drop to her cheek, natural light, authentic smartphone look" --ref serum.jpg --ratio 9:16 --duration 10
```
