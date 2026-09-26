(() => {
  // game.js
  var VIEWPORT = { width: 320, height: 376, physicalWidth: 240, physicalHeight: 282 };
  var WORLD = { width: 320, height: 1400, marbleRadius: 12, goalRadius: 19, unit: 22 };
  var BOUNCE = { holdMs: 400, quickUnits: 1, longUnits: 3, airborneSeconds: 0.38, cooldownSeconds: 0.48 };
  var DIFFICULTIES = ["beginner", "standard", "pro"];
  var CAMERA_LEAD = { forward: 38, backward: -24, neutral: 0 };
  var wall = (x, y, w, h = WORLD.unit, type = "wall") => ({ x, y, w, h, type });
  var feature = (x, y, r, type) => ({ x, y, r, type });
  var BOMB = { triggerRadius: 25, fuseSeconds: 0.85, blastRadius: 42, blastSeconds: 0.22 };
  var names = ["first roll", "switchback", "crossfire", "marble storm", "copper bend", "driftwood", "orbital lane", "nightfall", "switchyard", "ember ridge", "glass run", "twin peaks", "magnetic mile", "cinder loop", "blue shift", "gravity well", "sunset sprint", "spiral gate", "last crossing", "final orbit"];
  function makeLevel(i) {
    const shift = (i % 5 - 2) * 5, start2 = { x: 54, y: 1335 }, goal = { x: 266, y: 64 };
    const obstacles = [];
    for (let g = 0; g < 6; g++) {
      const y = 1160 - g * 198 + ((i * 7 + g * 3) % 23 - 11) * 2;
      obstacles.push(g % 2 === 0 ? wall(0, y, 218) : wall(102, y, 218));
    }
    obstacles.push(wall(140 + shift, 1290, 40, 11, "half"));
    obstacles.push(wall(135 - shift, 93, 44, 22, "rebound"));
    const features = [feature(155 + shift, 1210, 13, "pit"), feature(155 - shift, 1010, 14, "sand"), feature(155 + shift, 810, 14, "merry"), feature(155 - shift, 610, 13, "ice"), feature(155 + shift, 410, 13, "sticky"), feature(155 - shift, 210, 12, "spikes")];
    const bombs = [feature(155 + shift, 1120, 12, "bomb"), feature(155 - shift, 520, 12, "bomb")];
    const enemies = i > 2 ? [{ x: 155, y: 920, r: 12, axis: "x", span: 18, speed: 0.7 }] : [];
    return { name: names[i], start: start2, goal, obstacles, enemies, powerups: [{ x: 265, y: 1060 }], time: 180 + i * 3, features, bombs };
  }
  var LEVELS = Array.from({ length: 20 }, (_, i) => makeLevel(i));
  function newRun(levelIndex = 0, difficulty = "standard") {
    if (!DIFFICULTIES.includes(difficulty)) throw Error("unknown difficulty");
    const l = LEVELS[levelIndex];
    return { levelIndex, difficulty, marble: { ...l.start, vx: 0, vy: 0 }, enemies: l.enemies.map((e) => ({ ...e, origin: e[e.axis], direction: 1 })), powerups: l.powerups.map((p) => ({ ...p, collected: false })), bombs: l.bombs.map((b) => ({ ...b, phase: "idle", time: 0 })), remaining: l.time, lives: 3, status: "playing", airborne: 0, jumpCooldown: 0, jumpKind: null, superJumps: 0, lastDirection: { x: 0, y: -1 }, failure: null, dizzy: 0, terrain: null, gravity: false };
  }
  function circlesOverlap(a, ar, b, br) {
    return Math.hypot(a.x - b.x, a.y - b.y) < ar + br;
  }
  function pointInExpandedRect(p, r, pad) {
    return p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;
  }
  function moveEnemies(enemies, dt) {
    return enemies.map((e) => {
      const n = { ...e };
      n[e.axis] += n.direction * n.speed * dt * 60;
      if (Math.abs(n[e.axis] - n.origin) > n.span) {
        n.direction *= -1;
        n[e.axis] = n.origin + Math.sign(n[e.axis] - n.origin) * n.span;
      }
      return n;
    });
  }
  function failureFor(run2) {
    return ["explode", "crumble", "melt"][(run2.levelIndex + run2.lives) % 3];
  }
  function collisionAllowed(obstacle, run2) {
    return run2.airborne > 0 && obstacle.h <= WORLD.unit;
  }
  function reflected(m, old, obstacle) {
    const n = { ...m };
    if (old.x + WORLD.marbleRadius <= obstacle.x || old.x - WORLD.marbleRadius >= obstacle.x + obstacle.w) {
      n.x = old.x;
      n.vx = -m.vx * 0.82;
    } else {
      n.y = old.y;
      n.vy = -m.vy * 0.82;
    }
    return n;
  }
  var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function requestJump(run2, heldMs = 0) {
    if (run2.status !== "playing" || run2.airborne > 0 || run2.jumpCooldown > 0) return run2;
    const charged = run2.superJumps > 0, units = (heldMs >= BOUNCE.holdMs ? BOUNCE.longUnits : BOUNCE.quickUnits) * (charged ? 2 : 1);
    const d = run2.lastDirection, origin = run2.marble, end = { x: origin.x + d.x * units * WORLD.unit, y: origin.y + d.y * units * WORLD.unit };
    const l = LEVELS[run2.levelIndex];
    let destination = { ...origin };
    const samples = Math.ceil(units * WORLD.unit / 3);
    for (let i = 1; i <= samples; i++) {
      const p = { x: origin.x + (end.x - origin.x) * i / samples, y: origin.y + (end.y - origin.y) * i / samples };
      if (p.x < WORLD.marbleRadius || p.x > WORLD.width - WORLD.marbleRadius || p.y < WORLD.marbleRadius || p.y > WORLD.height - WORLD.marbleRadius) break;
      if (l.obstacles.some((r) => r.h > WORLD.unit && pointInExpandedRect(p, r, WORLD.marbleRadius))) break;
      if (l.enemies.some((e) => circlesOverlap(p, WORLD.marbleRadius, e, e.r))) break;
      destination = { ...origin, x: p.x, y: p.y };
    }
    if (destination.x === origin.x && destination.y === origin.y) return run2;
    return { ...run2, marble: destination, airborne: BOUNCE.airborneSeconds, jumpCooldown: BOUNCE.cooldownSeconds, jumpKind: charged ? "super" : "normal", superJumps: run2.superJumps - (charged ? 1 : 0) };
  }
  function step(run2, input2, dt) {
    if (run2.status !== "playing") return run2;
    const l = LEVELS[run2.levelIndex], m = { ...run2.marble };
    const terrain = l.features.find((f) => ["ice", "sticky", "sand", "merry"].includes(f.type) && circlesOverlap(m, WORLD.marbleRadius, f, f.r));
    const drag = (terrain == null ? void 0 : terrain.type) === "ice" ? 0.97 : (terrain == null ? void 0 : terrain.type) === "sticky" ? 0.65 : (terrain == null ? void 0 : terrain.type) === "sand" ? 0.55 : 0.89;
    const dizzy = Math.max(0, run2.dizzy - dt), onMerry = (terrain == null ? void 0 : terrain.type) === "merry" && run2.airborne <= 0;
    const steer = onMerry || dizzy > 0 ? { x: input2.y, y: -input2.x } : input2;
    let gx = 0, gy = 0, gravity = false;
    if (run2.difficulty !== "beginner" && run2.airborne <= 0) for (const f of l.features) {
      if (f.type !== "pit") continue;
      const dx = f.x - m.x, dy = f.y - m.y, dist = Math.hypot(dx, dy) || 1, reach = f.r + 75;
      if (dist < reach) {
        gravity = true;
        const force = (run2.difficulty === "pro" ? 2 : 1) * 0.105 * (1 - dist / reach);
        gx += dx / dist * force;
        gy += dy / dist * force;
      }
    }
    const steering = 1;
    m.vx = (m.vx + steer.x * 0.21 * steering * dt * 60 + gx * dt * 60) * Math.pow(drag, dt * 60);
    m.vy = (m.vy + steer.y * 0.21 * steering * dt * 60 + gy * dt * 60) * Math.pow(drag, dt * 60);
    const old = { ...m };
    m.x += m.vx * dt * 60;
    m.y += m.vy * dt * 60;
    const mag = Math.hypot(input2.x, input2.y), lastDirection = mag > 0.1 ? { x: input2.x / mag, y: input2.y / mag } : run2.lastDirection;
    const enemies = moveEnemies(run2.enemies, dt);
    let hitWall = false, exterior = false;
    if (m.x < WORLD.marbleRadius || m.x > WORLD.width - WORLD.marbleRadius || m.y < WORLD.marbleRadius || m.y > WORLD.height - WORLD.marbleRadius) {
      exterior = true;
      const hitX = m.x < WORLD.marbleRadius || m.x > WORLD.width - WORLD.marbleRadius, hitY = m.y < WORLD.marbleRadius || m.y > WORLD.height - WORLD.marbleRadius;
      m.x = clamp(m.x, WORLD.marbleRadius, WORLD.width - WORLD.marbleRadius);
      m.y = clamp(m.y, WORLD.marbleRadius, WORLD.height - WORLD.marbleRadius);
      if (run2.difficulty === "pro") hitWall = true;
      else if (run2.difficulty === "standard") {
        if (hitX) m.vx = -m.vx * 1.3;
        if (hitY) m.vy = -m.vy * 1.3;
      } else {
        m.vx = 0;
        m.vy = 0;
      }
    }
    for (const r of l.obstacles) {
      if (collisionAllowed(r, run2) || !pointInExpandedRect(m, r, WORLD.marbleRadius)) continue;
      if (r.type === "rebound") {
        Object.assign(m, reflected(m, old, r));
      } else hitWall = true;
    }
    let pit = false, spikes = false;
    for (const f of l.features) {
      if (!circlesOverlap(m, WORLD.marbleRadius, f, f.r)) continue;
      if (f.type === "pit" && run2.difficulty !== "beginner" && run2.airborne <= 0) pit = true;
      if (f.type === "spikes" && run2.airborne <= 0) spikes = true;
      if (f.type === "bumper" && run2.airborne <= 0) {
        const dx = m.x - f.x, dy = m.y - f.y, len = Math.hypot(dx, dy) || 1;
        m.x = f.x + dx / len * (f.r + WORLD.marbleRadius + 1);
        m.y = f.y + dy / len * (f.r + WORLD.marbleRadius + 1);
        m.vx = dx / len * 3;
        m.vy = dy / len * 3;
      }
    }
    const bombs = run2.bombs.map((b) => {
      if (b.phase === "idle" && run2.airborne <= 0 && circlesOverlap(m, WORLD.marbleRadius, b, BOMB.triggerRadius)) return { ...b, phase: "fuse", time: BOMB.fuseSeconds };
      if (b.phase === "fuse") {
        const time = b.time - dt;
        return time <= 0 ? { ...b, phase: "blast", time: BOMB.blastSeconds } : { ...b, time };
      }
      if (b.phase === "blast") {
        const time = b.time - dt;
        return time <= 0 ? { ...b, phase: "spent", time: 0 } : { ...b, time };
      }
      return b;
    });
    const bombHit = run2.airborne <= 0 && bombs.some((b) => b.phase === "blast" && circlesOverlap(m, WORLD.marbleRadius, b, BOMB.blastRadius));
    const powerups = run2.powerups.map((p) => !p.collected && circlesOverlap(m, WORLD.marbleRadius, p, 14) ? { ...p, collected: true } : p);
    const superJumps = run2.superJumps + powerups.filter((p, i) => p.collected && !run2.powerups[i].collected).length;
    const hitEnemy = run2.airborne <= 0 && enemies.some((e) => circlesOverlap(m, WORLD.marbleRadius, e, e.r));
    if ((hitWall || pit || spikes || hitEnemy || bombHit) && (onMerry || dizzy > 0)) return { ...run2, marble: { ...l.start, vx: 0, vy: 0 }, enemies, powerups, bombs, superJumps, lastDirection, airborne: 0, jumpKind: null, dizzy: 0, terrain: null, gravity: false };
    if (hitWall || pit || spikes || hitEnemy || bombHit) return { ...run2, lives: run2.lives - 1, marble: { ...l.start, vx: 0, vy: 0 }, enemies, powerups, bombs: l.bombs.map((b) => ({ ...b, phase: "idle", time: 0 })), superJumps, lastDirection, status: run2.lives <= 1 ? "lost" : "playing", failure: bombHit ? "explode" : pit ? "fall" : exterior ? "spikes" : failureFor(run2), airborne: 0, jumpKind: null, jumpCooldown: 0, dizzy: 0, terrain: null, gravity: false };
    if (circlesOverlap(m, WORLD.marbleRadius, l.goal, WORLD.goalRadius)) return { ...run2, marble: m, enemies, powerups, bombs, superJumps, status: run2.levelIndex === LEVELS.length - 1 ? "won" : "cleared" };
    const remaining = Math.max(0, run2.remaining - dt), airborne = Math.max(0, run2.airborne - dt);
    return { ...run2, marble: m, enemies, powerups, bombs, superJumps, remaining, lastDirection, airborne, jumpCooldown: Math.max(0, run2.jumpCooldown - dt), jumpKind: airborne > 0 ? run2.jumpKind : null, status: remaining === 0 ? "lost" : "playing", failure: remaining === 0 ? failureFor(run2) : run2.failure, dizzy: onMerry ? Math.max(dizzy, 0.75) : dizzy, terrain: (terrain == null ? void 0 : terrain.type) || null, gravity };
  }
  function nextLevel(run2) {
    return newRun(Math.min(run2.levelIndex + 1, LEVELS.length - 1), run2.difficulty);
  }
  function cameraFor(run2, viewportHeight = VIEWPORT.height) {
    const look = run2.lastDirection.y < -0.15 ? CAMERA_LEAD.forward : run2.lastDirection.y > 0.15 ? CAMERA_LEAD.backward : CAMERA_LEAD.neutral;
    return Math.max(0, Math.min(WORLD.height - viewportHeight, run2.marble.y - viewportHeight / 2 + look));
  }

  // app.js
  var $ = (s) => document.querySelector(s);
  var c = $("#game");
  var ctx = c.getContext("2d");
  var run = newRun();
  var phase = "splash";
  var menu = false;
  var paused = false;
  var tilt = false;
  var speed = 3;
  var input = { x: 0, y: 0 };
  var keys = /* @__PURE__ */ new Set();
  var last = performance.now();
  var camera = cameraFor(run);
  var selected = "standard";
  var jumpStart = 0;
  var transitionUntil = 0;
  var clamp2 = (n, a, b) => Math.max(a, Math.min(b, n));
  function status(t) {
    $("#notice").textContent = t;
  }
  function show(p) {
    phase = p;
    $("#splash").hidden = p !== "splash";
    $("#start-menu").hidden = p !== "menu";
    for (const id of ["hud", "tilt", "waffle", "dpad", "speed"]) $("#" + id).hidden = p !== "playing";
  }
  function sync() {
    const l = LEVELS[run.levelIndex];
    $("#level").textContent = `${String(run.levelIndex + 1).padStart(2, "0")} ${l.name}`;
    $("#lives").textContent = "\u25CF ".repeat(run.lives);
    $("#timer").textContent = run.remaining.toFixed(0);
    $("#speed").textContent = `speed ${speed} \u2195`;
    $("#dpad").classList.toggle("tilt-mode", tilt);
  }
  function start() {
    run = newRun(0, selected);
    camera = cameraFor(run);
    paused = false;
    transitionUntil = 0;
    menu = false;
    $("#menu").hidden = true;
    show("playing");
    status("roll to the glowing exit");
    sync();
  }
  $("#continue").onclick = () => show("menu");
  $("#start").onclick = start;
  $("#difficulty").onchange = (e) => selected = e.target.value;
  function openMenu(v) {
    menu = v;
    $("#menu").hidden = !v;
    sync();
  }
  $("#waffle").onclick = () => openMenu(!menu);
  $("#close-menu").onclick = $("#resume").onclick = () => openMenu(false);
  $("#restart").onclick = start;
  $("#pause").onclick = () => {
    paused = !paused;
    $("#pause").textContent = paused ? "resume" : "pause";
  };
  function adjust(n) {
    speed = clamp2(speed + n, 1, 5);
    sync();
    status(`speed ${speed}`);
  }
  $("#slower").onclick = () => adjust(-1);
  $("#faster").onclick = () => adjust(1);
  addEventListener("wheel", (e) => {
    if (phase !== "playing") return;
    e.preventDefault();
    adjust(e.deltaY > 0 ? -1 : 1);
  }, { passive: false });
  var touchY = null;
  $("#speed").addEventListener("pointerdown", (e) => {
    var _a, _b;
    touchY = e.clientY;
    (_b = (_a = $("#speed")).setPointerCapture) == null ? void 0 : _b.call(_a, e.pointerId);
  });
  $("#speed").addEventListener("pointerup", (e) => {
    if (touchY === null) return;
    const delta = touchY - e.clientY;
    adjust(delta > 8 ? 1 : delta < -8 ? -1 : 1);
    touchY = null;
  });
  $("#tilt").onclick = async () => {
    try {
      if (typeof DeviceOrientationEvent === "undefined") throw Error();
      if (typeof DeviceOrientationEvent.requestPermission === "function" && await DeviceOrientationEvent.requestPermission() !== "granted") throw Error();
      tilt = true;
      status("tilt steering enabled");
    } catch {
      tilt = false;
      status("tilt unavailable \xB7 use touch arrows");
    }
    sync();
  };
  addEventListener("deviceorientation", (e) => {
    if (!tilt || e.gamma == null || e.beta == null) return;
    input.x = clamp2(e.gamma / 25, -1, 1);
    input.y = clamp2(e.beta / 25, -1, 1);
  });
  for (const b of document.querySelectorAll(".pad-dir")) {
    const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, v = vectors[b.dataset.direction];
    b.addEventListener("pointerdown", (e) => {
      var _a;
      e.preventDefault();
      (_a = b.setPointerCapture) == null ? void 0 : _a.call(b, e.pointerId);
      if (!tilt) {
        input.x = v[0];
        input.y = v[1];
      }
    });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(ev, () => {
      if (!tilt) {
        input.x = 0;
        input.y = 0;
      }
    });
  }
  function jump(ms) {
    if (phase !== "playing" || menu || paused || run.status !== "playing") return;
    const n = requestJump(run, ms);
    if (n !== run) {
      run = n;
      status(ms >= BOUNCE.holdMs ? "long jump" : "jump");
    }
  }
  $("#bounce").addEventListener("pointerdown", (e) => {
    var _a, _b;
    e.preventDefault();
    jumpStart = performance.now();
    (_b = (_a = $("#bounce")).setPointerCapture) == null ? void 0 : _b.call(_a, e.pointerId);
  });
  $("#bounce").addEventListener("pointerup", () => jump(performance.now() - jumpStart));
  addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    if (e.key === " " && !e.repeat) {
      e.preventDefault();
      jumpStart = performance.now();
    }
    if (e.key === "Escape" && phase === "playing") openMenu(!menu);
  });
  addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === " ") jump(performance.now() - jumpStart);
  });
  function project(x, y) {
    const dy = y - camera;
    return { x: 120 + (x - 160) * 0.63 + (dy - 188) * 0.27, y: 146 + (dy - 188) * 0.63 - (x - 160) * 0.24 };
  }
  function polygon(points, fill, stroke = "#0006") {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  function rect(x, y, w, h, color, height = 6) {
    const a = project(x, y), b = project(x + w, y), d = project(x + w, y + h), e = project(x, y + h);
    polygon([a, b, d, e], color);
    polygon([e, d, { x: d.x, y: d.y + height }, { x: e.x, y: e.y + height }], "#13242d");
    polygon([b, d, { x: d.x, y: d.y + height }, { x: b.x, y: b.y + height }], "#294b57");
  }
  function orb(x, y, r, color) {
    const p = project(x, y);
    ctx.fillStyle = "#03070d88";
    ctx.beginPath();
    ctx.ellipse(p.x + 3, p.y + 8, r * 0.75, r * 0.37, 0, 0, 7);
    ctx.fill();
    const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.5, 1, p.x, p.y, r);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.2, color);
    g.addColorStop(1, "#142033");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 7);
    ctx.fill();
  }
  function draw() {
    ctx.fillStyle = "#09151e";
    ctx.fillRect(0, 0, 240, 282);
    rect(0, camera, WORLD.width, VIEWPORT.height, "#254953", 10);
    const l = LEVELS[run.levelIndex];
    for (const o of l.obstacles) rect(o.x, o.y, o.w, o.h, o.type === "rebound" ? "#43c8cf" : o.type === "half" ? "#d5ad50" : "#b1d4cf", o.type === "half" ? 3 : 8);
    for (const f of l.features) {
      if (f.y < camera - 25 || f.y > camera + VIEWPORT.height + 25) continue;
      const p = project(f.x, f.y);
      ctx.fillStyle = { pit: "#05030d", spikes: "#eb666c", sand: "#b39b71", merry: "#b185da", ice: "#7fd3ef", sticky: "#725843", bumper: "#4fede1" }[f.type];
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, f.r * 0.67, f.r * 0.4, -0.35, 0, 7);
      ctx.fill();
    }
    for (const b of run.bombs) if (b.phase !== "spent") {
      orb(b.x, b.y, 7, b.phase === "fuse" ? "#ffb34c" : "#d85857");
      if (b.phase === "blast") {
        const p = project(b.x, b.y);
        ctx.strokeStyle = "#ffda74";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, 0, 7);
        ctx.stroke();
      }
    }
    for (const e of run.enemies) orb(e.x, e.y, 9, "#d94565");
    for (const p of run.powerups) if (!p.collected) orb(p.x, p.y, 6, "#ffe260");
    orb(l.goal.x, l.goal.y, 14, "#66ffcd");
    orb(run.marble.x, run.marble.y - (run.airborne > 0 ? 14 : 0), 10, "#ff733d");
  }
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1e3);
    last = now;
    if (phase === "playing" && !menu && !paused) {
      if (run.status === "playing" && now >= transitionUntil) {
        let x = input.x, y = input.y;
        if (!tilt) {
          x += (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
          y += (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
        }
        run = step(run, { x: clamp2(x, -1, 1) * speed / 3, y: clamp2(y, -1, 1) * speed / 3 }, dt);
      }
      if (run.status === "cleared") {
        status(`level ${run.levelIndex + 1} clear`);
        run = nextLevel(run);
        transitionUntil = now + 600;
      }
      if (run.status === "won") {
        paused = true;
        status("all 20 courses cleared!");
      }
      if (run.status === "lost") {
        paused = true;
        status("run over \xB7 open menu to restart");
      }
      camera += (cameraFor(run) - camera) * Math.min(1, dt * 9);
      sync();
      draw();
    }
    requestAnimationFrame(frame);
  }
  show("splash");
  sync();
  requestAnimationFrame(frame);
})();
