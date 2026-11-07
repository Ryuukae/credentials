// Builds the filter bar DOM once and then updates it in place, so focus and
// scroll position never jump. No site-specific names: labels come from config.

let instanceCount = 0;

/**
 * Creates an element with a class name and optional attributes.
 * @param {string} tag - The tag name.
 * @param {string} className - The class list.
 * @param {Object<string, string>} [attrs] - Attributes to set.
 * @returns {HTMLElement} - The new element.
 */
function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  node.className = className;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

const chipId = (facetKey, value) => `${facetKey}\u0000${value}`;

/**
 * The filter bar view. It owns the DOM only; all state lives in `FilterBar`.
 */
export class FilterBarView {
  /**
   * @param {object} options - View options.
   * @param {HTMLElement} options.mount - Element the bar is appended to.
   * @param {object} options.config - The filter config.
   * @param {Object<string, string[]>} options.facetValues - Chip values per facet key.
   * @param {{onToggle: Function, onSort: Function, onClear: Function}} options.handlers - Callbacks.
   */
  constructor({ mount, config, facetValues, handlers }) {
    this.mount = mount;
    this.config = config;
    this.facetValues = facetValues;
    this.handlers = handlers;
    this.chips = new Map();
    this.uid = `fb${++instanceCount}`;
  }

  /** Builds the bar and appends it to the mount. Call once. */
  build() {
    const { config, uid } = this;
    const bar = el('div', 'fb-bar');

    const head = el('div', 'fb-head');
    this.count = el('p', 'fb-count', { 'aria-live': 'polite' });
    this.clearButton = el('button', 'fb-clear', { type: 'button' });
    this.clearButton.textContent = 'Clear all';
    this.clearButton.addEventListener('click', () => this.handlers.onClear());

    const sortWrap = el('div', 'fb-sort');
    const sortLabel = el('label', 'fb-label', { for: `${uid}-sort` });
    sortLabel.textContent = 'Sort';
    this.sortSelect = el('select', 'fb-select', { id: `${uid}-sort` });
    for (const sort of config.sorts) {
      const option = el('option', '', { value: sort.key });
      option.textContent = sort.label;
      this.sortSelect.append(option);
    }
    this.sortSelect.addEventListener('change', () => this.handlers.onSort(this.sortSelect.value));
    sortWrap.append(sortLabel, this.sortSelect);

    const panelId = `${uid}-panel`;
    this.toggle = el('button', 'fb-toggle', {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': panelId,
    });
    this.toggle.addEventListener('click', () => {
      const open = this.toggle.getAttribute('aria-expanded') !== 'true';
      this.toggle.setAttribute('aria-expanded', String(open));
      bar.dataset.open = String(open);
    });

    head.append(this.count, this.clearButton, sortWrap, this.toggle);

    const panel = el('div', 'fb-panel', { id: panelId });
    for (const facet of config.facets) panel.append(this.buildFacet(facet));

    bar.append(head, panel);
    this.bar = bar;
    this.mount.append(bar);
  }

  /**
   * Builds one labelled chip group.
   * @param {object} facet - The facet config.
   * @returns {HTMLElement} - The group element.
   */
  buildFacet(facet) {
    const labelId = `${this.uid}-${facet.key}-label`;
    const group = el('div', 'fb-facet', { role: 'group', 'aria-labelledby': labelId });
    const label = el('span', 'fb-label', { id: labelId });
    label.textContent = facet.label;
    const chips = el('div', 'fb-chips');

    for (const value of this.facetValues[facet.key]) {
      const chip = el('button', 'fb-chip', { type: 'button', 'aria-pressed': 'false' });
      const text = el('span', 'fb-chip-text');
      text.textContent = value;
      const number = el('span', 'fb-chip-count');
      chip.append(text, number);
      chip.addEventListener('click', () => {
        if (chip.getAttribute('aria-disabled') === 'true') return;
        this.handlers.onToggle(facet.key, value);
      });
      this.chips.set(chipId(facet.key, value), { chip, number });
      chips.append(chip);
    }
    group.append(label, chips);
    return group;
  }

  /**
   * Updates the bar to match a state without rebuilding it.
   * @param {object} view - What to show.
   * @param {{selection: Object<string, string[]>, sort: string}} view.state - The current state.
   * @param {(facetKey: string, value: string) => number} view.countFor - Results if a chip were added.
   * @param {number} view.shown - Records shown.
   * @param {number} view.total - All records.
   */
  render({ state, countFor, shown, total }) {
    const { config } = this;
    const noun = total === 1 ? config.noun.one : config.noun.other;
    this.count.textContent = `Showing ${shown} of ${total} ${noun}`;

    let active = 0;
    for (const facet of config.facets) {
      const selected = state.selection[facet.key] ?? [];
      active += selected.length;
      for (const value of this.facetValues[facet.key]) {
        const { chip, number } = this.chips.get(chipId(facet.key, value));
        const pressed = selected.includes(value);
        const count = countFor(facet.key, value);
        chip.setAttribute('aria-pressed', String(pressed));
        // aria-disabled (not `disabled`) keeps the chip focusable, so focus survives.
        chip.setAttribute('aria-disabled', String(!pressed && count === 0));
        number.textContent = String(count);
      }
    }

    this.sortSelect.value = state.sort;
    this.clearButton.hidden = active === 0 && state.sort === config.defaultSort;
    this.toggle.textContent = active > 0 ? `Filters · ${active}` : 'Filters';
  }

  /** Removes the bar from the page. */
  destroy() {
    this.bar?.remove();
    this.chips.clear();
  }
}
