// A phone number as written on the site, e.g. "(504) 382-7479", turned into the
// international form phones and search engines expect: "+15043827479". A number already
// written with a leading + is kept as it is; a 10-digit US number gets the +1.
export function e164(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

export function telHref(phone: string | undefined | null): string {
  const n = e164(phone);
  return n ? `tel:${n}` : '';
}
