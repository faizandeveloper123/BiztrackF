export function buildWhatsAppShareLink(
  message: string,
  phoneDigits?: string | null,
): string {
  const text = encodeURIComponent(message);
  if (phoneDigits) {
    return `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${text}`;
  }
  return `https://api.whatsapp.com/send?text=${text}`;
}
