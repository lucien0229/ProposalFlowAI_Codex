from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf_bytes(payload: bytes) -> str:
    reader = PdfReader(BytesIO(payload))
    text_parts: list[str] = []

    for page in reader.pages:
      extracted = page.extract_text() or ""
      if extracted.strip():
          text_parts.append(extracted.strip())

    extracted_text = "\n\n".join(text_parts).strip()
    if not extracted_text:
        raise ValueError("No extractable text found. OCR is not part of the MVP pipeline.")

    return extracted_text

