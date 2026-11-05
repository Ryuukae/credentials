import { NetworkConfig as CONFIG } from '../config/NetworkConfig.js';
import { Particle } from './Particle.js';

/**
 * Manages the abstract particle strands (DNA-like waves) moving across the header.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class AbstractStrand {
  /**
   * Initializes the strand logic.
   */
  constructor() {
    this.particles = [];
  }

  /**
   * Initializes the particle array.
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   */
  init(canvasWidth, canvasHeight) {
    this.particles = [];
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      this.particles.push(new Particle(canvasWidth, canvasHeight));
    }
  }

  /**
   * Iterates through all particles, updates them, draws them, and connects proximal pairs.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {number} time - The current relative animation time.
   */
  draw(ctx, time) {
    ctx.lineWidth = 1;
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(time);
      this.particles[i].draw(ctx);

      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < CONFIG.MAX_PARTICLE_DIST_SQ) {
          const baseAlpha = 0.4 * (1 - distanceSq / CONFIG.MAX_PARTICLE_DIST_SQ);
          const p1Pulse = Math.max(0, Math.sin(this.particles[i].phase));
          const p2Pulse = Math.max(0, Math.sin(this.particles[j].phase));
          const glowAlpha = baseAlpha * (0.2 + (p1Pulse + p2Pulse) * 0.4);

          ctx.strokeStyle = `rgba(255, 255, 255, ${glowAlpha})`;
          ctx.beginPath();
          ctx.moveTo(this.particles[i].x, this.particles[i].y);
          ctx.lineTo(this.particles[j].x, this.particles[j].y);
          ctx.stroke();
        }
      }
    }
  }
}
