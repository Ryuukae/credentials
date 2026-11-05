import { NetworkConfig as CONFIG } from '../config/NetworkConfig.js';

/**
 * Represents a single floating particle in the background canvas network.
 * Tracks its own movement history, coordinates, and rendering logic.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class Particle {
  /**
   * Initializes a new particle at a random starting position and velocity.
   * @param {number} canvasWidth - The current width of the canvas.
   * @param {number} canvasHeight - The current height of the canvas.
   */
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * this.canvasWidth;
    this.baseY = (Math.random() * 0.4 + 0.3) * this.canvasHeight;
    this.y = this.baseY;
    this.vx = 0.6 + Math.random() * 0.15;
    this.vy = 0;
    this.baseRadius = Math.random() * 1.5 + 0.5;
    this.phase = Math.random() * Math.PI * 2;
    this.waveOffset = Math.random() * Math.PI * 2;
    this.history = [];
  }

  /**
   * Updates particle physics, appending history and wrapping screen edges.
   * @param {number} time - The current relative animation time.
   */
  update(time) {
    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > CONFIG.TRAIL_LENGTH) {
      this.history.pop();
    }

    this.x += this.vx;
    this.y = this.baseY + Math.sin(time * 0.0005 + this.waveOffset) * 40;
    this.phase += 0.02;

    if (this.x > this.canvasWidth + 100) {
      this.x = -100;
      this.history = [];
    }
  }

  /**
   * Renders the particle and its trailing history on the canvas context.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   */
  draw(ctx) {
    const pulse = Math.max(0, Math.sin(this.phase));
    const radius = this.baseRadius + pulse * 1.5;

    if (this.history.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      const alpha = 0.15 + pulse * 0.4;
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + pulse * 0.9})`;
    ctx.fill();

    if (pulse > 0.6) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.1})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, radius + pulse * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.05})`;
      ctx.fill();
    }
  }
}
