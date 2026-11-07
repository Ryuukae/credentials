import { TOPIC } from '../data/certificates.js';

// ISO dates sort correctly as plain strings.
const byDateDesc = (a, b) => b.date.localeCompare(a.date);
const byDateAsc = (a, b) => a.date.localeCompare(b.date);
const byTitle = (a, b) => a.title.localeCompare(b.title);

/** Filter, sort and group options for the credentials gallery. */
export const filterConfig = {
  facets: [
    { key: 'provider', label: 'Provider', get: (r) => [r.provider], order: 'alpha' },
    {
      key: 'topic',
      label: 'Topic',
      get: (r) => r.topics,
      order: 'declared',
      values: Object.values(TOPIC),
    },
  ],
  sorts: [
    { key: 'none', label: 'None' },
    {
      key: 'provider',
      label: 'Provider (grouped)',
      compare: byDateDesc,
      group: (r) => r.provider,
      groupOrder: 'alpha',
    },
    { key: 'new', label: 'Newest', compare: byDateDesc },
    { key: 'old', label: 'Oldest', compare: byDateAsc },
    { key: 'az', label: 'A to Z', compare: byTitle },
  ],
  defaultSort: 'none',
  noun: { one: 'credential', other: 'credentials' },
  slug: (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
};
