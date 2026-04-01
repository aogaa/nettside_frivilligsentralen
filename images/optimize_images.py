from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


MAX_SIDE = 1600
QUALITY = 95
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Resize images so the longest side is 1600px and save them as JPG "
            "with quality 95."
        )
    )
    parser.add_argument(
        "--source",
        default=".",
        help="Folder containing source images. Defaults to current folder.",
    )
    parser.add_argument(
        "--output",
        default="optimized_images",
        help="Output folder for optimized images. Ignored when --overwrite is used.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite source images instead of saving to optimized_images/.",
    )
    return parser.parse_args()


def iter_image_files(source_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def resize_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    width, height = image.size
    longest_side = max(width, height)

    if longest_side <= MAX_SIDE:
        return image

    scale = MAX_SIDE / longest_side
    new_size = (round(width * scale), round(height * scale))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def ensure_rgb(image: Image.Image) -> Image.Image:
    if image.mode in ("RGB", "L"):
        return image.convert("RGB")

    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        alpha = image.getchannel("A")
        background.paste(image.convert("RGBA"), mask=alpha)
        return background

    return image.convert("RGB")


def build_output_path(source_path: Path, output_dir: Path, overwrite: bool) -> Path:
    if overwrite:
        return source_path.with_suffix(".jpg")
    return output_dir / f"{source_path.stem}.jpg"


def optimize_image(source_path: Path, output_dir: Path, overwrite: bool) -> Path | None:
    with Image.open(source_path) as image:
        icc_profile = image.info.get("icc_profile")
        resized = resize_image(image)

        if resized.size == image.size:
            return None

        rgb_image = ensure_rgb(resized).copy()
        output_path = build_output_path(source_path, output_dir, overwrite)

    save_kwargs = {"quality": QUALITY, "optimize": True}
    if icc_profile:
        save_kwargs["icc_profile"] = icc_profile

    rgb_image.save(output_path, "JPEG", **save_kwargs)

    if overwrite and source_path.resolve() != output_path.resolve():
        source_path.unlink()

    return output_path


def main() -> None:
    args = parse_args()
    source_dir = Path(args.source).resolve()
    output_dir = Path(args.output).resolve()

    if not source_dir.exists() or not source_dir.is_dir():
        raise SystemExit(f"Source folder not found: {source_dir}")

    image_files = iter_image_files(source_dir)
    if not image_files:
        raise SystemExit(f"No supported image files found in: {source_dir}")

    if not args.overwrite:
        output_dir.mkdir(parents=True, exist_ok=True)

    for image_path in image_files:
        output_path = optimize_image(image_path, output_dir, args.overwrite)
        if output_path is None:
            print(f"Skipped: {image_path}")
            continue

        print(f"Saved: {output_path}")


if __name__ == "__main__":
    main()
