export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: {
      status?: number;
      data?: {
        message?: string | string[];
        detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>;
        error?: string;
        errors?: string[];
      };
    };
    message?: string;
  };

  const data = err?.response?.data;

  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(", ") : data.message;
  }
  if (typeof data?.detail === "string") {
    return data.detail;
  }
  if (Array.isArray(data?.detail)) {
    const formatted = data.detail
      .map((d) => {
        const field = Array.isArray(d?.loc) ? d.loc.join(".") : "";
        return field ? `${field}: ${d?.msg ?? ""}` : (d?.msg ?? "");
      })
      .filter(Boolean);
    if (formatted.length > 0) return formatted.join("; ");
  }
  if (typeof data?.error === "string") {
    return data.error;
  }
  if (Array.isArray(data?.errors)) {
    return data.errors.join("; ");
  }
  if (err?.message) {
    return err.message;
  }
  return fallback;
}
