export function extractErrorMessage(err) {
  if (!err) return '';

  // Axios/FastAPI style detail
  const detail = err?.response?.data?.detail ?? err?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // Pydantic validation errors: [{loc, msg, type, ...}]
    const msgs = detail
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d?.msg) return d.msg;
        if (d?.message) return d.message;
        try { return JSON.stringify(d); } catch { return String(d); }
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join('; ');
  }

  // Generic message fallbacks
  if (typeof err?.message === 'string') return err.message;
  const alt = err?.response?.data?.message ?? err?.message ?? (typeof err?.toString === 'function' ? err.toString() : undefined);
  if (typeof alt === 'string') return alt;

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
