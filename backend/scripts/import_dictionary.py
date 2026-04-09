import argparse
import csv
import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, str(BACKEND_DIR))

import django  # noqa: E402

django.setup()

from django.db import transaction  # noqa: E402

from api.models import Dictionary, Languages  # noqa: E402


LANGUAGE_LOOKUP = {
    code.lower(): code
    for code, _ in Languages.LANGUAGE_CHOICES
}
LANGUAGE_LOOKUP.update(
    {
        label.lower(): code
        for code, label in Languages.LANGUAGE_CHOICES
    }
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Import dictionary words from a CSV file into the Dictionary table.",
    )
    parser.add_argument(
        "--csv",
        default=str(Path(__file__).resolve().parent / "dictionary.csv"),
        help="Path to the CSV file. Defaults to backend/scripts/dictionary.csv",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and preview the import without saving any rows.",
    )
    return parser.parse_args()


def normalize_value(value):
    return (value or "").strip()


def normalize_language(raw_language):
    value = normalize_value(raw_language)
    if not value:
        return None
    return LANGUAGE_LOOKUP.get(value.lower())


def load_rows(csv_path):
    rows_to_import = []
    errors = []

    with open(csv_path, newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        required_headers = {"word", "language", "meaning"}

        if not reader.fieldnames:
            raise ValueError("CSV file is empty or missing a header row.")

        missing_headers = required_headers - set(reader.fieldnames)
        if missing_headers:
            raise ValueError(
                f"CSV is missing required columns: {', '.join(sorted(missing_headers))}",
            )

        for row_number, row in enumerate(reader, start=2):
            word = normalize_value(row.get("word"))
            language = normalize_language(row.get("language"))
            meaning = normalize_value(row.get("meaning"))

            if not word:
                errors.append(f"Row {row_number}: word is required.")
                continue
            if not language:
                errors.append(
                    f"Row {row_number}: invalid language '{row.get('language')}'.",
                )
                continue
            if not meaning:
                errors.append(f"Row {row_number}: meaning is required.")
                continue

            rows_to_import.append(
                {
                    "word": word,
                    "language": language,
                    "meaning": meaning,
                }
            )

    return rows_to_import, errors


def import_rows(rows_to_import, dry_run=False):
    created_count = 0
    updated_count = 0

    with transaction.atomic():
        for row in rows_to_import:
            _, created = Dictionary.objects.update_or_create(
                word=row["word"],
                defaults={
                    "language": row["language"],
                    "meaning": row["meaning"],
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        if dry_run:
            transaction.set_rollback(True)

    return created_count, updated_count


def main():
    args = parse_args()
    csv_path = Path(args.csv).resolve()

    if not csv_path.exists():
        print(f"CSV file not found: {csv_path}")
        sys.exit(1)

    try:
        rows_to_import, errors = load_rows(csv_path)
    except ValueError as error:
        print(str(error))
        sys.exit(1)

    if errors:
        print("Import aborted due to validation errors:")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)

    created_count, updated_count = import_rows(
        rows_to_import=rows_to_import,
        dry_run=args.dry_run,
    )

    mode_label = "Dry run complete" if args.dry_run else "Import complete"
    print(
        f"{mode_label}: {len(rows_to_import)} rows processed, "
        f"{created_count} created, {updated_count} updated.",
    )


if __name__ == "__main__":
    main()
