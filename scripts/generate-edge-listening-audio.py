import asyncio
import json
import os
import re
import sys
from pathlib import Path

import edge_tts
import boto3


ROOT = Path(__file__).resolve().parents[1]

BANK = ROOT / "content" / "listening-audio-bank.json"
OUT = ROOT / "generated-listening-audio"

# Edge-TTS settings
VOICE = os.getenv("EDGE_TTS_VOICE", "en-GB-SoniaNeural")
RATE = os.getenv("EDGE_TTS_RATE", "-5%")

# Backblaze B2 settings
B2_BUCKET = os.getenv("B2_BUCKET_NAME")
B2_ENDPOINT = os.getenv(
    "B2_S3_ENDPOINT",
    "https://s3.eu-central-003.backblazeb2.com"
)
B2_REGION = os.getenv("B2_REGION", "eu-central-003")
B2_KEY_ID = os.getenv("B2_KEY_ID")
B2_APPLICATION_KEY = os.getenv("B2_APPLICATION_KEY")

UPLOAD = os.getenv("UPLOAD_TO_B2", "true").lower() == "true"


def slug(value):
    return (
        re.sub(r"[^a-zA-Z0-9_-]+", "-", str(value))
        .strip("-")
        .lower()
        or "test"
    )


def get_tests(data):
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        for key in (
            "tests",
            "listeningTests",
            "listening",
            "items"
        ):
            if isinstance(data.get(key), list):
                return data[key]

    raise ValueError(
        "Unsupported listening-audio-bank.json structure."
    )


def get_script(test, section_index):
    sections = (
        test.get("sections")
        or test.get("listeningSections")
        or []
    )

    scripts = (
        test.get("scripts")
        or test.get("listeningScripts")
        or []
    )

    # Prefer listeningScripts
    if (
        len(scripts) > section_index
        and isinstance(scripts[section_index], str)
    ):
        return scripts[section_index]

    # Otherwise check sections
    if isinstance(sections, dict):
        sections = list(sections.values())

    if len(sections) > section_index:
        section = sections[section_index]

        if isinstance(section, str):
            return section

        if isinstance(section, dict):
            for key in (
                "script",
                "transcript",
                "audioScript"
            ):
                if isinstance(section.get(key), str):
                    return section[key]

    return None


def get_test_id(test, index):
    for key in (
        "id",
        "testId",
        "test_id",
        "name"
    ):
        if test.get(key) is not None:
            return str(test[key])

    return f"listening-test-{index + 1:02d}"


async def generate_audio(text, output_file):
    communicate = edge_tts.Communicate(
        text=text,
        voice=VOICE,
        rate=RATE
    )

    await communicate.save(str(output_file))


def create_b2_client():
    if not B2_BUCKET:
        raise RuntimeError(
            "B2_BUCKET_NAME is missing."
        )

    if not B2_KEY_ID:
        raise RuntimeError(
            "B2_KEY_ID is missing."
        )

    if not B2_APPLICATION_KEY:
        raise RuntimeError(
            "B2_APPLICATION_KEY is missing."
        )

    return boto3.client(
        "s3",
        endpoint_url=B2_ENDPOINT,
        region_name=B2_REGION,
        aws_access_key_id=B2_KEY_ID,
        aws_secret_access_key=B2_APPLICATION_KEY
    )


def upload_to_b2(client, local_file, storage_key):
    client.upload_file(
        str(local_file),
        B2_BUCKET,
        storage_key,
        ExtraArgs={
            "ContentType": "audio/mpeg"
        }
    )

    return f"{B2_ENDPOINT}/{B2_BUCKET}/{storage_key}"


async def main():

    print("======================================")
    print(" IELTS Listening Audio Generator")
    print(" Edge-TTS + Backblaze B2")
    print("======================================")

    print(f"Bank: {BANK}")
    print(f"Voice: {VOICE}")
    print(f"Rate: {RATE}")
    print(f"B2 bucket: {B2_BUCKET}")
    print(f"B2 region: {B2_REGION}")
    print()

    if not BANK.exists():
        raise SystemExit(
            f"Listening bank not found: {BANK}"
        )

    data = json.loads(
        BANK.read_text(encoding="utf-8")
    )

    tests = get_tests(data)

    print(f"Listening tests found: {len(tests)}")

    OUT.mkdir(
        parents=True,
        exist_ok=True
    )

    b2_client = None

    if UPLOAD:
        print("Backblaze upload: ENABLED")
        b2_client = create_b2_client()
    else:
        print("Backblaze upload: DISABLED")

    total = 0
    generated = 0
    skipped = 0
    failed = 0

    for test_index, test in enumerate(tests):

        test_id = slug(
            get_test_id(
                test,
                test_index
            )
        )

        print()
        print(
            f"TEST {test_index + 1}/{len(tests)}: {test_id}"
        )

        for section_index in range(4):

            total += 1

            section_number = section_index + 1

            script = get_script(
                test,
                section_index
            )

            if not script:
                failed += 1

                print(
                    f"[FAIL] {test_id} "
                    f"Section {section_number}: "
                    f"No script found"
                )

                continue

            test_directory = (
                OUT / test_id
            )

            test_directory.mkdir(
                parents=True,
                exist_ok=True
            )

            output_file = (
                test_directory
                / f"section-{section_number}.mp3"
            )

            storage_key = (
                f"listening/"
                f"{test_id}/"
                f"section-{section_number}.mp3"
            )

            # Resume support
            if (
                output_file.exists()
                and output_file.stat().st_size > 1000
            ):

                skipped += 1

                print(
                    f"[SKIP] {test_id} "
                    f"Section {section_number}"
                )

            else:

                try:

                    print(
                        f"[TTS] Generating "
                        f"{test_id} "
                        f"Section {section_number}"
                    )

                    await generate_audio(
                        script,
                        output_file
                    )

                    generated += 1

                    print(
                        f"[OK] Generated: "
                        f"{output_file}"
                    )

                except Exception as error:

                    failed += 1

                    print(
                        f"[FAIL] TTS "
                        f"{test_id} "
                        f"Section {section_number}: "
                        f"{error}"
                    )

                    continue

            # Upload to B2
            if b2_client:

                try:

                    url = upload_to_b2(
                        b2_client,
                        output_file,
                        storage_key
                    )

                    print(
                        f"[B2] Uploaded: "
                        f"{url}"
                    )

                except Exception as error:

                    failed += 1

                    print(
                        f"[B2 FAIL] "
                        f"{test_id} "
                        f"Section {section_number}: "
                        f"{error}"
                    )

    print()
    print("======================================")
    print(" GENERATION COMPLETE")
    print("======================================")
    print(f"Total sections: {total}")
    print(f"Generated:      {generated}")
    print(f"Skipped:        {skipped}")
    print(f"Failed:         {failed}")
    print("======================================")

    if failed:
        sys.exit(2)


if __name__ == "__main__":
    asyncio.run(main())
