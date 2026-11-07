import { assetUrl, escapeHtml, formatDate } from '../utils/format.js';

// Home's repo-card link style: muted text that turns cyan and nudges right on hover.
const LINK_CLASS =
  'flex items-center gap-2 text-slate-400 hover:text-cyan-400 hover:translate-x-1 hover-pulse-blue transition-all duration-300 !font-sans !font-normal text-[clamp(0.8rem,1vw,0.9rem)] cursor-pointer';

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
      ? `<a href="${escapeHtml(cert.verifyUrl)}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}" aria-label="Verify ${escapeHtml(cert.title)}"><i class="fas fa-check-circle"></i> <span class="italic">Verify</span></a>`
      : `<button type="button" class="${LINK_CLASS}" aria-label="How to verify ${escapeHtml(cert.title)}"><i class="fas fa-check-circle"></i> <span class="italic">Verify</span></button>`;

    li.innerHTML = `
      <i class="fas fa-external-link-alt absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 group-hover/card:text-cyan-400 group-hover/card:translate-x-1 group-has-[a:hover]/card:!text-slate-400 group-has-[a:hover]/card:!translate-x-0 transition-all duration-300 z-10 text-lg pointer-events-none"></i>
      <div class="flex flex-col flex-1">
        <div class="pl-4 pt-4 sm:pl-5 sm:pt-5 mb-3 pr-12">
          <span class="cred-title repo-name-font w-full mb-1 font-bold">${escapeHtml(cert.title)}</span>
          <p class="cred-meta">${escapeHtml(cert.issuer)}${cert.provider !== cert.issuer ? ` · ${escapeHtml(cert.provider)}` : ''} · ${formatDate(cert.date)}</p>
        </div>
        <div class="cred-frame w-full border-y border-cyan-500/30">
          <img alt="${escapeHtml(cert.imageAlt)}" src="${assetUrl(cert.image)}" srcset="${assetUrl(cert.image)} 1100w, ${assetUrl(cert.image2x)} 2200w" sizes="${IMAGE_SIZES}" loading="lazy" decoding="async">
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-auto mx-4 sm:mx-5 mb-4 sm:mb-5 pt-3 border-t border-[var(--blue-5)]/20">
          <a href="${assetUrl(cert.pdf)}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}" aria-label="View ${escapeHtml(cert.title)} PDF"><i class="fas fa-eye"></i> <span class="italic">View</span></a>
          <a href="${assetUrl(cert.pdf)}" download class="${LINK_CLASS}" aria-label="Download ${escapeHtml(cert.title)} PDF"><i class="fas fa-download"></i> <span class="italic">Download</span></a>
          ${verify}
        </div>
      </div>
    `;

    CertificateCardFactory.enableZoom(li.querySelector('.cred-frame'));
    return li;
  }

  /**
   * Adds a hover magnifier: on mouse devices the image enlarges under the pointer
   * so the small print is readable without making the card bigger. The image is
   * always shrunk to fit the frame, so the whole certificate shows at rest.
   * @param {HTMLElement} frame - The image frame.
   */
  static enableZoom(frame) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // Measure the frame, not the scaled image, so the zoom point never feeds back into itself.
    const percent = (value, start, size) =>
      `${Math.min(100, Math.max(0, ((value - start) / size) * 100))}%`;
    let frameId = 0;
    let latest = null;
    const apply = () => {
      frameId = 0;
      const box = frame.getBoundingClientRect();
      frame.style.setProperty('--zx', percent(latest.clientX, box.left, box.width));
      frame.style.setProperty('--zy', percent(latest.clientY, box.top, box.height));
    };
    const track = (event) => {
      latest = event;
      if (!frameId) frameId = requestAnimationFrame(apply);
    };

    frame.addEventListener('pointerenter', track, { passive: true });
    frame.addEventListener('pointermove', track, { passive: true });
    frame.addEventListener(
      'pointerleave',
      () => {
        cancelAnimationFrame(frameId);
        frameId = 0;
        frame.style.setProperty('--zx', '50%');
        frame.style.setProperty('--zy', '50%');
      },
      { passive: true }
    );
  }
}
