#!/usr/bin/env bash
set -euo pipefail

SRC="$HOME/Desktop/Pappytackle"
DEST_PHOTOS="src/assets/photos"
DEST_LOGOS="src/assets/logos"
DEST_VIDEOS="public/videos"

if [ ! -d "$SRC" ]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST_PHOTOS"/{lexus-gx,tacomas,broncos,exhaust,vans} "$DEST_LOGOS" "$DEST_VIDEOS"

convert_jpeg() {
  local src="$1" dest="$2"
  if [ ! -f "$dest" ]; then
    sips -s format jpeg -s formatOptions 90 "$src" --out "$dest" >/dev/null
    sips -d all "$dest" >/dev/null 2>&1 || true
  fi
}

copy_logo() {
  local src="$1" dest="$2"
  [ -f "$dest" ] || cp "$src" "$dest"
}

declare -a JPG_MAP=(
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL.jpg::lexus-gx/long-travel-01.jpg"
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL2.jpg::lexus-gx/long-travel-02.jpg"
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL 3.jpg::lexus-gx/long-travel-03.jpg"
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL 4.jpg::lexus-gx/long-travel-04.jpg"
  "PHOTOS/LEXUS GX/0002 LEXUS KINGS_TC.jpg::lexus-gx/kings-shocks.jpg"
  "PHOTOS/TACOMAS/TACOLEVEL.jpg::tacomas/leveled-01.jpg"
  "PHOTOS/TACOMAS/TACOLEVEL_LIFTCAMPER.jpg::tacomas/lift-camper.jpg"
  "PHOTOS/TACOMAS/0001 17TACOBUMPER.jpg::tacomas/2017-bumper.jpg"
  "PHOTOS/TACOMAS/0002 16TACOSHOCKREBUILD.jpg::tacomas/2016-shock-rebuild.jpg"
  "PHOTOS/BRONCOS/BRONCRACK_LIGHTS.jpg::broncos/light-bar.jpg"
)

for entry in "${JPG_MAP[@]}"; do
  src="$SRC/${entry%%::*}"
  dst="$DEST_PHOTOS/${entry##*::}"
  [ -f "$src" ] && convert_jpeg "$src" "$dst" || echo "Missing: $src"
done

declare -a HEIC_MAP=(
  "PHOTOS/EXHAUST/VAN EXHAUST.heic::exhaust/van-exhaust-01.jpg"
  "PHOTOS/EXHAUST/20250908_155737.heic::exhaust/exhaust-02.jpg"
  "PHOTOS/VANS/20250908_155720.heic::vans/van-01.jpg"
  "PHOTOS/VANS/20250908_155731.heic::vans/van-02.jpg"
)

for entry in "${HEIC_MAP[@]}"; do
  src="$SRC/${entry%%::*}"
  dst="$DEST_PHOTOS/${entry##*::}"
  [ -f "$src" ] && convert_jpeg "$src" "$dst" || echo "Missing: $src"
done

declare -a LOGO_MAP=(
  "PAPPYTACKLE LOGO PNGS/01 Logo/png/Pappytacke_Logo_Navy_RGB.png::logo-navy.png"
  "PAPPYTACKLE LOGO PNGS/01 Logo/png/Pappytacke_Logo_Beige_RGB.png::logo-beige.png"
  "PAPPYTACKLE LOGO PNGS/02 Full logo/png/Pappytacke_Logo_Navy_RGB.png::logo-full-navy.png"
  "PAPPYTACKLE LOGO PNGS/02 Full logo/png/Pappytacke_Logo_Beige_RGB.png::logo-full-beige.png"
  "PAPPYTACKLE LOGO PNGS/03 Tire Mark/png/Pappytacke_TireMark_Yellow_RGB.png::tire-mark-yellow.png"
  "PAPPYTACKLE LOGO PNGS/03 Tire Mark/png/Pappytacke_TireMark_Navy_RGB.png::tire-mark-navy.png"
  "PAPPYTACKLE LOGO PNGS/04 Badge/png/Pappytacke_Badge_Logo_Navy_RGB.png::badge-navy.png"
  "PAPPYTACKLE LOGO PNGS/04 Badge/png/Pappytacke_Badge_Logo_MultiBeige_RGB.png::badge-multi-beige.png"
)

for entry in "${LOGO_MAP[@]}"; do
  src="$SRC/${entry%%::*}"
  dst="$DEST_LOGOS/${entry##*::}"
  [ -f "$src" ] && copy_logo "$src" "$dst" || echo "Missing: $src"
done

VID_SRC="$SRC/PHOTOS/LEXUS GX/20250524_111526.mp4"
if [ -f "$VID_SRC" ]; then
  if command -v ffmpeg >/dev/null; then
    [ -f "$DEST_VIDEOS/lexus-gx-hero.mp4" ] || \
      ffmpeg -y -i "$VID_SRC" -an -vf "scale=1920:-2" -c:v libx264 -crf 24 -preset slow -movflags +faststart "$DEST_VIDEOS/lexus-gx-hero.mp4" -loglevel error
    [ -f "$DEST_VIDEOS/lexus-gx-hero.webm" ] || \
      ffmpeg -y -i "$VID_SRC" -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 32 -b:v 0 "$DEST_VIDEOS/lexus-gx-hero.webm" -loglevel error
  else
    echo "ffmpeg not found — copying MP4 as-is (large file)"
    cp -n "$VID_SRC" "$DEST_VIDEOS/lexus-gx-hero.mp4"
  fi
fi

echo "Asset import complete."
ls -la "$DEST_PHOTOS" "$DEST_LOGOS" "$DEST_VIDEOS"
