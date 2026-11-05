import { trapFocus } from '../utils/focusTrap.js';

/**
 * The ModalRenderer class handles the DOM lifecycle, accessibility, and event binding
 * for the modal infrastructure. It is entirely decoupled from the view blueprints.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class ModalRenderer {
  /**
   * Initializes the renderer state.
   */
  constructor() {
    this.overlay = null;
    this.focusTeardown = null;
    this.previousFocus = null;

    // Explicitly bind methods to preserve the class context ('this') during DOM events
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
  }

  /**
   * Injects the modal into the DOM, applies accessibility attributes, and initializes focus trapping.
   * @param {HTMLElement} viewNode - The generated HTML node representing the modal content.
   */
  open(viewNode) {
    // Cache the currently focused element (the certificate card) to restore it on close
    this.previousFocus = document.activeElement;

    // Create the overlay container
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.appendChild(viewNode);

    // Inject into the DOM and lock background scrolling
    document.body.appendChild(this.overlay);
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');

    // Bind core teardown events
    document.addEventListener('keydown', this.handleKeyDown);
    this.overlay.addEventListener('mousedown', this.handleOverlayClick);

    const closeBtn = this.overlay.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', this.handleCloseClick);

    // Trigger CSS animation and trap focus on the next animation frame
    requestAnimationFrame(() => {
      if (!this.overlay) return;
      this.overlay.classList.add('open');
      this.focusTeardown = trapFocus(this.overlay);
    });
  }

  /**
   * Initiates the teardown sequence, safely unbinding events and removing DOM nodes.
   * @param {{updateHistory?: boolean}} [options] - Set `updateHistory` to false to leave the URL alone.
   */
  close({ updateHistory = true } = {}) {
    if (!this.overlay) return;

    this.overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');

    // Unbind all events explicitly to prevent memory leaks
    document.removeEventListener('keydown', this.handleKeyDown);
    this.overlay.removeEventListener('mousedown', this.handleOverlayClick);

    const closeBtn = this.overlay.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.removeEventListener('click', this.handleCloseClick);

    // Release the focus trap
    if (this.focusTeardown) {
      this.focusTeardown();
      this.focusTeardown = null;
    }

    // Delay exact DOM removal to allow the CSS fade-out animation to complete
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }

      // Return focus to the original trigger element for WCAG compliance
      if (this.previousFocus) {
        this.previousFocus.focus();
      }

      // Clear the URL hash fragment without triggering a page scroll jump
      if (updateHistory) {
        history.replaceState('', document.title, window.location.pathname + window.location.search);
      }
    }, 300);
  }

  /**
   * Evaluates keyboard events to close the modal if the Escape key is pressed.
   * @param {KeyboardEvent} e - The native keyboard event.
   */
  handleKeyDown(e) {
    if (e.key === 'Escape') this.close();
  }

  /**
   * Evaluates mouse events to close the modal if the user clicks strictly on the background overlay.
   * @param {MouseEvent} e - The native mouse event.
   */
  handleOverlayClick(e) {
    if (e.target === this.overlay) this.close();
  }

  /**
   * Closes the modal when the internal close button is clicked.
   */
  handleCloseClick() {
    this.close();
  }
}
