// Regex patterns for sensitive Indian PII
const AADHAAR_PATTERN = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;
const PAN_PATTERN = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi;
const OTP_PATTERN = /\b(otp|one time password|cvv|password)[\s:]*([0-9]{4,8}|[a-zA-Z0-9!@#$%^&*]{6,20})\b/gi;

function piiSanitizer(req, res, next) {
  if (req.body && typeof req.body.query === 'string') {
    let rawQuery = req.body.query.trim();

    if (!rawQuery) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'The query parameter cannot be empty.'
      });
    }

    if (rawQuery.length > 1000) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query length exceeds maximum allowed limit of 1000 characters.'
      });
    }

    let piiDetected = false;

    if (AADHAAR_PATTERN.test(rawQuery)) {
      rawQuery = rawQuery.replace(AADHAAR_PATTERN, '[REDACTED_AADHAAR_NUMBER]');
      piiDetected = true;
    }

    if (PAN_PATTERN.test(rawQuery)) {
      rawQuery = rawQuery.replace(PAN_PATTERN, '[REDACTED_PAN_NUMBER]');
      piiDetected = true;
    }

    if (OTP_PATTERN.test(rawQuery)) {
      rawQuery = rawQuery.replace(OTP_PATTERN, '$1: [REDACTED_CREDENTIAL]');
      piiDetected = true;
    }

    req.sanitizedQuery = rawQuery;
    req.piiDetected = piiDetected;
  }

  next();
}

module.exports = piiSanitizer;
