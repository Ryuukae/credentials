import { AmbientConstellation } from '../systems/AmbientConstellation.js';
import { PageGrid } from '../systems/PageGrid.js';
import { CircuitTracks } from '../systems/CircuitTracks.js';

/**
 * Orchestrator class for the network background animation system.
 * Manages the constellation mesh, geometric grid, and interactive circuit tracks.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class NetworkBackground {
  /**
   * Initializes the network background orchestrator.
   * @param {string} canvasId - The ID of the target canvas element
   */
  constructor(canvasId = 'network-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.globalTime = 0;
    this.availableHeight = 0;
    this.scrollY = window.scrollY || 0;

    this.constellation = new AmbientConstellation();
    this.pageGrid = new PageGrid();
    this.circuitTracks = new CircuitTracks();

    this.resizeHandler = this.resizeCanvas.bind(this);
    this.scrollHandler = this.onScroll.bind(this);
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
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    this.resizeCanvas();

    this.observer = new ResizeObserver(() => {
      if (this.availableHeight !== document.documentElement.scrollHeight) {
        this.resizeCanvas(false);
      }
    });
    this.observer.observe(document.body);

    this.circuitTracks.init(this.canvas);

    this.animationFrameId = requestAnimationFrame(this.animateHandler);
  }

  /**
   * Cleans up event listeners and animation frames.
   */
  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('scroll', this.scrollHandler);
    if (this.observer) this.observer.disconnect();
  }

  /**
   * Scroll event handler to update parallax translation.
   */
  onScroll() {
    this.scrollY = window.scrollY || 0;
  }

  /**
   * Resizes the canvas and optionally re-initializes or updates the network meshes.
   * @param {boolean|Event} forceReinit - Whether to force respawning of nodes, or an event object from a resize event.
   */
  resizeCanvas(forceReinit = true) {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newScrollHeight = document.documentElement.scrollHeight;

    const windowResized = this.canvas.width !== newWidth || this.canvas.height !== newHeight;

    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.availableHeight = newScrollHeight;

    if (forceReinit === true || forceReinit instanceof Event || windowResized) {
      this.constellation.init(this.canvas, this.availableHeight);
      this.pageGrid.init(this.canvas, this.availableHeight);
    } else {
      // Just update the scroll height without wiping nodes so the accordion doesn't cause flashing
      this.constellation.availableHeight = this.availableHeight;
      this.pageGrid.availableHeight = this.availableHeight;
    }
  }

  /**
   * Main animation loop coordinating all sub-systems.
   */
  animate() {
    this.globalTime += 1;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(0, -this.scrollY);

    const viewTop = this.scrollY - 200;
    const viewBottom = this.scrollY + this.canvas.height + 200;

    // Render Ambient Constellation (Stars/Nodes)
    this.constellation.renderEdges(this.ctx, viewTop, viewBottom, this.globalTime);
    this.constellation.renderNodes(this.ctx, this.globalTime, viewTop, viewBottom);
    this.constellation.updatePulses(this.ctx, viewTop, viewBottom);

    // Render Geometric Grid (Vertical falling background circuits)
    this.pageGrid.renderEdges(this.ctx, viewTop, viewBottom, this.globalTime);
    this.pageGrid.renderNodes(this.ctx, this.globalTime, viewTop, viewBottom);
    this.pageGrid.updatePulses(this.ctx, viewTop, viewBottom, this.globalTime);

    // Render Hover Circuits (Interactive Button paths)
    this.circuitTracks.renderHoverCircuits(this.ctx);

    this.ctx.restore();

    this.animationFrameId = requestAnimationFrame(this.animateHandler);
  }

  /**
   * Triggers the hover circuit animation for a button.
   * @param {HTMLElement} btn - The hovered element
   */
  triggerHoverCircuit(btn) {
    this.circuitTracks.triggerHoverCircuit(btn);
  }

  /**
   * Stops the hover circuit animation for a button.
   * @param {HTMLElement} btn - The unhovered element
   */
  stopHoverCircuit(btn) {
    this.circuitTracks.stopHoverCircuit(btn);
  }
}
