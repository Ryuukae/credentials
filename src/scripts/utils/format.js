/**
 * Small helpers for turning certificate data into safe, display-ready values.
 * @author Adam Ross DeStafeno
 */

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * Resolves a site-relative asset path against the Vite base URL.
 * @param {string} path - Path relative to the site root, such as `certificates/pdf/x.pdf`.
 * @returns {string} - The path prefixed with the configured base.
 */
export function assetUrl(path) {
  return `${import.meta.env.BASE_URL}${path}`;
}

/**
 * Formats an ISO date (`YYYY-MM-DD`) as e.g. "Aug 22, 2024".
 * @param {string} iso - The ISO date string.
 * @returns {string} - The formatted date.
 */
export function formatDate(iso) {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Escapes text for safe interpolation into an HTML template string.
 * @param {unknown} value - The value to escape.
 * @returns {string} - The escaped string.
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
