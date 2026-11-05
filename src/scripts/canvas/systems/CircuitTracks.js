import { NetworkConfig as CONFIG } from '../config/NetworkConfig.js';
import { getCircuitPath } from '../utils/NetworkUtils.js';

/**
 * Manages the dynamic circuit animations triggered by button hovers.
 * @author Adam Ross DeStafeno
 * @version 1.2.0
 */
export class CircuitTracks {
  /**
   * Initializes the hover tracking systems.
   */
  constructor() {
    this.buttonCircuits = new Map();
    this.canvas = null;
    this.scrollY = window.scrollY || 0;
  }

  /**
   * Binds to the target canvas.
   * @param {HTMLCanvasElement} canvas - The target canvas element.
   */
  init(canvas) {
    this.canvas = canvas;

    window.addEventListener(
      'scroll',
      () => {
        this.scrollY = window.scrollY || 0;
      },
      { passive: true }
    );
  }

  /**
   * Triggers the hover circuit animation for a button.
   * @param {HTMLElement} btn - The hovered button element
   */
  triggerHoverCircuit(btn) {
    if (!this.canvas) return;
    const rect = btn.getBoundingClientRect();
    const x = Math.round((rect.left + rect.width / 2) / 20) * 20;
    const y = Math.round((rect.top + this.scrollY + rect.height / 2) / 20) * 20;

    const bSys = { nodes: [], edges: [], pulses: [], fading: false, alpha: 0, growth: 0 };
    bSys.nodes.push({ x, y, radius: 2.5, connections: [], depth: 0 });

    const baseAngles = [
      0,
      Math.PI / 4,
      Math.PI / 2,
      (3 * Math.PI) / 4,
      Math.PI,
      (5 * Math.PI) / 4,
      (3 * Math.PI) / 2,
      (7 * Math.PI) / 4,
    ];
    const dominantAngle = Math.random() * Math.PI * 2;

    for (let i = 0; i < baseAngles.length; i++) {
      const angleDiff = Math.abs(
        Math.atan2(Math.sin(baseAngles[i] - dominantAngle), Math.cos(baseAngles[i] - dominantAngle))
      );
      if (angleDiff > Math.PI / 2) {
        this.growCircuitBranch(
          bSys,
          0,
          x,
          y,
          baseAngles[i],
          0,
          1 + Math.floor(Math.random() * 2),
          dominantAngle
        );
      } else {
        const branchMaxDepth = 3 + Math.floor(Math.random() * 4);
        this.growCircuitBranch(bSys, 0, x, y, baseAngles[i], 0, branchMaxDepth, dominantAngle);
      }
    }

    this.createCrossLinks(bSys);
    this.buttonCircuits.set(btn, bSys);
  }

  /**
   * Stops the hover circuit animation for a button.
   * @param {HTMLElement} btn - The unhovered button element
   */
  stopHoverCircuit(btn) {
    if (this.buttonCircuits.has(btn)) {
      this.buttonCircuits.get(btn).fading = true;
    }
  }

  /**
   * Recursively grows a branch segment of the geometric circuit.
   * @param {object} bSys - The branch system data
   * @param {number} parentIdx - Parent node index
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} currentAngle - Growth angle
   * @param {number} currentDepth - Current recursion depth
   * @param {number} maxDepth - Max recursion depth
   * @param {number} dominantAngle - Dominant flow angle
   */
  growCircuitBranch(
    bSys,
    parentIdx,
    startX,
    startY,
    currentAngle,
    currentDepth,
    maxDepth,
    dominantAngle
  ) {
    if (currentDepth >= maxDepth) return;

    let branches;
    if (currentDepth === 0) {
      branches = 2;
    } else if (currentDepth === 1) {
      branches = 2 + Math.floor(Math.random() * 3);
    } else {
      if (Math.random() < 0.3) return;
      branches = Math.random() < 0.4 ? 2 : 1;
    }

    let availableTurns = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
    if (currentDepth === 0) availableTurns = [Math.PI / 8, -Math.PI / 8];

    for (let i = 0; i < branches; i++) {
      if (availableTurns.length === 0) break;

      let turn;
      let preferredTurn = null;

      if (currentDepth > 0 && Math.random() < 0.75) {
        for (const edge of bSys.edges) {
          if (edge.isFaint) continue;
          const n1 = bSys.nodes[edge.from];
          const distSq = (n1.x - startX) ** 2 + (n1.y - startY) ** 2;

          if (distSq < CONFIG.HERD_MENTALITY_DIST_SQ && distSq > 0) {
            const n2 = bSys.nodes[edge.to];
            const neighborAngle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
            let neededTurn =
              Math.round((neighborAngle - currentAngle) / (Math.PI / 4)) * (Math.PI / 4);
            neededTurn = Math.atan2(Math.sin(neededTurn), Math.cos(neededTurn));

            const matchIdx = availableTurns.findIndex((t) => Math.abs(t - neededTurn) < 0.1);
            if (matchIdx !== -1) {
              preferredTurn = availableTurns[matchIdx];
              availableTurns.splice(matchIdx, 1);
              break;
            }
          }
        }
      }

      if (preferredTurn === null && currentDepth > 0 && Math.random() < CONFIG.FLOW_CURVE_CHANCE) {
        let bestTurn = availableTurns[0];
        let smallestDiff = Infinity;
        let bestIdx = 0;

        for (let k = 0; k < availableTurns.length; k++) {
          const testAngle = currentAngle + availableTurns[k];
          const diff = Math.abs(
            Math.atan2(Math.sin(testAngle - dominantAngle), Math.cos(testAngle - dominantAngle))
          );
          if (diff < smallestDiff) {
            smallestDiff = diff;
            bestTurn = availableTurns[k];
            bestIdx = k;
          }
        }
        preferredTurn = bestTurn;
        availableTurns.splice(bestIdx, 1);
      }

      if (preferredTurn !== null) {
        turn = preferredTurn;
      } else {
        const turnIdx = Math.floor(Math.random() * availableTurns.length);
        turn = availableTurns[turnIdx];
        availableTurns.splice(turnIdx, 1);
      }

      const branchAngle = currentAngle + turn;

      let baseDist, variance;
      if (currentDepth === 0) {
        baseDist = 35;
        variance = 30;
      } else if (currentDepth === 1) {
        baseDist = 35;
        variance = 30;
      } else {
        baseDist = 30 + currentDepth * 10;
        variance = 50;
      }
      const dist = baseDist + Math.pow(Math.random(), 1.5) * variance;

      let endX = startX + Math.cos(branchAngle) * dist;
      let endY = startY + Math.sin(branchAngle) * dist;

      endX = Math.round(endX / CONFIG.GRID_SNAP) * CONFIG.GRID_SNAP;
      endY = Math.round(endY / CONFIG.GRID_SNAP) * CONFIG.GRID_SNAP;

      if (Math.hypot(endX - startX, endY - startY) < 15) {
        endX =
          startX + Math.round((Math.cos(branchAngle) * 30) / CONFIG.GRID_SNAP) * CONFIG.GRID_SNAP;
        endY =
          startY + Math.round((Math.sin(branchAngle) * 30) / CONFIG.GRID_SNAP) * CONFIG.GRID_SNAP;
      }

      const nextIdx = bSys.nodes.length;
      bSys.nodes.push({
        x: endX,
        y: endY,
        radius: 1.5,
        connections: [parentIdx],
        depth: currentDepth + 1,
      });
      bSys.nodes[parentIdx].connections.push(nextIdx);

      bSys.edges.push({
        from: parentIdx,
        to: nextIdx,
        depthStart: currentDepth,
        depthEnd: currentDepth + 1,
        path: getCircuitPath(startX, startY, endX, endY),
        isFaint: false,
      });

      const perp = branchAngle + Math.PI / 2;
      const offX = Math.cos(perp) * 5;
      const offY = Math.sin(perp) * 5;

      bSys.edges.push({
        from: parentIdx,
        to: nextIdx,
        depthStart: currentDepth + 0.1,
        depthEnd: currentDepth + 1.1,
        path: getCircuitPath(startX + offX, startY + offY, endX + offX, endY + offY),
        isFaint: true,
      });
      bSys.edges.push({
        from: parentIdx,
        to: nextIdx,
        depthStart: currentDepth + 0.2,
        depthEnd: currentDepth + 1.2,
        path: getCircuitPath(startX - offX, startY - offY, endX - offX, endY - offY),
        isFaint: true,
      });

      this.growCircuitBranch(
        bSys,
        nextIdx,
        endX,
        endY,
        branchAngle,
        currentDepth + 1,
        maxDepth,
        dominantAngle
      );
    }
  }

  /**
   * Creates interconnections between nearby nodes.
   * @param {object} bSys - The branch system data
   */
  createCrossLinks(bSys) {
    for (let i = 1; i < bSys.nodes.length; i++) {
      const n1 = bSys.nodes[i];
      if (Math.random() > CONFIG.CROSS_LINK_CHANCE) continue;

      let bestDist = Infinity;
      let bestTarget = -1;

      for (let j = 1; j < bSys.nodes.length; j++) {
        if (i === j) continue;
        const n2 = bSys.nodes[j];

        if (Math.abs(n1.depth - n2.depth) <= 1 && !n1.connections.includes(j)) {
          const distSq = (n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2;
          if (
            distSq > CONFIG.CROSS_LINK_MIN_DIST_SQ &&
            distSq < CONFIG.CROSS_LINK_MAX_DIST_SQ &&
            distSq < bestDist
          ) {
            bestDist = distSq;
            bestTarget = j;
          }
        }
      }

      if (bestTarget !== -1) {
        const n2 = bSys.nodes[bestTarget];
        n1.connections.push(bestTarget);
        n2.connections.push(i);

        const minD = Math.min(n1.depth, n2.depth);
        const maxD = Math.max(n1.depth, n2.depth);

        bSys.edges.push({
          from: i,
          to: bestTarget,
          depthStart: minD + 0.2,
          depthEnd: maxD + 0.5,
          path: getCircuitPath(n1.x, n1.y, n2.x, n2.y),
          isFaint: false,
        });

        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        const perp = angle + Math.PI / 2;
        const offX = Math.cos(perp) * 5;
        const offY = Math.sin(perp) * 5;

        bSys.edges.push({
          from: i,
          to: bestTarget,
          depthStart: minD + 0.3,
          depthEnd: maxD + 0.6,
          path: getCircuitPath(n1.x + offX, n1.y + offY, n2.x + offX, n2.y + offY),
          isFaint: true,
        });
        bSys.edges.push({
          from: i,
          to: bestTarget,
          depthStart: minD + 0.4,
          depthEnd: maxD + 0.7,
          path: getCircuitPath(n1.x - offX, n1.y - offY, n2.x - offX, n2.y - offY),
          isFaint: true,
        });
      }
    }
  }

  /**
   * Renders all active hover circuits associated with UI elements.
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   */
  renderHoverCircuits(ctx) {
    for (const [btn, bSys] of this.buttonCircuits.entries()) {
      if (bSys.fading) {
        bSys.alpha -= 0.005;
        if (bSys.alpha <= 0) {
          this.buttonCircuits.delete(btn);
          continue;
        }
      } else {
        if (bSys.alpha < 1) bSys.alpha += 0.05;
        bSys.growth += 0.035;
      }

      for (const edge of bSys.edges) {
        if (bSys.growth <= edge.depthStart) continue;

        let drawProgress = 1;
        if (bSys.growth < edge.depthEnd) {
          let t = (bSys.growth - edge.depthStart) / (edge.depthEnd - edge.depthStart);
          drawProgress = 1 - Math.pow(1 - t, 3);
        }

        const n1 = bSys.nodes[edge.from];
        const n2 = bSys.nodes[edge.to];

        const path = edge.path;
        const ratio = path.totalDist > 0 ? path.d1 / path.totalDist : 1;

        let currX, currY;
        if (drawProgress < ratio) {
          currX = n1.x + (path.mx - n1.x) * (drawProgress / ratio);
          currY = n1.y + (path.my - n1.y) * (drawProgress / ratio);
        } else {
          currX = path.mx + (n2.x - path.mx) * ((drawProgress - ratio) / (1 - ratio));
          currY = path.my + (n2.y - path.my) * ((drawProgress - ratio) / (1 - ratio));
        }

        let startX = n1.x;
        let startY = n1.y;
        if (edge.isFaint) {
          startX = n1.x + (path.mx > n1.x ? -2 : 2);
          startY = n1.y + (path.my > n1.y ? -2 : 2);
        }

        const startFade = Math.max(0.3, 1 - edge.depthStart / 8);
        const endFade = Math.max(0.25, 1 - (edge.depthStart + 1) / 8);

        const edgeTwinkle =
          0.85 + 0.15 * Math.sin(Date.now() * 0.0015 + edge.from * 0.4 + edge.to * 0.3);
        const edgeAlpha = bSys.alpha * edgeTwinkle;

        const grad = ctx.createLinearGradient(startX, startY, n2.x, n2.y);
        if (edge.isFaint) {
          grad.addColorStop(0, `hsla(190, 90%, 40%, ${0.15 * edgeAlpha * startFade})`);
          grad.addColorStop(1, `hsla(190, 90%, 40%, ${0.06 * edgeAlpha * endFade})`);
          ctx.lineWidth = 0.5;
        } else {
          grad.addColorStop(0, `hsla(190, 90%, 40%, ${0.5 * edgeAlpha * startFade})`);
          grad.addColorStop(1, `hsla(190, 90%, 40%, ${0.2 * edgeAlpha * endFade})`);
          ctx.lineWidth = 1.5;
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        if (drawProgress >= ratio) {
          ctx.lineTo(path.mx, path.my);
        }
        ctx.lineTo(currX, currY);

        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      for (const node of bSys.nodes) {
        if (bSys.growth < node.depth) continue;

        let t = Math.min(1, (bSys.growth - node.depth) * 4);
        let scale = 1 - Math.pow(1 - t, 3);

        const fade = Math.max(0.25, 1 - node.depth / 8);

        const nodeTwinkle =
          0.75 + 0.25 * Math.sin(Date.now() * 0.002 + node.x * 0.02 + node.y * 0.02);
        const nodeAlpha = bSys.alpha * nodeTwinkle;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, 75%, ${0.7 * nodeAlpha * fade})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, 65%, ${0.2 * nodeAlpha * fade})`;
        ctx.fill();
      }

      if (!bSys.fading && bSys.growth >= 1.5 && Math.random() < 0.08) {
        const startIdx = Math.floor(Math.random() * bSys.nodes.length);
        if (bSys.nodes[startIdx].connections.length > 0) {
          const targetIdx =
            bSys.nodes[startIdx].connections[
              Math.floor(Math.random() * bSys.nodes[startIdx].connections.length)
            ];
          const edge = bSys.edges.find(
            (e) =>
              (e.from === startIdx && e.to === targetIdx) ||
              (e.to === startIdx && e.from === targetIdx)
          );
          if (edge && bSys.growth >= edge.depthEnd) {
            bSys.pulses.push({
              from: startIdx,
              to: targetIdx,
              edge: edge,
              progress: 0,
              speed: 0.008 + Math.random() * 0.004,
            });
          }
        }
      }

      for (let i = bSys.pulses.length - 1; i >= 0; i--) {
        const p = bSys.pulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          bSys.pulses.splice(i, 1);
          continue;
        }
        const n1 = bSys.nodes[p.from];
        const n2 = bSys.nodes[p.to];
        const path = p.edge.path;
        const isForward = p.from === p.edge.from;
        const startX = isForward ? n1.x : n2.x;
        const startY = isForward ? n1.y : n2.y;
        const endX = isForward ? n2.x : n1.x;
        const endY = isForward ? n2.y : n1.y;

        let currX, currY;
        const mx = path.mx,
          my = path.my;
        const ratio = path.totalDist > 0 ? path.d1 / path.totalDist : 1;

        if (isForward) {
          if (p.progress < ratio) {
            currX = startX + (mx - startX) * (p.progress / ratio);
            currY = startY + (my - startY) * (p.progress / ratio);
          } else {
            currX = mx + (endX - mx) * ((p.progress - ratio) / (1 - ratio));
            currY = my + (endY - my) * ((p.progress - ratio) / (1 - ratio));
          }
        } else {
          const backRatio = path.totalDist > 0 ? path.d2 / path.totalDist : 1;
          if (p.progress < backRatio) {
            currX = startX + (mx - startX) * (p.progress / backRatio);
            currY = startY + (my - startY) * (p.progress / backRatio);
          } else {
            currX = mx + (endX - mx) * ((p.progress - backRatio) / (1 - backRatio));
            currY = my + (endY - my) * ((p.progress - backRatio) / (1 - backRatio));
          }
        }

        const edgeFade = Math.max(0.3, 1 - p.edge.depthStart / 8);

        ctx.beginPath();
        ctx.arc(currX, currY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, 90%, ${bSys.alpha * edgeFade})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currX, currY, 7, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, 70%, ${0.3 * bSys.alpha * edgeFade})`;
        ctx.fill();
      }
    }
  }
}
