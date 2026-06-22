import LZString from 'lz-string';

const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } = LZString;

/**
 * Encode a greeting data object into a compressed string (lz-string output,
 * not yet URL-encoded — call buildShareUrl to get a full URL-safe value).
 * @param {object} greetingObject
 * @returns {string}
 */
export function encodeGreetingData(greetingObject) {
  return compressToEncodedURIComponent(JSON.stringify(greetingObject));
}

/**
 * Decode a compressed string back to a greeting data object.
 * The string must be the raw lz-string value (URL-decoded by the caller).
 * @param {string} encodedString
 * @returns {object|null}
 */
export function decodeGreetingData(encodedString) {
  if (!encodedString || typeof encodedString !== 'string') return null;
  try {
    const json = decompressFromEncodedURIComponent(encodedString);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Build a full shareable URL.
 *
 * Applies encodeURIComponent to the lz-string output so that characters
 * with special meaning in query strings (notably '+') survive the
 * application/x-www-form-urlencoded parsing that URLSearchParams does.
 *
 * @param {object} greetingObject
 * @param {string} baseUrl  e.g. 'https://example.com'
 * @returns {string}
 */
export function buildShareUrl(greetingObject, baseUrl) {
  const compressed = encodeGreetingData(greetingObject);
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}?d=${encodeURIComponent(compressed)}`;
}

/**
 * Parse greeting data from window.location.search.
 *
 * URLSearchParams.get() already decodes percent-encoding, so
 * encodeURIComponent → URLSearchParams.get is a perfect roundtrip.
 *
 * @returns {object|null}
 */
export function parseUrlData() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('d');
  if (!encoded) return null;
  return decodeGreetingData(encoded);
}
