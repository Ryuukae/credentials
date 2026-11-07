import { assetUrl, escapeHtml, formatDate } from '../utils/format.js';

// Home's `spark-btn` pill, with tighter padding below 480px so three fit on a phone.
const BTN_CLASS =
  'spark-btn flex items-center gap-2 px-3 py-2 min-[480px]:px-5 min-[480px]:py-2.5 rounded-full border border-cyan-900/30 text-cyan-400 hover:text-white hover:bg-cyan-900/30 hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-500 ease-in-out text-sm font-medium !font-sans cursor-pointer';

// Card image sizes follow the grid: one column on phones, two on tablets, three on desktop.
const IMAGE_SIZES = '(min-width: 1024px) 400px, (min-width: 768px) 46vw, 92vw';

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
      'cert-item group/card repo-item-font fade-in relative bg-black/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] cursor-pointer flex flex-col border border-cyan-900/30 hover:border-cyan-900/80 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] hover:-translate-y-2 active:scale-[0.96] transition-all duration-500 ease-in-out overflow-hidden';
    li.dataset.certId = cert.id;

    const verify = cert.verifyUrl
      ? `<a href="${escapeHtml(cert.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="${BTN_CLASS}" aria-label="Verify ${escapeHtml(cert.title)}"><i class="fas fa-check-circle"></i> <span>Verify</span></a>`
      : `<button type="button" class="${BTN_CLASS}" aria-label="How to verify ${escapeHtml(cert.title)}"><i class="fas fa-check-circle"></i> <span>Verify</span></button>`;

    li.innerHTML = `
      <i class="fas fa-external-link-alt absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 group-hover/card:text-cyan-400 group-hover/card:translate-x-1 group-has-[a:hover]/card:!text-slate-400 group-has-[a:hover]/card:!translate-x-0 transition-all duration-300 z-10 text-lg pointer-events-none"></i>
      <div class="flex flex-col flex-1 p-4 sm:p-5">
        <div class="mb-3 pr-8">
          <span class="cred-title repo-name-font w-full mb-1 font-bold">${escapeHtml(cert.title)}</span>
          <p class="cred-meta">${escapeHtml(cert.issuer)}${cert.provider !== cert.issuer ? ` · ${escapeHtml(cert.provider)}` : ''} · ${formatDate(cert.date)}</p>
        </div>
        <div class="cred-frame overflow-hidden w-full rounded-xl border border-cyan-500/40 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
          <img alt="${escapeHtml(cert.imageAlt)}" src="${assetUrl(cert.image)}" srcset="${assetUrl(cert.image)} 1100w, ${assetUrl(cert.image2x)} 2200w" sizes="${IMAGE_SIZES}" loading="lazy" decoding="async">
        </div>
        <div class="flex flex-wrap items-center gap-2 mt-auto pt-4 w-full">
          <a href="${assetUrl(cert.pdf)}" target="_blank" rel="noopener noreferrer" class="${BTN_CLASS}" aria-label="View ${escapeHtml(cert.title)} PDF"><i class="fas fa-eye"></i> <span>View</span></a>
          <a href="${assetUrl(cert.pdf)}" download class="${BTN_CLASS}" aria-label="Download ${escapeHtml(cert.title)} PDF"><i class="fas fa-download"></i> <span>Download</span></a>
          ${verify}
        </div>
      </div>
    `;

    return li;
  }
}
