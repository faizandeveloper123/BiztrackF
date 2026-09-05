import {
  ContactType,
  type Contact,
  type ContactAddressRow,
  type ContactSocialLinks,
} from '../../../../models/crm';

export function contactAddressCountriesDisplay(contact: Contact): string {
  const countries = new Set<string>();
  for (const a of contact.addresses || []) {
    const c = (a.country || '').trim();
    if (c) countries.add(c);
  }
  if (countries.size === 0) return '';
  return Array.from(countries).join(', ');
}

export function industryLabel(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function contactTypeDisplayLabel(contact: Contact): string {
  const raw = contact.contactType ?? ContactType.CUSTOMER;
  const s = String(raw);
  if (!s) return 'Customer';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function emptyAddressRow(): ContactAddressRow {
  return {
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };
}

export function defaultSocialLinks(): ContactSocialLinks {
  return {
    facebook: '',
    instagram: '',
    x: '',
    linkedin: '',
    skype: '',
    tiktok: '',
    threads: '',
  };
}

export function mergeSocialFromApi(
  s?: ContactSocialLinks | null,
): ContactSocialLinks {
  return { ...defaultSocialLinks(), ...(s || {}) };
}

export function birthdayInputFromApi(iso?: string | null): string {
  if (!iso) return '';
  const d = String(iso).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

export function nonEmptyAddressRows(
  rows: ContactAddressRow[] | undefined | null,
): ContactAddressRow[] {
  return (rows || []).filter((a) => {
    const blob = [
      a.label,
      a.line1,
      a.line2,
      a.city,
      a.state,
      a.postalCode,
      a.country,
    ]
      .map((x) => (x || '').trim())
      .join('');
    return blob.length > 0;
  });
}

export function buildAddressesPayload(rows: ContactAddressRow[] | undefined) {
  return nonEmptyAddressRows(rows);
}

export const CONTACT_SOCIAL_KEYS = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['x', 'X'],
  ['linkedin', 'LinkedIn'],
  ['skype', 'Skype'],
  ['tiktok', 'TikTok'],
  ['threads', 'Threads'],
] as const;
