import json
from urllib import error, request

from django.conf import settings


LANGUAGE_NAME_MAP = {
    "en": "English",
    "english": "English",
    "hi": "Hindi",
    "hindi": "Hindi",
    "mr": "Marathi",
    "marathi": "Marathi",
    "ta": "Tamil",
    "tamil": "Tamil",
    "bn": "Bengali",
    "bengali": "Bengali",
}

LANGUAGE_FIELD_MAP = {
    "en": "english_lyrics",
    "hi": "hindi_lyrics",
    "mr": "marathi_lyrics",
    "ta": "tamil_lyrics",
    "bn": "bengali_lyrics",
}


def normalize_language_code(language_value):
    if language_value is None:
        return None

    normalized = str(language_value).strip().lower()
    if not normalized:
        return None

    if normalized in LANGUAGE_FIELD_MAP:
        return normalized

    for code, field_name in LANGUAGE_FIELD_MAP.items():
        if LANGUAGE_NAME_MAP.get(code, "").lower() == normalized:
            return code

    return None


def normalize_language_name(language_value):
    normalized_code = normalize_language_code(language_value)
    if normalized_code is None:
        return None
    return LANGUAGE_NAME_MAP[normalized_code]


def get_translation_field_name(language_value):
    normalized_code = normalize_language_code(language_value)
    if normalized_code is None:
        return None
    return LANGUAGE_FIELD_MAP[normalized_code]


def translate_lyrics_text(lyrics, source_language, target_language):
    cleaned_lyrics = str(lyrics or "").strip()
    if not cleaned_lyrics:
        raise ValueError("Lyrics are required for translation.")

    normalized_source_code = normalize_language_code(source_language)
    normalized_target_code = normalize_language_code(target_language)

    if normalized_source_code is None:  
        raise ValueError("Unsupported source language.")
    if normalized_target_code is None:
        raise ValueError("Unsupported target language.")
    if normalized_source_code == normalized_target_code:
        raise ValueError("Source and target languages must be different.")

    source_name = normalize_language_name(normalized_source_code)
    target_name = normalize_language_name(normalized_target_code)

    ollama_base_url = getattr(
        settings,
        "OLLAMA_TRANSLATION_URL",
        "http://10.129.131.171:7000/translate"
    ).rstrip("/")
    translation_path = getattr(settings, "OLLAMA_TRANSLATION_PATH", "").strip()
    timeout_seconds = getattr(settings, "OLLAMA_TRANSLATION_TIMEOUT", 90)

    payload = json.dumps(
        {
            "text": cleaned_lyrics,
            "source_lang": source_name,
            "target_lang": target_name,
        }
    ).encode("utf-8")

    request_url = ollama_base_url if not translation_path else f"{ollama_base_url}/{translation_path.lstrip('/')}"

    http_request = request.Request(
        request_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=timeout_seconds) as response:
            response_body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        raise Exception(
            f"Translation service returned HTTP {exc.code}: {error_body or exc.reason}"
        ) from exc
    except error.URLError as exc:
        raise Exception(f"Could not reach translation service: {exc.reason}") from exc

    try:
        response_data = json.loads(response_body)
    except json.JSONDecodeError as exc:
        raise Exception("Translation service returned invalid JSON.") from exc

    translated_text = str(
        response_data.get("translated_text")
        or response_data.get("translation")
        or response_data.get("translated_lyrics")
        or response_data.get("response")
        or ""
    ).strip()
    if not translated_text:
        raise Exception("Translation service returned an empty response.")

    return {
        "source_language": source_name,
        "target_language": target_name,
        "source_language_code": normalized_source_code,
        "target_language_code": normalized_target_code,
        "translated_lyrics": translated_text,
    }
