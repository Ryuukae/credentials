import { NetworkConfig as CONFIG } from '../config/NetworkConfig.js';

/**
 * Responsible for the ambient, drifting constellation mesh in the background.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class AmbientConstellation {
  /**
   * Initializes the constellation tracking arrays.
   */
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.pulses = [];
    this.canvas = null;
    this.availableHeight = 0;
  }

  /**
   * Initializes the network background elements on a canvas.
   * @param {HTMLCanvasElement} canvas - The target canvas element.
   * @param {number} availableHeight - The document scroll height.
   */
  init(canvas, availableHeight) {
    this.canvas = canvas;
    this.availableHeight = availableHeight;
    this.nodes = [];
    this.edges = [];
    this.pulses = [];

    if (this.availableHeight <= 0) return;

    const ambientNodeCount = Math.floor(
      (this.canvas.width * this.availableHeight) / CONFIG.AMBIENT_NODE_RATIO
    );

    for (let i = 0; i < ambientNodeCount; i++) {
      let y =
        Math.random() < 0.7
          ? this.availableHeight * Math.pow(Math.random(), 3.0)
          : this.availableHeight * Math.random();
      this.nodes.push({
        id: i,
        system: 'constellation',
        x: Math.random() * this.canvas.width,
        y: y,
        radius: Math.random() * 1.5 + 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.015,
        baseHue: CONFIG.CONSTELLATION_HUE_MIN + Math.random() * CONFIG.CONSTELLATION_HUE_VAR,
        connections: [],
      });
    }

    const header = document.querySelector('.header-container');
    const headerHeight = header ? header.offsetHeight : 300;

    for (let i = 0; i < ambientNodeCount; i++) {
      const parent = this.nodes[i];
      const candidates = [];
      for (let j = i + 1; j < ambientNodeCount; j++) {
        const child = this.nodes[j];
        const dx = parent.x - child.x;
        const dy = parent.y - child.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < CONFIG.MAX_DIST_CONSTELLATION) {
          candidates.push({ child, distanceSq, index: j });
        }
      }

      candidates.sort((a, b) => a.distanceSq - b.distanceSq);
      const maxConnections = parent.y < headerHeight ? 3 : 2;

      for (let k = 0; k < Math.min(maxConnections, candidates.length); k++) {
        const target = candidates[k];
        parent.connections.push(target.index);
        target.child.connections.push(i);
        this.edges.push({
          from: i,
          to: target.index,
          path: {
            mx: target.child.x,
            my: target.child.y,
            d1: Math.sqrt(target.distanceSq),
            d2: 0,
            totalDist: Math.sqrt(target.distanceSq),
          },
          baseAlpha: 0.02 + Math.random() * 0.15,
          avgY: (parent.y + target.child.y) / 2,
          system: 'constellation',
        });
      }
    }
  }

  /**
   * Spawns an animated data pulse along the constellation pathways.
   */
  spawnPulse() {
    if (this.nodes.length === 0) return;

    let startIdx;
    for (let attempt = 0; attempt < 20; attempt++) {
      startIdx = Math.floor(Math.random() * this.nodes.length);
      if (this.nodes[startIdx].connections.length > 0) {
        break;
      }
    }
    if (!startIdx || this.nodes[startIdx].connections.length === 0) return;

    let targetIdx =
      this.nodes[startIdx].connections[
        Math.floor(Math.random() * this.nodes[startIdx].connections.length)
      ];

    const edge = this.edges.find(
      (e) =>
        (e.from === startIdx && e.to === targetIdx) || (e.to === startIdx && e.from === startIdx)
    );
    if (!edge) return;

    this.pulses.push({
      from: startIdx,
      to: targetIdx,
      edge: edge,
      progress: 0,
      speed: 0.0005 + Math.random() * 0.001,
      hue: this.nodes[startIdx].baseHue,
      pulsePhase: Math.random() * Math.PI * 2,
      system: 'constellation',
    });
  }

  /**
   * Renders the edges of the ambient constellation network.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {number} viewTop - Top visible bound
   * @param {number} viewBottom - Bottom visible bound
   * @param {number} globalTime - The global animation time.
   */
  renderEdges(ctx, viewTop, viewBottom, globalTime) {
    for (const edge of this.edges) {
      const n1 = this.nodes[edge.from];
      const n2 = this.nodes[edge.to];

      if ((n1.y < viewTop && n2.y < viewTop) || (n1.y > viewBottom && n2.y > viewBottom)) continue;

      const breath = Math.sin(globalTime * 0.01 + edge.from) * 0.02;
      const depthFade = Math.max(0.01, 1 - edge.avgY / this.availableHeight);
      const finalAlpha = Math.max(0, edge.baseAlpha + breath) * Math.pow(depthFade, 0.8);

      if (finalAlpha <= 0.002) continue;

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `hsla(${n1.baseHue}, 70%, 10%, ${finalAlpha})`;
      ctx.stroke();
    }
  }

  /**
   * Renders the nodes of the ambient constellation network.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {number} globalTime - The global animation time.
   * @param {number} viewTop - Top visible bound
   * @param {number} viewBottom - Bottom visible bound
   */
  renderNodes(ctx, globalTime, viewTop, viewBottom) {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.y < viewTop || node.y > viewBottom) continue;

      const pulse = Math.sin(globalTime * node.pulseSpeed + node.pulseOffset);
      const glow = Math.max(0, pulse);

      const depthFade = Math.max(0.1, 1 - node.y / this.availableHeight);
      if (depthFade <= 0.02) continue;

      const nodeAlpha = 0.02 + glow * 0.1 * depthFade;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + glow * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${node.baseHue}, 90%, 65%, ${nodeAlpha})`;
      ctx.fill();
    }
  }

  /**
   * Updates and renders the ambient data pulses.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {number} viewTop - Top visible bound
   * @param {number} viewBottom - Bottom visible bound
   */
  updatePulses(ctx, viewTop, viewBottom) {
    if (this.pulses.length < CONFIG.PULSE_LIMIT) {
      if (Math.random() < 0.05) this.spawnPulse();
    }

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed;
      p.pulsePhase += 0.05;

      if (p.progress >= 1) {
        if (Math.random() < 0.9) {
          const n = this.nodes[p.to];
          if (n.connections.length > 1) {
            let nextTarget = p.to;
            while (nextTarget === p.to || nextTarget === p.from) {
              nextTarget = n.connections[Math.floor(Math.random() * n.connections.length)];
            }

            const nextEdge = this.edges.find(
              (e) =>
                (e.from === p.to && e.to === nextTarget) || (e.to === p.to && e.from === nextTarget)
            );
            if (nextEdge && nextTarget !== p.from) {
              p.from = p.to;
              p.to = nextTarget;
              p.edge = nextEdge;
              p.progress = 0;
              continue;
            }
          }
        }
        this.pulses.splice(i, 1);
        continue;
      }

      const n1 = this.nodes[p.from];
      const n2 = this.nodes[p.to];
      const isForward = p.from === p.edge.from;

      const startX = isForward ? n1.x : n2.x;
      const startY = isForward ? n1.y : n2.y;
      const endX = isForward ? n2.x : n1.x;
      const endY = isForward ? n2.y : n1.y;

      let currX = startX + (endX - startX) * p.progress;
      let currY = startY + (endY - startY) * p.progress;

      if (currY < viewTop || currY > viewBottom) continue;

      const depthFade = Math.pow(Math.max(0.1, 1 - currY / this.availableHeight), 0.8);
      if (depthFade <= 0.05) continue;

      const pulseIntensity = 0.5 + Math.sin(p.pulsePhase) * 0.5;
      const finalIntensity = pulseIntensity * depthFade;

      ctx.beginPath();
      ctx.arc(currX, currY, 1.2 + finalIntensity, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${finalIntensity + 0.2})`;
      ctx.fill();

      if (finalIntensity > 0.2) {
        ctx.beginPath();
        ctx.arc(currX, currY, 3 + finalIntensity * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${finalIntensity * 0.3})`;
        ctx.fill();
      }
    }
  }
}
