import re

class TextCleaner:
    """Pure-regex cleaning helpers, no external deps required."""

    @staticmethod
    def clean(text: str) -> str:
        text = re.sub(r'http\S+|www\.\S+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    @staticmethod
    def strip_html(text: str) -> str:
        """Return text as-is to preserve HTML tags for rendering literally."""
        return text or ''

cleaner = TextCleaner()
