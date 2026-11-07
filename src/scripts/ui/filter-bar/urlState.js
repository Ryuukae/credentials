// Reads and writes the filter state in the query string. Values travel as
// slugs, unknown values are dropped, and the default sort is left out.
// Only the query string is handled here; the caller keeps `location.hash`.

const SORT_PARAM = 'sort';

const lookup = (config, values) => new Map(values.map((value) => [config.slug(value), value]));

/**
 * Parses a query string into a state.
 * @param {string} search - `location.search`, with or without the leading `?`.
 * @param {object} config - The filter config.
 * @param {Object<string, string[]>} known - Valid values per facet key.
 * @returns {{selection: Object<string, string[]>, sort: string}} - The state.
 */
export function parse(search, config, known) {
  const params = new URLSearchParams(search);
  const selection = {};
  for (const facet of config.facets) {
    const slugs = (params.get(facet.key) ?? '').split(',').filter(Boolean);
    const valid = lookup(config, known[facet.key] ?? []);
    const values = [...new Set(slugs.map((slug) => valid.get(slug)).filter(Boolean))];
    if (values.length) selection[facet.key] = values;
  }
  const sortKey = params.get(SORT_PARAM);
  const sort = config.sorts.some((s) => s.key === sortKey) ? sortKey : config.defaultSort;
  return { selection, sort };
}

/**
 * Serialises a state into a query string.
 * @param {{selection: Object<string, string[]>, sort: string}} state - The state.
 * @param {object} config - The filter config.
 * @returns {string} - `?a=b&...` or an empty string.
 */
export function serialize(state, config) {
  const params = new URLSearchParams();
  for (const facet of config.facets) {
    const values = state.selection[facet.key] ?? [];
    if (values.length) params.set(facet.key, values.map(config.slug).join(','));
  }
  if (state.sort && state.sort !== config.defaultSort) params.set(SORT_PARAM, state.sort);
  const text = params.toString().replace(/%2C/g, ',');
  return text ? `?${text}` : '';
}
