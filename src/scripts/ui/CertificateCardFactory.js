import { assetUrl, escapeHtml, formatDate } from '../utils/format.js';

const LINK_CLASS =
  'flex items-center gap-2 text-slate-400 hover:text-cyan-400 hover:translate-x-1 hover-pulse-blue transition-all duration-300 !font-sans !font-normal text-[clamp(0.8rem,1vw,0.9rem)]';

/**
 * Factory responsible for generating certificate card DOM elements.
 * @author Adam Ross DeStafeno
 */
export class CertificateCardFactory {
  /**
   * Generates a list item with the certificate image, summary and action buttons.
   * @param {object} cert - The certificate record.
   * @returns {HTMLLIElement} - The fully constructed <li> element.
   */
  static createCard(cert) {
    const li = document.createElement('li');
    li.className =
      'cert-item group/card repo-item-font fade-in relative bg-black/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] cursor-pointer flex flex-col border border-cyan-900/30 hover:border-cyan-900/80 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] hover:-translate-y-2 active:scale-[0.96] transition-all duration-500 ease-in-out overflow-hidden h-fit break-inside-avoid mb-6';
    li.dataset.certId = cert.id;

    const verify = cert.verifyUrl
      ? `<a href="${escapeHtml(cert.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}" aria-label="Verify ${escapeHtml(cert.title)}"><i class="fas fa-check-circle"></i> <span class="hidden sm:inline italic">Verify</span></a>`
      : `<button type="button" class="${LINK_CLASS}" aria-label="How to verify ${escapeHtml(cert.title)}"><i class="fas fa-check-circle"></i> <span class="hidden sm:inline italic">Verify</span></button>`;

    li.innerHTML = `
      <i class="fas fa-external-link-alt absolute top-6 right-6 text-slate-400 group-hover/card:text-cyan-400 group-hover/card:translate-x-1 group-has-[a:hover]/card:!text-slate-400 group-has-[a:hover]/card:!translate-x-0 transition-all duration-300 z-10 text-lg pointer-events-none"></i>
      <div class="flex flex-col p-6">
        <div class="mb-4 pr-8">
          <span class="repo-name-font block w-full mb-2 font-bold">${escapeHtml(cert.title)}</span>
          <p class="text-sm text-slate-400">${escapeHtml(cert.issuer)}${cert.provider !== cert.issuer ? ` · ${escapeHtml(cert.provider)}` : ''} · ${formatDate(cert.date)}</p>
        </div>
        <div class="relative overflow-hidden w-full bg-black rounded-xl border border-cyan-500/40 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
          <img alt="${escapeHtml(cert.imageAlt)}" src="${assetUrl(cert.image)}" loading="lazy" decoding="async" class="w-full h-auto">
          <div class="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none"></div>
        </div>
        <div class="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--blue-5)]/20 w-full">
          <a href="${assetUrl(cert.pdf)}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}" aria-label="View ${escapeHtml(cert.title)} PDF"><i class="fas fa-eye"></i> <span class="hidden sm:inline italic">View</span></a>
          <a href="${assetUrl(cert.pdf)}" download class="${LINK_CLASS}" aria-label="Download ${escapeHtml(cert.title)} PDF"><i class="fas fa-download"></i> <span class="hidden sm:inline italic">Download</span></a>
          ${verify}
        </div>
      </div>
    `;

    return li;
  }
}
