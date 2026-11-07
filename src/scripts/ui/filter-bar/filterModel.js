// Pure filtering, sorting and grouping logic. No DOM, no site-specific names:
// everything comes in through the config object.

/**
 * Throws a clear error when a filter config is malformed.
 * @param {object} config - The filter config.
 */
export function validateConfig(config) {
  const fail = (message) => {
    throw new Error(`Invalid filter config: ${message}`);
  };
  if (!config || typeof config !== 'object') fail('config must be an object');
  if (!Array.isArray(config.facets) || config.facets.length === 0) fail('facets must be a list');
  if (!Array.isArray(config.sorts) || config.sorts.length === 0) fail('sorts must be a list');
  if (typeof config.slug !== 'function') fail('slug must be a function');

  const keys = new Set();
  for (const facet of config.facets) {
    if (!facet.key || keys.has(facet.key)) fail(`facet key "${facet.key}" is missing or repeated`);
    keys.add(facet.key);
    if (!facet.label) fail(`facet "${facet.key}" needs a label`);
    if (typeof facet.get !== 'function') fail(`facet "${facet.key}" needs a get function`);
    if (facet.order === 'declared' && !Array.isArray(facet.values)) {
      fail(`facet "${facet.key}" uses order "declared" so it needs a values list`);
    }
  }
  const sortKeys = new Set();
  for (const sort of config.sorts) {
    if (!sort.key || sortKeys.has(sort.key)) fail(`sort key "${sort.key}" is missing or repeated`);
    sortKeys.add(sort.key);
    if (!sort.label) fail(`sort "${sort.key}" needs a label`);
  }
  if (!sortKeys.has(config.defaultSort)) fail(`defaultSort "${config.defaultSort}" is not a sort`);
}

const valuesOf = (record, facet) => (facet.get(record) ?? []).filter((v) => v != null && v !== '');

/**
 * Lists the chip values of a facet, in the order the facet asks for.
 * @param {object[]} records - All records.
 * @param {object} facet - The facet config.
 * @returns {string[]} - The ordered values.
 */
export function deriveFacetValues(records, facet) {
  if (facet.order === 'declared') return [...facet.values];
  const counts = new Map();
  for (const record of records) {
    for (const value of new Set(valuesOf(record, facet))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  const values = [...counts.keys()];
  if (facet.order === 'count') {
    return values.sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
  }
  return values.sort((a, b) => a.localeCompare(b));
}

/**
 * True when the record carries every selected value in every facet (AND).
 * @param {object} record - The record to test.
 * @param {Object<string, string[]>} selection - Selected values per facet key.
 * @param {object[]} facets - The facet configs.
 * @returns {boolean} - Whether the record matches.
 */
export function matches(record, selection, facets) {
  return facets.every((facet) => {
    const selected = selection[facet.key] ?? [];
    if (selected.length === 0) return true;
    const have = valuesOf(record, facet);
    return selected.every((value) => have.includes(value));
  });
}

/**
 * Keeps the records that match the selection, in their input order.
 * @param {object[]} records - All records.
 * @param {Object<string, string[]>} selection - Selected values per facet key.
 * @param {object[]} facets - The facet configs.
 * @returns {object[]} - The matching records.
 */
export function filterRecords(records, selection, facets) {
  return records.filter((record) => matches(record, selection, facets));
}

/**
 * Counts the results if one more value were selected.
 * @param {object[]} records - All records.
 * @param {Object<string, string[]>} selection - The current selection.
 * @param {object[]} facets - The facet configs.
 * @param {string} facetKey - The facet of the chip.
 * @param {string} value - The chip value.
 * @returns {number} - The result count with the value added.
 */
export function countIfAdded(records, selection, facets, facetKey, value) {
  const current = selection[facetKey] ?? [];
  const next = {
    ...selection,
    [facetKey]: current.includes(value) ? current : [...current, value],
  };
  return filterRecords(records, next, facets).length;
}

/**
 * Returns a sorted copy. A sort without `compare` keeps the input order.
 * @param {object[]} records - The records to sort.
 * @param {object} sortOption - The sort config.
 * @returns {object[]} - The sorted copy.
 */
export function sortRecords(records, sortOption) {
  const copy = [...records];
  return sortOption?.compare ? copy.sort(sortOption.compare) : copy;
}

/**
 * Sorts and groups records. Without `group` the result is one unlabelled group.
 * @param {object[]} records - The records to arrange.
 * @param {object} sortOption - The sort config.
 * @returns {{key: string, label: string, items: object[]}[]} - The groups.
 */
export function groupRecords(records, sortOption) {
  const sorted = sortRecords(records, sortOption);
  if (!sortOption?.group) return [{ key: '', label: '', items: sorted }];

  const byKey = new Map();
  for (const record of sorted) {
    const label = sortOption.group(record);
    if (!byKey.has(label)) byKey.set(label, []);
    byKey.get(label).push(record);
  }
  const labels = [...byKey.keys()];
  if (sortOption.groupOrder === 'alpha') labels.sort((a, b) => a.localeCompare(b));
  return labels.map((label) => ({ key: label, label, items: byKey.get(label) }));
}
