// Facade for the filter bar: owns the state, runs the model, drives the view
// and keeps the query string in sync. Generic: everything site-specific comes
// in through the config object.

import { FilterBarView } from './FilterBarView.js';
import {
  countIfAdded,
  deriveFacetValues,
  filterRecords,
  groupRecords,
  validateConfig,
} from './filterModel.js';
import { parse, serialize } from './urlState.js';

export class FilterBar {
  /**
   * @param {object} options - Bar options.
   * @param {HTMLElement} options.mount - Element the bar is built into.
   * @param {object[]} options.records - All records.
   * @param {object} options.config - The filter config.
   * @param {Function} options.onChange - Called with `{ state, groups, total, shown }`.
   */
  constructor({ mount, records, config, onChange }) {
    validateConfig(config);
    this.mount = mount;
    this.records = records;
    this.config = config;
    this.onChange = onChange;
    this.state = { selection: {}, sort: config.defaultSort };
    this.lastSearch = '';
    this.onPopState = this.onPopState.bind(this);
  }

  /** Builds the bar, applies the URL state and reports the first result. */
  init() {
    const { config, records } = this;
    this.known = Object.fromEntries(
      config.facets.map((facet) => [facet.key, deriveFacetValues(records, facet)])
    );
    this.view = new FilterBarView({
      mount: this.mount,
      config,
      facetValues: this.known,
      handlers: {
        onToggle: (facetKey, value) => this.toggle(facetKey, value),
        onSort: (sort) => this.setState({ sort }),
        onClear: () => this.clear(),
      },
    });
    this.view.build();

    this.state = parse(window.location.search, config, this.known);
    this.lastSearch = window.location.search;
    this.apply();
    window.addEventListener('popstate', this.onPopState);
  }

  /**
   * Returns a copy of the current state.
   * @returns {{selection: Object<string, string[]>, sort: string}} - The state.
   */
  getState() {
    return {
      selection: Object.fromEntries(
        Object.entries(this.state.selection).map(([key, values]) => [key, [...values]])
      ),
      sort: this.state.sort,
    };
  }

  /**
   * Merges a partial state in. Unknown values and sorts are dropped.
   * @param {{selection?: Object<string, string[]>, sort?: string}} partial - The changes.
   */
  setState(partial) {
    const next = serialize({ ...this.state, ...partial }, this.config);
    this.state = parse(next, this.config, this.known);
    this.apply({ writeUrl: true });
  }

  /** Resets every facet and the sort to their defaults. */
  clear() {
    this.setState({ selection: {}, sort: this.config.defaultSort });
  }

  /** Stops listening and removes the bar. */
  destroy() {
    window.removeEventListener('popstate', this.onPopState);
    this.view?.destroy();
  }

  toggle(facetKey, value) {
    const current = this.state.selection[facetKey] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.setState({ selection: { ...this.state.selection, [facetKey]: next } });
  }

  // Back/forward: re-read the query string, ignore hash-only changes (the modal uses the hash).
  onPopState() {
    if (window.location.search === this.lastSearch) return;
    this.lastSearch = window.location.search;
    this.state = parse(window.location.search, this.config, this.known);
    this.apply();
  }

  /**
   * Runs the model, updates the view, syncs the URL and reports the result.
   * @param {{writeUrl?: boolean}} [options] - Whether to write the state to the URL.
   */
  apply({ writeUrl = false } = {}) {
    const { config, records, state } = this;
    const matched = filterRecords(records, state.selection, config.facets);
    const sort = config.sorts.find((s) => s.key === state.sort);
    const groups = groupRecords(matched, sort);

    this.view.render({
      state,
      shown: matched.length,
      total: records.length,
      countFor: (facetKey, value) =>
        countIfAdded(records, state.selection, config.facets, facetKey, value),
    });
    if (writeUrl) this.writeUrl();
    this.onChange({ state: this.getState(), groups, total: records.length, shown: matched.length });
  }

  // replaceState keeps the back button free of filter noise and keeps the hash.
  writeUrl() {
    const search = serialize(this.state, this.config);
    if (search === window.location.search) return;
    const { pathname, hash } = window.location;
    window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
    this.lastSearch = window.location.search;
  }
}
