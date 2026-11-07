import { CertificateCardFactory } from './CertificateCardFactory.js';

/**
 * Renders filtered, sorted and grouped certificate groups into a persistent root.
 * Cards are built once and cached by record id; a change only re-orders and
 * re-parents the cached nodes, so images never reload.
 * @author Adam Ross DeStafeno
 */
export class GalleryRenderer {
  /**
   * @param {HTMLElement} root - The persistent element the groups are rendered into.
   * @param {Function} [onClear] - Called by the empty-state "Clear all" button.
   */
  constructor(root, onClear = () => {}) {
    this.root = root;
    this.onClear = onClear;
    this.cards = new Map();
    this.render = this.render.bind(this);
  }

  /**
   * Replaces the root's content with the given groups.
   * @param {{groups: {key: string, label: string, items: object[]}[]}} result - Filter bar result.
   */
  render({ groups }) {
    const sections = [];
    let index = 0;
    for (const group of groups) {
      if (group.items.length === 0) continue;
      const list = document.createElement('ul');
      list.className = 'cred-grid';
      for (const cert of group.items) {
        const card = this.cardFor(cert);
        card.style.setProperty('--i', Math.min(index++, 15));
        list.append(card);
      }
      if (!group.label) {
        sections.push(list);
        continue;
      }
      const section = document.createElement('section');
      section.className = 'cred-group';
      const heading = document.createElement('h2');
      heading.className = 'cred-group-title';
      heading.textContent = `${group.label} · ${group.items.length}`;
      section.append(heading, list);
      sections.push(section);
    }
    this.root.replaceChildren(...(sections.length ? sections : [this.emptyState()]));
  }

  cardFor(cert) {
    if (!this.cards.has(cert.id)) this.cards.set(cert.id, CertificateCardFactory.createCard(cert));
    return this.cards.get(cert.id);
  }

  emptyState() {
    const box = document.createElement('div');
    box.className = 'cred-empty';
    const text = document.createElement('p');
    text.textContent = 'No credentials match these filters.';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fb-clear';
    button.textContent = 'Clear all';
    button.addEventListener('click', () => this.onClear());
    box.append(text, button);
    return box;
  }
}
