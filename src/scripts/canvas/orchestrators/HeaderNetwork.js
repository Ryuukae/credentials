import { AbstractStrand } from '../entities/AbstractStrand.js';
import { GeometricSphere } from '../entities/GeometricSphere.js';

/**
 * Orchestrator class for the header network animation system.
 * Manages the abstract particle strands and the 3D rotating geometric sphere.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class HeaderNetwork {
  /**
   * Initializes the header network orchestrator.
   * @param {string} canvasId - The ID of the target canvas element
   */
  constructor(canvasId = 'header-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.startTime = performance.now();

    this.strand = new AbstractStrand();
    this.sphere = new GeometricSphere();

    this.resizeHandler = this.resizeCanvas.bind(this);
    this.animateHandler = this.animate.bind(this);

    this.animationFrameId = null;
    this.observer = null;
  }

  /**
   * Starts the background simulation and attaches event listeners.
   */
  init() {
    if (!this.canvas) return;
    window.addEventListener('resize', this.resizeHandler);

    this.observer = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    if (this.canvas.parentElement) {
      this.observer.observe(this.canvas.parentElement);
    }

    this.resizeCanvas();
    this.animationFrameId = requestAnimationFrame(this.animateHandler);
  }

  /**
   * Cleans up event listeners and animation frames.
   */
  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resizeHandler);
    if (this.observer) this.observer.disconnect();
  }

  /**
   * Resizes the canvas to match its parent container and re-initializes meshes.
   */
  resizeCanvas() {
    if (!this.canvas.parentElement) return;
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    this.strand.init(this.canvas.width, this.canvas.height);
    this.sphere.init();
  }

  /**
   * Main animation loop for the header elements.
   * @param {number} now - The current high-res timestamp from requestAnimationFrame
   */
  animate(now) {
    const time = now - this.startTime;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.strand.draw(this.ctx, time);
    this.sphere.draw(this.ctx, time, this.canvas.width, this.canvas.height);

    this.animationFrameId = requestAnimationFrame(this.animateHandler);
  }
}
