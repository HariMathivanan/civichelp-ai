import re
from typing import Tuple

# Regex patterns for sensitive Indian PII
AADHAAR_PATTERN = re.compile(r'\b\d{4}[ -]?\d{4}[ -]?\d{4}\b')
PAN_PATTERN = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', re.IGNORECASE)
OTP_PATTERN = re.compile(r'\b(otp|one time password|cvv|password)[\s:]*([0-9]{4,8}|[a-zA-Z0-9!@#$%^&*]{6,20})\b', re.IGNORECASE)

class PIISanitizer:
    """Detects and redacts sensitive personal identification numbers to uphold citizen privacy."""

    @staticmethod
    def sanitize_query(query: str) -> Tuple[str, bool]:
        """
        Replaces detected Aadhaar, PAN, OTP, and credentials with safe placeholders.
        Returns: (sanitized_query, was_pii_detected)
        """
        pii_detected = False

        if AADHAAR_PATTERN.search(query):
            query = AADHAAR_PATTERN.sub("[REDACTED_AADHAAR_NUMBER]", query)
            pii_detected = True

        if PAN_PATTERN.search(query):
            query = PAN_PATTERN.sub("[REDACTED_PAN_NUMBER]", query)
            pii_detected = True

        if OTP_PATTERN.search(query):
            query = OTP_PATTERN.sub(r"\1: [REDACTED_CREDENTIAL]", query)
            pii_detected = True

        return query, pii_detected
