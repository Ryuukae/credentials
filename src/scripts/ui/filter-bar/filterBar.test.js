import { test, expect } from 'vitest';
import {
  validateConfig,
  deriveFacetValues,
  matches,
  filterRecords,
  countIfAdded,
  sortRecords,
  groupRecords,
} from './filterModel.js';
import { parse, serialize } from './urlState.js';

const records = [
  { id: 'a', title: 'Alpha', date: '2026-01-01', provider: 'Google', topics: ['AI', 'Web'] },
  { id: 'b', title: 'Beta', date: '2026-03-01', provider: 'Meta', topics: ['Web'] },
  { id: 'c', title: 'Gamma', date: '2025-06-01', provider: 'Google', topics: ['Java'] },
  { id: 'd', title: 'Delta', date: '2026-02-01', provider: 'Meta', topics: ['Web', 'Java'] },
];

const byDateDesc = (x, y) => y.date.localeCompare(x.date);
const config = {
  facets: [
    { key: 'provider', label: 'Provider', get: (r) => [r.provider], order: 'alpha' },
    {
      key: 'topic',
      label: 'Topic',
      get: (r) => r.topics,
      order: 'declared',
      values: ['AI', 'Web', 'Java', 'Unused'],
    },
  ],
  sorts: [
    { key: 'none', label: 'None' },
    { key: 'new', label: 'Newest', compare: byDateDesc },
    { key: 'az', label: 'A to Z', compare: (x, y) => x.title.localeCompare(y.title) },
    {
      key: 'provider',
      label: 'Provider',
      compare: byDateDesc,
      group: (r) => r.provider,
      groupOrder: 'alpha',
    },
  ],
  defaultSort: 'none',
  slug: (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
};
const ids = (list) => list.map((r) => r.id);

test('deriveFacetValues orders alpha, count and declared', () => {
  expect(deriveFacetValues(records, config.facets[0])).toEqual(['Google', 'Meta']);
  expect(deriveFacetValues(records, config.facets[1])).toEqual(['AI', 'Web', 'Java', 'Unused']);
  const byCount = { ...config.facets[1], order: 'count' };
  expect(deriveFacetValues(records, byCount)).toEqual(['Web', 'Java', 'AI']);
});

test('filters AND across values and across facets', () => {
  const { facets } = config;
  expect(ids(filterRecords(records, {}, facets))).toEqual(['a', 'b', 'c', 'd']);
  expect(ids(filterRecords(records, { topic: ['Web'] }, facets))).toEqual(['a', 'b', 'd']);
  expect(ids(filterRecords(records, { topic: ['Web', 'Java'] }, facets))).toEqual(['d']);
  const both = { provider: ['Meta'], topic: ['Web'] };
  expect(ids(filterRecords(records, both, facets))).toEqual(['b', 'd']);
  expect(matches(records[0], { provider: ['Meta'] }, facets)).toBe(false);
});

test('countIfAdded counts the narrowed result and never double counts', () => {
  const { facets } = config;
  expect(countIfAdded(records, {}, facets, 'topic', 'Web')).toBe(3);
  expect(countIfAdded(records, { topic: ['Web'] }, facets, 'topic', 'Java')).toBe(1);
  expect(countIfAdded(records, { topic: ['Web'] }, facets, 'topic', 'Web')).toBe(3);
  expect(countIfAdded(records, { provider: ['Google'] }, facets, 'topic', 'Unused')).toBe(0);
});

test('sortRecords keeps input order without compare and does not mutate', () => {
  const input = [...records];
  expect(ids(sortRecords(input, config.sorts[0]))).toEqual(['a', 'b', 'c', 'd']);
  expect(ids(sortRecords(input, config.sorts[1]))).toEqual(['b', 'd', 'a', 'c']);
  expect(ids(sortRecords(input, config.sorts[2]))).toEqual(['a', 'b', 'd', 'c']);
  expect(ids(input)).toEqual(['a', 'b', 'c', 'd']);
});

test('groupRecords returns one unlabelled group, or alpha groups sorted inside', () => {
  const flat = groupRecords(records, config.sorts[0]);
  expect(flat).toHaveLength(1);
  expect(flat[0].label).toBe('');
  const grouped = groupRecords(records, config.sorts[3]);
  expect(grouped.map((g) => [g.label, ids(g.items)])).toEqual([
    ['Google', ['a', 'c']],
    ['Meta', ['b', 'd']],
  ]);
});

test('validateConfig accepts a good config and names the problem in a bad one', () => {
  expect(() => validateConfig(config)).not.toThrow();
  expect(() => validateConfig({ ...config, defaultSort: 'nope' })).toThrow(/defaultSort/);
  expect(() => validateConfig({ ...config, slug: null })).toThrow(/slug/);
  const noValues = { ...config, facets: [{ ...config.facets[1], values: undefined }] };
  expect(() => validateConfig(noValues)).toThrow(/values list/);
  const repeated = { ...config, facets: [config.facets[0], config.facets[0]] };
  expect(() => validateConfig(repeated)).toThrow(/repeated/);
});

const known = { provider: ['Google', 'Meta'], topic: ['AI', 'Web', 'Java'] };

test('url state round-trips and leaves out defaults', () => {
  const state = { selection: { provider: ['Meta'], topic: ['Web', 'Java'] }, sort: 'new' };
  const search = serialize(state, config);
  expect(search).toBe('?provider=meta&topic=web,java&sort=new');
  expect(parse(search, config, known)).toEqual(state);
  expect(serialize({ selection: {}, sort: 'none' }, config)).toBe('');
});

test('parse drops unknown values, bad sorts and repeats', () => {
  const state = parse('?provider=meta,nobody&topic=web,web,zzz&sort=bogus', config, known);
  expect(state).toEqual({ selection: { provider: ['Meta'], topic: ['Web'] }, sort: 'none' });
  expect(parse('', config, known)).toEqual({ selection: {}, sort: 'none' });
  expect(parse('?topic=zzz', config, known).selection).toEqual({});
});

test('parse ignores unrelated params', () => {
  const state = parse('?utm=1&topic=ai', config, known);
  expect(state.selection).toEqual({ topic: ['AI'] });
});
