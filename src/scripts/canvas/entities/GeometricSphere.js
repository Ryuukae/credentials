import { NetworkConfig as CONFIG } from '../config/NetworkConfig.js';

/**
 * Responsible for the 3D rotating ball/core that moves across the header.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class GeometricSphere {
  /**
   * Initializes the geometric sphere manager.
   */
  constructor() {
    this.nodes = [];
    this.coreX = 0;
    this.coreY = 0;
  }

  /**
   * Constructs the 3D spherical point cloud that forms the drifting core.
   */
  init() {
    this.nodes = [];
    for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / CONFIG.NODE_COUNT);
      const theta = Math.sqrt(CONFIG.NODE_COUNT * Math.PI) * phi;
      this.nodes.push({
        ox: Math.cos(theta) * Math.sin(phi),
        oy: Math.sin(theta) * Math.sin(phi),
        oz: Math.cos(phi),
        radius: Math.random() * 1.5 + 1.0,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Renders the 3D core structure, applying projection matrices and sorting by depth.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {number} time - The current relative animation time.
   * @param {number} canvasWidth - The width of the canvas.
   * @param {number} canvasHeight - The height of the canvas.
   * @returns {void} - No return value.
   */
  draw(ctx, time, canvasWidth, canvasHeight) {
    this.coreX = ((time * 0.08) % (canvasWidth + 400)) - 200;
    this.coreY = canvasHeight / 2 + Math.sin(time * 0.001) * 40;

    const rx = time * 0.0004;
    const ry = time * 0.0007;
    const cosX = Math.cos(rx),
      sinX = Math.sin(rx);
    const cosY = Math.cos(ry),
      sinY = Math.sin(ry);

    const projectedNodes = this.nodes.map((n) => {
      const x1 = n.ox * cosY - n.oz * sinY;
      const z1 = n.oz * cosY + n.ox * sinY;
      const y2 = n.oy * cosX - z1 * sinX;
      const z2 = z1 * cosX + n.oy * sinX;

      const scale = CONFIG.CORE_SCALE_BASE / (CONFIG.CORE_SCALE_BASE + z2 * CONFIG.CORE_SCALE_DIV);
      return {
        x: this.coreX + x1 * CONFIG.CORE_RADIUS_MULT * scale,
        y: this.coreY + y2 * CONFIG.CORE_RADIUS_MULT * scale,
        z: z2,
        scale: scale,
        original: n,
      };
    });

    projectedNodes.sort((a, b) => b.z - a.z);

    ctx.lineWidth = 1.0;
    for (let i = 0; i < projectedNodes.length; i++) {
      const p1 = projectedNodes[i];
      for (let j = i + 1; j < projectedNodes.length; j++) {
        const p2 = projectedNodes[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < CONFIG.MAX_NODE_DIST_SQ) {
          const depthAlpha = p1.z > 0 ? 0.15 : 0.4;
          const distAlpha = 1 - distSq / CONFIG.MAX_NODE_DIST_SQ;
          const finalAlpha = depthAlpha * distAlpha * p1.scale;

          ctx.strokeStyle = `rgba(0, 255, 255, ${finalAlpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    for (const p of projectedNodes) {
      const pulse = Math.sin(time * 0.003 + p.original.phase) * 0.5 + 0.5;
      const r = p.original.radius * p.scale + pulse * 2 * p.scale;

      const depthFactor = p.z > 0 ? 0.3 : 1.0;
      const opacity = (0.2 + pulse * 0.8) * depthFactor;

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
      ctx.fill();

      if (pulse > 0.5 && p.z < 0.5) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 5 * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${(pulse - 0.5) * 0.5 * depthFactor})`;
        ctx.fill();
      }
    }
  }
}
