/**
 * Anonymous analytics — privacy-friendly page view tracking.
 *
 * No cookies. No fingerprinting. No third-party requests (unless the
 * user has opted in via a future backend integration).
 *
 * Currently this module only records local page-view counts in
 * localStorage and logs them to the console in development.  To
 * enable real analytics, replace the `_send` stub with a fetch()
 * or navigator.sendBeacon() call to your own endpoint.
 */

const STORAGE_KEY = '__gc_views';

/**
 * Call once after the greeting data has been parsed.
 *
 * @param {object} data  parsed greeting data (recipient, occasion, …)
 */
export function trackPageView(data) {
  // ---- Local counter (always safe) ---------------------------------------
  let record;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    record = raw ? JSON.parse(raw) : { total: 0, occasions: {} };
    record.total += 1;
    const occ = data.occasion || 'unknown';
    record.occasions[occ] = (record.occasions[occ] || 0) + 1;
    record.lastVisit = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (_) {
    // localStorage unavailable (private browsing, quota, …)
    record = null;
  }

  // ---- Debug log (stripped in production by drop_console) ----------------
  if (record) {
    console.log(
      `[Analytics] Page view #${record.total} | occasion: ${data.occasion || 'unknown'} | theme: ${data.occasion || 'birthday'}`,
    );
  }

  // ---- Remote beacon stub (uncomment when you have an endpoint) ----------
  // navigator.sendBeacon(
  //   '/api/analytics',
  //   JSON.stringify({ occasion: data.occasion, t: Date.now() }),
  // );
}
