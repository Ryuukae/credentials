import { certificates } from '../data/certificates.js';
import { CertificateModalView } from '../views/CertificateModalView.js';
import { ModalRenderer } from '../renderers/ModalRenderer.js';

/**
 * Connects clicks on certificate cards to the modal, and supports deep links
 * such as `#coursera-meta-react-basics`.
 * @author Adam Ross DeStafeno
 */
export class ModalController {
  /**
   * @param {HTMLElement} containerElement - The DOM node containing the cards.
   */
  constructor(containerElement) {
    this.container = containerElement;
    this.renderer = new ModalRenderer();

    this.handleCardClick = this.handleCardClick.bind(this);
    this.handleHashChange = this.handleHashChange.bind(this);
  }

  /**
   * Starts listening for card clicks and hash changes, and opens a deep link.
   */
  init() {
    if (!this.container) return;
    this.container.addEventListener('click', this.handleCardClick);
    window.addEventListener('popstate', this.handleHashChange);
    this.openFromHash();
  }

  /**
   * Opens the modal for a clicked card, ignoring clicks on real links.
   * @private
   * @param {MouseEvent} event - The click event.
   */
  handleCardClick(event) {
    if (event.target.closest('a')) return;
    const card = event.target.closest('.cert-item');
    if (!card) return;
    this.openById(card.dataset.certId);
  }

  /**
   * Keeps the modal in step with browser back and forward navigation.
   * @private
   */
  handleHashChange() {
    if (window.location.hash) {
      this.openFromHash();
    } else if (this.renderer.overlay) {
      this.renderer.close({ updateHistory: false });
    }
  }

  /**
   * Opens the modal that matches the current URL hash, if any.
   * @private
   */
  openFromHash() {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || this.renderer.overlay) return;
    const cert = certificates.find((c) => c.id === id);
    if (cert) this.openModal(cert, { updateHistory: false });
  }

  /**
   * Looks up a certificate by id and opens its modal.
   * @private
   * @param {string} id - The certificate id.
   */
  openById(id) {
    const cert = certificates.find((c) => c.id === id);
    if (cert) this.openModal(cert, { updateHistory: true });
  }

  /**
   * Builds and shows the modal for a certificate.
   * @private
   * @param {object} cert - The certificate record.
   * @param {{updateHistory: boolean}} options - Whether to push the hash into history.
   */
  openModal(cert, { updateHistory }) {
    const node = new CertificateModalView(cert).render();
    this.renderer.open(node);
    if (updateHistory) history.pushState({ cert: cert.id }, document.title, `#${cert.id}`);
  }
}
