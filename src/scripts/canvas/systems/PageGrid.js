import { NetworkConfig as CONFIG } from '../config/NetworkConfig.js';
import { getCircuitPath } from '../utils/NetworkUtils.js';

/**
 * Responsible for the static, vertical geometric circuit lines in the background.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class PageGrid {
  /**
   * Initializes the grid tracking arrays.
   */
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.pulses = [];
    this.canvas = null;
    this.availableHeight = 0;
  }

  /**
   * Initializes the geometric grid elements on a canvas.
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

    const strandNodeCount = Math.floor(
      (this.canvas.width * this.availableHeight) / CONFIG.STRAND_NODE_RATIO
    );
    const mainStrands = 5;
    const strandCenters = Array.from(
      { length: mainStrands },
      (_, i) => (this.canvas.width * (i + 1)) / (mainStrands + 1)
    );

    for (let i = 0; i < strandNodeCount; i++) {
      let y = this.availableHeight * Math.pow(Math.random(), 3.0);
      let x;
      if (Math.random() < 0.7) {
        const center = strandCenters[Math.floor(Math.random() * strandCenters.length)];
        const spread = 450 * Math.pow(1 - y / this.availableHeight, 1.5);
        x = center + (Math.random() - 0.5) * spread;
      } else {
        x = Math.random() * this.canvas.width;
        y = this.availableHeight * Math.pow(Math.random(), 4.0);
      }

      this.nodes.push({
        id: i,
        system: 'circuit',
        x: x,
        y: y,
        radius: Math.random() * 1.0 + 0.8,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        baseHue: CONFIG.CIRCUIT_HUE_MIN + Math.random() * CONFIG.CIRCUIT_HUE_VAR,
        connections: [],
      });
    }

    const header = document.querySelector('.header-container');
    const headerHeight = header ? header.offsetHeight : 300;

    for (let i = 0; i < this.nodes.length; i++) {
      const parent = this.nodes[i];
      const candidates = [];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const child = this.nodes[j];
        const dx = parent.x - child.x;
        const dy = parent.y - child.y;

        const distanceSq = dx * dx * 1.4 + dy * dy;
        const avgY = (parent.y + child.y) / 2;
        const maxDistSq = CONFIG.MAX_DIST_CIRCUIT + (avgY / this.availableHeight) * 20000;

        if (distanceSq < maxDistSq) {
          candidates.push({ child, distanceSq, avgY, index: j });
        }
      }

      candidates.sort((a, b) => a.distanceSq - b.distanceSq);

      let maxConnections = 1;
      if (parent.y < headerHeight + 600) {
        maxConnections = 4;
      } else if (parent.y < headerHeight + 1200) {
        maxConnections = 2;
      }

      for (let k = 0; k < Math.min(maxConnections, candidates.length); k++) {
        const target = candidates[k];
        parent.connections.push(target.index);
        target.child.connections.push(i);
        this.edges.push({
          from: i,
          to: target.index,
          path: getCircuitPath(parent.x, parent.y, target.child.x, target.child.y),
          baseAlpha: Math.max(0.002, 0.15 - (target.avgY / this.availableHeight) * 0.15),
          avgY: target.avgY,
          system: 'circuit',
        });
      }
    }
  }

  /**
   * Spawns an animated data pulse along the circuit pathways.
   */
  spawnPulse() {
    if (this.nodes.length === 0) return;

    let startIdx;
    for (let attempt = 0; attempt < 20; attempt++) {
      startIdx = Math.floor(Math.random() * this.nodes.length);
      if (this.nodes[startIdx].connections.length > 0) {
        if (this.nodes[startIdx].y > this.availableHeight * 0.2) continue;
        break;
      }
    }
    if (!startIdx || this.nodes[startIdx].connections.length === 0) return;

    let targetIdx = this.nodes[startIdx].connections[0];
    let maxDepth = -1;
    for (const cIdx of this.nodes[startIdx].connections) {
      if (this.nodes[cIdx].y > this.nodes[startIdx].y && this.nodes[cIdx].y > maxDepth) {
        maxDepth = this.nodes[cIdx].y;
        targetIdx = cIdx;
      }
    }
    if (maxDepth === -1)
      targetIdx =
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
      speed: 0.001 + Math.random() * 0.0015,
      hue: this.nodes[startIdx].baseHue,
      pulsePhase: Math.random() * Math.PI * 2,
      system: 'circuit',
    });
  }

  /**
   * Renders the edges of the geometric grid network.
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
      ctx.lineTo(edge.path.mx, edge.path.my);
      ctx.lineTo(n2.x, n2.y);

      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `hsla(${n1.baseHue}, 70%, 15%, ${finalAlpha})`;
      ctx.stroke();
    }
  }

  /**
   * Renders the nodes of the geometric grid network.
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

      const nodeAlpha = 0.03 + glow * 0.1 * depthFade;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + glow * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${node.baseHue}, 90%, 65%, ${nodeAlpha})`;
      ctx.fill();
    }
  }

  /**
   * Updates and renders the grid data pulses.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {number} viewTop - Top visible bound
   * @param {number} viewBottom - Bottom visible bound
   * @param {number} globalTime - The global animation time.
   */
  updatePulses(ctx, viewTop, viewBottom, globalTime) {
    if (this.pulses.length < CONFIG.PULSE_LIMIT) {
      if (Math.random() < 0.1) this.spawnPulse();
    }

    if (globalTime % 180 === 0 && this.pulses.length < CONFIG.PULSE_LIMIT) {
      for (let i = 0; i < 3; i++) this.spawnPulse();
    }

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed;
      p.pulsePhase += 0.05;

      if (p.progress >= 1) {
        if (Math.random() < 0.9) {
          const n = this.nodes[p.to];
          if (n.connections.length > 1) {
            let nextTarget = -1;

            let maxDepth = -1;
            for (const cIdx of n.connections) {
              if (cIdx !== p.from && this.nodes[cIdx].y > n.y && this.nodes[cIdx].y > maxDepth) {
                maxDepth = this.nodes[cIdx].y;
                nextTarget = cIdx;
              }
            }

            if (nextTarget === -1) {
              nextTarget = p.to;
              while (nextTarget === p.to || nextTarget === p.from) {
                nextTarget = n.connections[Math.floor(Math.random() * n.connections.length)];
              }
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
      const path = p.edge.path;
      const isForward = p.from === p.edge.from;

      const startX = isForward ? n1.x : n2.x;
      const startY = isForward ? n1.y : n2.y;
      const endX = isForward ? n2.x : n1.x;
      const endY = isForward ? n2.y : n1.y;

      let currX, currY;

      let tailX, tailY;
      const tailProgress = Math.max(0, p.progress - 0.04);
      const mx = path.mx,
        my = path.my;
      const ratio = path.d1 / path.totalDist;

      if (isForward) {
        if (p.progress < ratio) {
          const segProg = p.progress / ratio;
          currX = startX + (mx - startX) * segProg;
          currY = startY + (my - startY) * segProg;
        } else {
          const segProg = (p.progress - ratio) / (1 - ratio);
          currX = mx + (endX - mx) * segProg;
          currY = my + (endY - my) * segProg;
        }
        if (tailProgress < ratio) {
          const segProg = tailProgress / ratio;
          tailX = startX + (mx - startX) * segProg;
          tailY = startY + (my - startY) * segProg;
        } else {
          const segProg = (tailProgress - ratio) / (1 - ratio);
          tailX = mx + (endX - mx) * segProg;
          tailY = my + (endY - my) * segProg;
        }
      } else {
        const backRatio = path.d2 / path.totalDist;
        if (p.progress < backRatio) {
          const segProg = p.progress / backRatio;
          currX = startX + (mx - startX) * segProg;
          currY = startY + (my - startY) * segProg;
        } else {
          const segProg = (p.progress - backRatio) / (1 - backRatio);
          currX = mx + (endX - mx) * segProg;
          currY = my + (endY - my) * segProg;
        }
        if (tailProgress < backRatio) {
          const segProg = tailProgress / backRatio;
          tailX = startX + (mx - startX) * segProg;
          tailY = startY + (my - startY) * segProg;
        } else {
          const segProg = (tailProgress - backRatio) / (1 - backRatio);
          tailX = mx + (endX - mx) * segProg;
          tailY = my + (endY - my) * segProg;
        }
      }

      if (currY < viewTop || currY > viewBottom) continue;
      const depthFade = Math.pow(Math.max(0.1, 1 - currY / this.availableHeight), 0.8);
      if (depthFade <= 0.05) continue;

      const pulseIntensity = 0.5 + Math.sin(p.pulsePhase) * 0.5;
      const finalIntensity = pulseIntensity * depthFade;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(currX, currY);
      ctx.lineWidth = 1.5 + finalIntensity;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(200, 255, 255, ${finalIntensity + 0.5})`;
      ctx.stroke();

      if (finalIntensity > 0.2) {
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(currX, currY);
        ctx.lineWidth = 4 + finalIntensity * 3;
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 65%, ${finalIntensity * 0.4})`;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(currX, currY);
        ctx.lineWidth = 10 + finalIntensity * 5;
        ctx.strokeStyle = `hsla(${p.hue}, 100%, 60%, ${finalIntensity * 0.1})`;
        ctx.stroke();
      }
    }
  }
}
