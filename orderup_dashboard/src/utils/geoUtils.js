/**
 * Ported from orderup_core/lib/utils/geo_utils.dart
 */

function shortenAddress(address) {
  if (!address) return '';
  const stripSuffixes = ['south africa', 'za', 'rsa'];

  let parts = address
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Remove trailing parts that look like a country name
  while (parts.length > 0 && stripSuffixes.includes(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }

  // Remove trailing parts that look like a postal code (all digits)
  while (parts.length > 0 && /^\d+$/.test(parts[parts.length - 1])) {
    parts.pop();
  }

  // Keep at most 2 parts (e.g. street + suburb)
  if (parts.length > 2) {
    parts = parts.slice(0, 2);
  }

  return parts.join(', ');
}

/**
 * Extracts a display-friendly location string from raw Firestore shop data.
 */
export function pickDisplayLocation(data) {
  if (!data) return null;

  const display = (data.displayAddress || '').trim();
  if (display) return shortenAddress(display);

  const place = (data.placeName || '').trim();
  if (place) return shortenAddress(place);

  const area = (data.areaName || '').trim();
  const line = (data.addressLine || '').trim();

  const pieces = [];
  if (area) pieces.add(area);
  if (line) pieces.add(line);

  if (pieces.length === 0) return null;
  return shortenAddress(pieces.join(', '));
}
