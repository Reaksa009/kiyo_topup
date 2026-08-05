const SECRET_KEY_PATTERN = /^(?:key|api_?key|secret|api_?secret|token|access_?token|authorization|password|client_?secret|signature)$/i;
const REDACTED = '[REDACTED]';

const isSensitiveKey = (key: string) => SECRET_KEY_PATTERN.test(key.replace(/[-\s]/g, '_'));

export const redactSensitiveData = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redactSensitiveData);
  if (typeof value === 'string') return redactSensitiveUrl(value);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redactSensitiveData(entry)
    ])
  );
};

export const redactSensitiveUrl = (value: string): string => {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (isSensitiveKey(key)) url.searchParams.set(key, REDACTED);
    }
    return url.toString();
  } catch {
    if (!value.includes('=')) return value;
    const params = new URLSearchParams(value);
    let changed = false;
    for (const key of [...params.keys()]) {
      if (isSensitiveKey(key)) {
        params.set(key, REDACTED);
        changed = true;
      }
    }
    return changed ? params.toString() : value;
  }
};

export const redactProviderLogData = (value: unknown): unknown => {
  if (typeof value === 'string') return redactSensitiveUrl(value);
  return redactSensitiveData(value);
};

export { REDACTED };
