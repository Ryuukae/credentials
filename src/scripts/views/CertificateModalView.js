import { assetUrl, formatDate } from '../utils/format.js';

const CHIP_CLASS =
  'px-3 py-1.5 rounded-full border border-cyan-900/50 bg-cyan-950/30 text-cyan-100 text-xs font-medium shadow-[0_0_10px_rgba(0,255,255,0.05)] cursor-default transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:bg-cyan-900/50 hover:text-white';
const BUTTON_CLASS =
  'flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/40 bg-cyan-950/30 text-cyan-100 text-sm hover:bg-cyan-900/50 hover:text-white hover:shadow-[0_0_15px_rgba(0,255,255,0.4)] transition-all duration-300';
const HEADING_CLASS =
  'text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-500/80 mb-3 flex items-center';

/**
 * Builds the modal content for a single certificate. All data is inserted with
 * DOM properties (`textContent`, `href`), never HTML strings, to avoid injection.
 * @author Adam Ross DeStafeno
 */
export class CertificateModalView {
  /**
   * @param {object} cert - The certificate record to display.
   */
  constructor(cert) {
    this.cert = cert;
    this.details = cert.details || {};
    this.view = this.buildBlueprint();
    this.hydrate();
  }

  /**
   * Returns the constructed DOM view.
   * @returns {HTMLElement} - The modal content container.
   */
  render() {
    return this.view;
  }

  /**
   * Parses the static template into a DOM node.
   * @private
   * @returns {HTMLElement} - The root container.
   */
  buildBlueprint() {
    const template = `
      <div class="modal-content-container relative w-[98vw] h-[98vh] max-w-[1900px] overflow-y-auto bg-black/90 backdrop-blur-3xl border border-cyan-500/50 shadow-[0_8px_32px_rgba(0,255,255,0.15)] rounded-3xl p-6 md:p-10 m-4 flex flex-col gap-6 animate-border-pulse" role="document">
        <button class="modal-close-btn absolute top-4 right-4 text-cyan-400 hover:text-white hover:scale-110 transition-all duration-300 text-3xl w-10 h-10 flex items-center justify-center bg-black/50 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(0,255,255,0.2)] cursor-pointer z-50" aria-label="Close modal">&times;</button>
        <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full lg:h-full">
          <div class="lg:w-3/5 flex flex-col min-h-[30vh] lg:min-h-0">
            <div class="relative flex-1 w-full rounded-2xl border border-cyan-500/20 bg-black/40 overflow-hidden flex items-center justify-center p-2">
              <img class="modal-main-image max-w-full max-h-[70vh] lg:max-h-full object-contain" src="" alt="">
            </div>
          </div>
          <div class="lg:w-2/5 flex flex-col lg:overflow-y-auto pr-2 custom-scrollbar">
            <h2 class="[animation:flash-pulse-blue_2.5s_infinite_ease-in-out] text-3xl md:text-4xl font-extrabold tracking-wide mb-2 shrink-0 pr-12">
              <span class="modal-title name-pulse-gradient"></span>
            </h2>
            <p class="modal-issuer text-slate-400 mb-6"></p>
            <div class="flex flex-col gap-8 pb-8">
              <dl class="modal-facts grid grid-cols-2 gap-x-6 gap-y-4 text-sm"></dl>
              <div class="modal-part-of hidden">
                <h3 class="${HEADING_CLASS}"><i class="fas fa-sitemap mr-2 opacity-80"></i>Part of</h3>
                <p class="modal-part-of-text text-[15px] text-slate-300/90 font-sans"></p>
              </div>
              <div class="modal-description hidden">
                <h3 class="${HEADING_CLASS}"><i class="fas fa-align-left mr-2 opacity-80"></i>About</h3>
                <p class="modal-description-text text-[15px] leading-relaxed text-slate-300/90 font-sans whitespace-pre-wrap"></p>
              </div>
              <div class="modal-skills hidden">
                <h3 class="${HEADING_CLASS}"><i class="fas fa-layer-group mr-2 opacity-80"></i>Skills</h3>
                <ul class="modal-skills-list flex flex-wrap gap-2"></ul>
              </div>
              <div class="modal-courses hidden">
                <h3 class="${HEADING_CLASS}"><i class="fas fa-book mr-2 opacity-80"></i>Courses</h3>
                <ul class="modal-courses-list list-disc pl-5 text-[15px] text-slate-300/90 font-sans flex flex-col gap-1"></ul>
              </div>
              <div class="modal-verify-note hidden">
                <h3 class="${HEADING_CLASS}"><i class="fas fa-check-circle mr-2 opacity-80"></i>How to verify</h3>
                <p class="modal-verify-note-text text-[15px] leading-relaxed text-slate-300/90 font-sans"></p>
              </div>
              <div class="modal-actions flex flex-wrap gap-3"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    const doc = new DOMParser().parseFromString(template, 'text/html');
    return doc.body.firstElementChild;
  }

  /**
   * Fills the template with the certificate's data.
   * @private
   */
  hydrate() {
    const { cert, details, view } = this;
    const q = (sel) => view.querySelector(sel);

    q('.modal-title').textContent = cert.title;
    q('.modal-issuer').textContent =
      cert.provider !== cert.issuer ? `${cert.issuer} · ${cert.provider}` : cert.issuer;

    const img = q('.modal-main-image');
    img.src = assetUrl(cert.image);
    img.alt = cert.imageAlt;

    this.hydrateFacts();

    this.show('.modal-part-of', details.partOf, '.modal-part-of-text');
    this.show('.modal-description', details.description, '.modal-description-text');
    this.show('.modal-verify-note', cert.verifyNote, '.modal-verify-note-text');

    this.fillList('.modal-skills', '.modal-skills-list', details.skills, CHIP_CLASS);
    this.fillList('.modal-courses', '.modal-courses-list', details.courses, '');

    this.hydrateActions();
  }

  /**
   * Shows a section and fills its text when the value exists.
   * @private
   * @param {string} sectionSel - Selector for the section wrapper.
   * @param {string|undefined} value - The text to display.
   * @param {string} textSel - Selector for the text node.
   */
  show(sectionSel, value, textSel) {
    if (!value) return;
    this.view.querySelector(textSel).textContent = value;
    this.view.querySelector(sectionSel).classList.remove('hidden');
  }

  /**
   * Fills a list section and shows it when items exist.
   * @private
   * @param {string} sectionSel - Selector for the section wrapper.
   * @param {string} listSel - Selector for the list element.
   * @param {string[]|undefined} items - The list items.
   * @param {string} itemClass - Class for each item.
   */
  fillList(sectionSel, listSel, items, itemClass) {
    if (!items || items.length === 0) return;
    const list = this.view.querySelector(listSel);
    items.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      if (itemClass) li.className = itemClass;
      list.appendChild(li);
    });
    this.view.querySelector(sectionSel).classList.remove('hidden');
  }

  /**
   * Adds the term/value pairs (issued, expires, duration, level, credential ID).
   * @private
   */
  hydrateFacts() {
    const { cert } = this;
    const facts = [
      ['Issued', formatDate(cert.date)],
      ['Expires', cert.expires ? formatDate(cert.expires) : null],
      ['Duration', cert.hours ? `${cert.hours} hours` : null],
      ['Level', cert.level],
      ['Credential ID', cert.credentialId],
    ].filter(([, value]) => value);

    const dl = this.view.querySelector('.modal-facts');
    facts.forEach(([term, value]) => {
      const wrap = document.createElement('div');
      if (term === 'Credential ID') wrap.className = 'col-span-2';
      const dt = document.createElement('dt');
      dt.className = 'text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-600 mb-1';
      dt.textContent = term;
      const dd = document.createElement('dd');
      dd.className = 'text-slate-200 break-all';
      dd.textContent = value;
      wrap.append(dt, dd);
      dl.appendChild(wrap);
    });
  }

  /**
   * Adds the View, Download and Verify buttons.
   * @private
   */
  hydrateActions() {
    const { cert } = this;
    const actions = this.view.querySelector('.modal-actions');

    const add = (icon, label, href, extra = {}) => {
      const a = document.createElement('a');
      a.href = href;
      a.className = BUTTON_CLASS;
      Object.entries(extra).forEach(([k, v]) => a.setAttribute(k, v));
      const i = document.createElement('i');
      i.className = `fas ${icon}`;
      a.append(i, ` ${label}`);
      actions.appendChild(a);
    };

    const external = { target: '_blank', rel: 'noopener noreferrer' };
    add('fa-eye', 'View', assetUrl(cert.pdf), external);
    add('fa-download', 'Download', assetUrl(cert.pdf), { download: '' });
    if (cert.verifyUrl) add('fa-check-circle', 'Verify', cert.verifyUrl, external);
  }
}
