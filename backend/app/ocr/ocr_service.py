import re
import io
from typing import Optional
from PIL import Image
from app.schemas.ai import InvoiceParseResponse, InvoiceLineItem
from app.core.config import settings
from app.core.logging import logger


class OCRService:
    def __init__(self):
        if not settings.USE_VISION_LLM:
            try:
                import pytesseract
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
                self.tesseract = pytesseract
            except ImportError:
                logger.warning("pytesseract not installed - OCR will be limited")
                self.tesseract = None
        else:
            self.tesseract = None

    async def parse_invoice(self, file_bytes: bytes, filename: str) -> InvoiceParseResponse:
        """Parse invoice from image or PDF bytes."""
        if settings.USE_VISION_LLM:
            return await self._parse_with_vision_llm(file_bytes, filename)
        return await self._parse_with_tesseract(file_bytes, filename)

    async def _parse_with_tesseract(self, file_bytes: bytes, filename: str) -> InvoiceParseResponse:
        raw_text = ""
        try:
            if filename.lower().endswith(".pdf"):
                raw_text = await self._pdf_to_text(file_bytes)
            else:
                image = Image.open(io.BytesIO(file_bytes))
                raw_text = self.tesseract.image_to_string(image)
        except Exception as e:
            logger.error("OCR failed", error=str(e))
            return InvoiceParseResponse(
                supplier_name=None, invoice_date=None, invoice_number=None,
                line_items=[], grand_total=None, parse_confidence="low",
                raw_text=f"Parse error: {str(e)}"
            )

        return self._extract_invoice_data(raw_text)

    async def _pdf_to_text(self, pdf_bytes: bytes) -> str:
        """Convert PDF pages to text via Tesseract."""
        try:
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(pdf_bytes, dpi=200)
            texts = []
            for img in images:
                text = self.tesseract.image_to_string(img)
                texts.append(text)
            return "\n".join(texts)
        except Exception as e:
            logger.error("PDF conversion failed", error=str(e))
            return ""

    async def _parse_with_vision_llm(self, file_bytes: bytes, filename: str) -> InvoiceParseResponse:
        """Use OpenAI Vision to parse invoice."""
        import base64
        import json
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        b64 = base64.b64encode(file_bytes).decode()
        media_type = "application/pdf" if filename.lower().endswith(".pdf") else "image/jpeg"

        prompt = """Extract invoice data from this image and return ONLY valid JSON with this structure:
{
  "supplier_name": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "invoice_number": "string or null",
  "line_items": [{"name": "string", "qty": number, "unit_price": number, "total": number}],
  "grand_total": number or null
}"""
        try:
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{b64}"}},
                        {"type": "text", "text": prompt},
                    ]
                }],
                max_tokens=1500,
            )
            raw = response.choices[0].message.content.strip()
            # Strip markdown fences if present
            raw = re.sub(r"```json|```", "", raw).strip()
            data = json.loads(raw)
            items = [InvoiceLineItem(**item) for item in data.get("line_items", [])]
            return InvoiceParseResponse(
                supplier_name=data.get("supplier_name"),
                invoice_date=data.get("invoice_date"),
                invoice_number=data.get("invoice_number"),
                line_items=items,
                grand_total=data.get("grand_total"),
                parse_confidence="high",
            )
        except Exception as e:
            logger.error("Vision LLM parse failed", error=str(e))
            return InvoiceParseResponse(
                supplier_name=None, invoice_date=None, invoice_number=None,
                line_items=[], grand_total=None, parse_confidence="low",
                raw_text=str(e),
            )

    def _extract_invoice_data(self, text: str) -> InvoiceParseResponse:
        """Extract structured data from raw OCR text using regex heuristics."""
        supplier = self._extract_supplier(text)
        inv_date = self._extract_date(text)
        inv_number = self._extract_invoice_number(text)
        line_items = self._extract_line_items(text)
        grand_total = self._extract_grand_total(text)

        filled_fields = sum([
            bool(supplier), bool(inv_date), bool(inv_number),
            bool(line_items), bool(grand_total)
        ])
        confidence = "high" if filled_fields >= 4 else "medium" if filled_fields >= 2 else "low"

        return InvoiceParseResponse(
            supplier_name=supplier,
            invoice_date=inv_date,
            invoice_number=inv_number,
            line_items=line_items,
            grand_total=grand_total,
            parse_confidence=confidence,
            raw_text=text[:500] if text else None,
        )

    def _extract_supplier(self, text: str) -> Optional[str]:
        patterns = [r"(?:from|supplier|vendor|bill from)[:\s]+([A-Z][^\n]{2,50})", r"^([A-Z][A-Z\s&.,]{3,40})$"]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
            if m:
                return m.group(1).strip()
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        patterns = [
            r"(?:date|invoice date)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
            r"(\d{4}-\d{2}-\d{2})",
            r"(\d{1,2}/\d{1,2}/\d{4})",
        ]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return None

    def _extract_invoice_number(self, text: str) -> Optional[str]:
        m = re.search(r"(?:invoice\s*#?|inv\.?\s*#?|number)[:\s]+([A-Z0-9\-]{3,20})", text, re.IGNORECASE)
        return m.group(1).strip() if m else None

    def _extract_line_items(self, text: str) -> list[InvoiceLineItem]:
        """Parse table rows with qty/price patterns."""
        items = []
        pattern = re.compile(
            r"([A-Za-z][A-Za-z0-9\s\-]{2,40})\s+(\d+(?:\.\d+)?)\s+\$?(\d+(?:\.\d+)?)\s+\$?(\d+(?:\.\d+)?)"
        )
        for m in pattern.finditer(text):
            try:
                items.append(InvoiceLineItem(
                    name=m.group(1).strip(),
                    qty=float(m.group(2)),
                    unit_price=float(m.group(3)),
                    total=float(m.group(4)),
                ))
            except ValueError:
                continue
        return items

    def _extract_grand_total(self, text: str) -> Optional[float]:
        patterns = [
            r"(?:grand\s*total|total\s*amount|amount\s*due)[:\s]+\$?(\d+(?:\.\d+)?)",
            r"total[:\s]+\$?(\d{2,}(?:\.\d+)?)",
        ]
        for pat in patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                try:
                    return float(m.group(1))
                except ValueError:
                    continue
        return None