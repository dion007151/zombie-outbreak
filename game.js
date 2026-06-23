const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const music = document.getElementById("music");

const W = canvas.width;
const H = canvas.height;
const HALF_W = W / 2;
const HALF_H = H / 2;
const FOV = Math.PI / 3;
const NUM_RAYS = 360;
const MAX_DEPTH = 20;
const RAY_STEP = FOV / NUM_RAYS;
const WALL_SCALE = W / NUM_RAYS;
const SCREEN_DIST = HALF_W / Math.tan(FOV / 2);
const PLAYER_SPEED = 3.1;
const ROT_SPEED = 2.2;
const ZOMBIE_SPEED = 0.72;
const ATTACK_DISTANCE = 0.78;
const CHASE_DISTANCE = 7;

const level = [
  [1, 2, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 2, 1, 2, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 2, 0, 2, 0, 1, 0, 1, 2, 1],
  [1, 0, 2, 1, 0, 2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 2, 0, 2, 1, 2, 1, 2, 0, 2],
  [2, 0, 2, 0, 1, 2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 2, 1, 2, 1, 2, 1, 0, 2, 1, 2, 1, 2, 1, 2, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 1],
  [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 0, 1, 2, 1, 2, 1, 2, 1, 1, 2],
  [1, 0, 0, 0, 2, 0, 1, 2, 1, 2, 1, 2, 1, 2, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1],
  [2, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 2, 0, 2, 1, 2, 1, 2],
  [1, 0, 2, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 2, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 2, 1, 2, 1, 2, 1, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2],
];

const keys = new Set();
const images = {};
let audioContext;
let masterGain;
let lastTime = performance.now();
let state = "menu";
let gameStarted = false;
let mouseLocked = false;
let shake = 0;
let redFlash = 0;
let muzzleFlash = 0;
let lastGroan = 0;
let nextGroan = 1800;
let zBuffer = new Array(NUM_RAYS).fill(MAX_DEPTH);
let particles = [];

const player = {
  x: 1.5,
  y: 5.5,
  angle: 0,
  health: 100,
  ammo: 90,
  bob: 0,
  bobTime: 0,
  won: false,
};

let zombies = [];
let pickups = [];

function loadImage(name, src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve([name, image]);
    image.onerror = () => resolve([name, null]);
    image.src = src;
  });
}

function normalizeAngle(angle) {
  return (angle + Math.PI * 2) % (Math.PI * 2);
}

function angleDelta(a, b) {
  return ((a - b + Math.PI) % (Math.PI * 2)) - Math.PI;
}

function cell(x, y) {
  if (y < 0 || y >= level.length || x < 0 || x >= level[0].length) return 1;
  return level[y][x];
}

function isWall(x, y) {
  return cell(Math.floor(x), Math.floor(y)) > 0;
}

function canMove(x, y) {
  const pad = 0.18;
  return !isWall(x - pad, y) && !isWall(x + pad, y) && !isWall(x, y - pad) && !isWall(x, y + pad);
}

function resetGame() {
  player.x = 1.5;
  player.y = 5.5;
  player.angle = 0;
  player.health = 100;
  player.ammo = 90;
  player.bob = 0;
  player.bobTime = 0;
  player.won = false;
  particles = [];
  redFlash = 0;
  shake = 0;
  muzzleFlash = 0;
  zombies = [];
  pickups = [
    { x: 2.5, y: 5.5, kind: "health", alive: true },
    { x: 11.5, y: 3.5, kind: "ammo", alive: true },
    { x: 15.5, y: 1.5, kind: "ammo", alive: true },
    { x: 2.5, y: 14.5, kind: "health", alive: true },
    { x: 21.5, y: 13.5, kind: "ammo", alive: true },
  ];

  const spawnPoints = [
    [7.5, 1.5], [14.5, 1.5], [18.5, 2.5], [4.5, 4.5], [20.5, 5.5],
    [8.5, 7.5], [12.5, 7.5], [16.5, 7.5], [5.5, 11.5], [18.5, 11.5],
    [7.5, 14.5], [12.5, 14.5], [20.5, 14.5], [22.5, 8.5],
  ];
  zombies = spawnPoints.map(([x, y], index) => ({
    x,
    y,
    health: 34,
    alive: true,
    deadTime: 0,
    hit: 0,
    attackCooldown: 0,
    wobble: index * 1.7,
  }));
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.52;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();
  music.volume = 0.28;
  music.play().catch(() => {});
}

function tone(type, frequency, duration, gain, bend = 0) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (bend) oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, frequency + bend), now + duration);
  envelope.gain.setValueAtTime(0.001, now);
  envelope.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(masterGain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.03);
}

function noiseBurst(duration, gain, filterFreq) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const envelope = audioContext.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  envelope.gain.setValueAtTime(gain, now);
  envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(masterGain);
  source.start(now);
}

const sfx = {
  shoot() {
    noiseBurst(0.16, 0.5, 1900);
    tone("square", 94, 0.1, 0.22, -42);
  },
  zombie() {
    tone("sawtooth", 78 + Math.random() * 32, 0.72, 0.16, -28);
    noiseBurst(0.45, 0.12, 420);
  },
  hit() {
    noiseBurst(0.15, 0.32, 720);
    tone("triangle", 180, 0.12, 0.14, -60);
  },
  hurt() {
    tone("sawtooth", 52, 0.38, 0.24, -18);
    noiseBurst(0.3, 0.22, 300);
  },
  pickup() {
    tone("sine", 420, 0.1, 0.16, 150);
    tone("sine", 720, 0.11, 0.12, 40);
  },
  empty() {
    tone("square", 120, 0.08, 0.12, -40);
  },
  win() {
    tone("sine", 330, 0.2, 0.18, 110);
    setTimeout(() => tone("sine", 550, 0.24, 0.18, 160), 140);
  },
};

function startGame(fresh) {
  ensureAudio();
  if (fresh || !gameStarted) resetGame();
  gameStarted = true;
  state = "playing";
  continueButton.disabled = false;
  menu.classList.add("hidden");
  canvas.requestPointerLock?.();
}

function showMenu() {
  state = "menu";
  menu.classList.remove("hidden");
  continueButton.disabled = !gameStarted;
  document.exitPointerLock?.();
}

function castRay(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let depth = 0.02;
  while (depth < MAX_DEPTH) {
    const x = player.x + cos * depth;
    const y = player.y + sin * depth;
    const tile = cell(Math.floor(x), Math.floor(y));
    if (tile) {
      const hitX = x - Math.floor(x);
      const hitY = y - Math.floor(y);
      const vertical = hitX < 0.04 || hitX > 0.96;
      const offset = vertical ? hitY : hitX;
      return { depth, tile, offset, vertical };
    }
    depth += 0.025;
  }
  return { depth: MAX_DEPTH, tile: 1, offset: 0, vertical: false };
}

function updatePlayer(dt) {
  let moveX = 0;
  let moveY = 0;
  const forward = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const strafe = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
  if (!mouseLocked) {
    player.angle = normalizeAngle(player.angle + (Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"))) * ROT_SPEED * dt);
  }
  const cos = Math.cos(player.angle);
  const sin = Math.sin(player.angle);
  moveX += (cos * forward - sin * strafe) * PLAYER_SPEED * dt;
  moveY += (sin * forward + cos * strafe) * PLAYER_SPEED * dt;
  const moving = Math.abs(moveX) + Math.abs(moveY) > 0;
  if (canMove(player.x + moveX, player.y)) player.x += moveX;
  if (canMove(player.x, player.y + moveY)) player.y += moveY;
  player.bob = moving ? Math.sin((player.bobTime += dt * 11)) * 9 : 0;
  if (cell(Math.floor(player.x), Math.floor(player.y)) === 3 && !player.won) {
    player.won = true;
    state = "win";
    sfx.win();
    setTimeout(showMenu, 1700);
  }
}

function hasLineOfSight(zombie) {
  const dx = player.x - zombie.x;
  const dy = player.y - zombie.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(3, Math.floor(dist * 8));
  for (let i = 1; i < steps; i++) {
    const x = zombie.x + (dx * i) / steps;
    const y = zombie.y + (dy * i) / steps;
    if (isWall(x, y)) return false;
  }
  return true;
}

function updateZombies(dt, time) {
  for (const zombie of zombies) {
    if (!zombie.alive) continue;
    zombie.hit = Math.max(0, zombie.hit - dt);
    zombie.attackCooldown = Math.max(0, zombie.attackCooldown - dt);
    if (zombie.health <= 0) {
      zombie.deadTime += dt;
      if (zombie.deadTime > 0.75) zombie.alive = false;
      continue;
    }

    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ATTACK_DISTANCE && zombie.attackCooldown <= 0) {
      zombie.attackCooldown = 0.85;
      player.health = Math.max(0, player.health - 8);
      redFlash = 0.72;
      shake = 11;
      sfx.hurt();
      if (player.health <= 0) {
        state = "dead";
        setTimeout(showMenu, 1600);
      }
    } else if (dist < CHASE_DISTANCE && hasLineOfSight(zombie)) {
      const angle = Math.atan2(dy, dx) + Math.sin(time * 0.004 + zombie.wobble) * 0.26;
      const speed = ZOMBIE_SPEED * (0.72 + Math.sin(time * 0.007 + zombie.wobble) * 0.28);
      const nx = zombie.x + Math.cos(angle) * speed * dt;
      const ny = zombie.y + Math.sin(angle) * speed * dt;
      if (canMove(nx, zombie.y)) zombie.x = nx;
      if (canMove(zombie.x, ny)) zombie.y = ny;
    }
  }

  if (time - lastGroan > nextGroan && zombies.some((z) => z.alive && z.health > 0)) {
    lastGroan = time;
    nextGroan = 1800 + Math.random() * 2600;
    sfx.zombie();
  }
}

function updatePickups() {
  for (const pickup of pickups) {
    if (!pickup.alive) continue;
    if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 0.58) {
      pickup.alive = false;
      if (pickup.kind === "health") player.health = Math.min(100, player.health + 28);
      if (pickup.kind === "ammo") player.ammo += 18;
      sfx.pickup();
    }
  }
}

function fireWeapon() {
  if (state !== "playing") return;
  ensureAudio();
  if (player.ammo <= 0) {
    sfx.empty();
    return;
  }
  player.ammo--;
  muzzleFlash = 0.16;
  shake = 6;
  sfx.shoot();

  let target = null;
  let bestDistance = Infinity;
  for (const zombie of zombies) {
    if (!zombie.alive || zombie.health <= 0) continue;
    const dx = zombie.x - player.x;
    const dy = zombie.y - player.y;
    const dist = Math.hypot(dx, dy);
    const diff = Math.abs(angleDelta(Math.atan2(dy, dx), player.angle));
    if (diff < 0.18 && dist < bestDistance && hasLineOfSight(zombie)) {
      target = zombie;
      bestDistance = dist;
    }
  }
  if (target) {
    target.health -= 18;
    target.hit = 0.18;
    sfx.hit();
    for (let i = 0; i < 14; i++) {
      particles.push({
        x: HALF_W + (Math.random() - 0.5) * 26,
        y: HALF_H + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 110,
        life: 0.32 + Math.random() * 0.18,
      });
    }
  }
}

function updateParticles(dt) {
  particles = particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt;
    return p.life > 0;
  });
}

function drawSkyAndFloor() {
  if (images.skybox) {
    const offset = (player.angle / (Math.PI * 2)) * (images.skybox.width - W);
    ctx.drawImage(images.skybox, -offset, 0, images.skybox.width, HALF_H);
    if (offset > images.skybox.width - W) ctx.drawImage(images.skybox, images.skybox.width - offset, 0, images.skybox.width, HALF_H);
  } else {
    ctx.fillStyle = "#151922";
    ctx.fillRect(0, 0, W, HALF_H);
  }
  const floor = ctx.createLinearGradient(0, HALF_H, 0, H);
  floor.addColorStop(0, "#2a2220");
  floor.addColorStop(1, "#090707");
  ctx.fillStyle = floor;
  ctx.fillRect(0, HALF_H, W, HALF_H);
}

function wallColor(tile, shade) {
  const colors = {
    1: [138, 137, 129],
    2: [128, 100, 74],
    3: [60, 164, 92],
  };
  const c = colors[tile] || colors[1];
  return `rgb(${Math.max(0, c[0] - shade)}, ${Math.max(0, c[1] - shade)}, ${Math.max(0, c[2] - shade)})`;
}

function drawWalls() {
  let rayAngle = player.angle - FOV / 2;
  for (let ray = 0; ray < NUM_RAYS; ray++) {
    const hit = castRay(rayAngle);
    const corrected = hit.depth * Math.cos(player.angle - rayAngle);
    zBuffer[ray] = corrected;
    const projected = Math.min(H * 5, SCREEN_DIST / Math.max(0.001, corrected));
    const x = Math.floor(ray * WALL_SCALE);
    const y = HALF_H - projected / 2 + player.bob;
    const shade = Math.min(150, Math.floor(corrected * 18) + (hit.vertical ? 18 : 0));
    if (images.wall && hit.tile !== 3) {
      const sx = Math.floor(hit.offset * images.wall.width);
      ctx.drawImage(images.wall, sx, 0, 1, images.wall.height, x, y, Math.ceil(WALL_SCALE), projected);
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.68, shade / 190)})`;
      ctx.fillRect(x, y, Math.ceil(WALL_SCALE), projected);
    } else {
      ctx.fillStyle = wallColor(hit.tile, shade);
      ctx.fillRect(x, y, Math.ceil(WALL_SCALE), projected);
    }
    rayAngle += RAY_STEP;
  }
}

function projectSprite(entity, image, size = 0.85, tint = null) {
  const dx = entity.x - player.x;
  const dy = entity.y - player.y;
  const theta = Math.atan2(dy, dx);
  const delta = angleDelta(theta, player.angle);
  const dist = Math.hypot(dx, dy);
  if (Math.abs(delta) > FOV * 0.76 || dist < 0.35) return;
  const screenX = HALF_W + Math.tan(delta) * SCREEN_DIST;
  const projected = (SCREEN_DIST / dist) * size;
  const rayIndex = Math.floor(screenX / WALL_SCALE);
  if (rayIndex < 0 || rayIndex >= zBuffer.length || dist > zBuffer[rayIndex] + 0.15) return;

  const height = projected * (entity.health <= 0 ? Math.max(0.18, 1 - entity.deadTime) : 1);
  const width = projected;
  const x = screenX - width / 2;
  const y = HALF_H - height / 2 + projected * 0.22 + player.bob;
  if (image) {
    ctx.drawImage(image, x, y, width, height);
    if (tint) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = tint;
      ctx.fillRect(x, y, width, height);
      ctx.globalCompositeOperation = "source-over";
    }
  } else {
    ctx.fillStyle = tint || "#354d38";
    ctx.fillRect(x, y, width, height);
  }
}

function drawSprites() {
  const drawable = [
    ...pickups.filter((p) => p.alive).map((p) => ({ ...p, spriteKind: "pickup" })),
    ...zombies.filter((z) => z.alive).map((z) => ({ ...z, spriteKind: "zombie" })),
  ].sort((a, b) => Math.hypot(b.x - player.x, b.y - player.y) - Math.hypot(a.x - player.x, a.y - player.y));

  for (const entity of drawable) {
    if (entity.spriteKind === "pickup") {
      projectSprite(entity, null, 0.25, entity.kind === "health" ? "#f4f4f4" : "#d5b83f");
    } else {
      const tint = entity.hit > 0 ? "rgba(255, 0, 0, 0.42)" : null;
      projectSprite(entity, images.zombie, 0.9, tint);
    }
  }
}

function drawWeapon() {
  const recoil = muzzleFlash > 0 ? 24 : 0;
  if (images.weapon) {
    ctx.drawImage(images.weapon, HALF_W - 145, H - 230 + recoil + player.bob, 290, 290);
  } else {
    ctx.fillStyle = "#363638";
    ctx.fillRect(HALF_W - 52, H - 135 + recoil, 104, 135);
  }
  if (muzzleFlash > 0) {
    ctx.save();
    ctx.translate(HALF_W, H - 222 + player.bob);
    const pulse = muzzleFlash / 0.16;
    ctx.fillStyle = `rgba(255, 220, 82, ${pulse})`;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = (i % 2 ? 26 : 86) * pulse;
      const a = (Math.PI * 2 * i) / 16;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = "#56e56a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(HALF_W - 10, HALF_H);
  ctx.lineTo(HALF_W + 10, HALF_H);
  ctx.moveTo(HALF_W, HALF_H - 10);
  ctx.lineTo(HALF_W, HALF_H + 10);
  ctx.stroke();
}

function drawHud() {
  ctx.font = "22px Arial";
  ctx.fillStyle = "#f44343";
  ctx.fillText(`Health: ${Math.ceil(player.health)}`, 18, H - 24);
  ctx.fillStyle = "#6aa7ff";
  ctx.fillText(`Ammo: ${player.ammo}`, W - 130, H - 24);
  ctx.fillStyle = "#62df72";
  ctx.fillText(`Zombies: ${zombies.filter((z) => z.alive && z.health > 0).length}`, 18, 30);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fillRect(W - 150, 18, 132, 96);
  const sx = 132 / level[0].length;
  const sy = 96 / level.length;
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      if (level[y][x]) {
        ctx.fillStyle = level[y][x] === 3 ? "#4ccd73" : "#6d6d72";
        ctx.fillRect(W - 150 + x * sx, 18 + y * sy, sx, sy);
      }
    }
  }
  ctx.fillStyle = "#54eb67";
  ctx.beginPath();
  ctx.arc(W - 150 + player.x * sx, 18 + player.y * sy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawEffects(dt) {
  for (const p of particles) {
    ctx.fillStyle = `rgba(155, 0, 0, ${Math.max(0, p.life * 2.2)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (redFlash > 0) {
    ctx.fillStyle = `rgba(180, 0, 0, ${redFlash * 0.32})`;
    ctx.fillRect(0, 0, W, H);
    redFlash = Math.max(0, redFlash - dt * 1.7);
  }
  if (state === "dead" || state === "win") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "bold 62px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = state === "win" ? "#69e978" : "#e03131";
    ctx.fillText(state === "win" ? "YOU SURVIVED" : "GAME OVER", HALF_W, HALF_H);
    ctx.textAlign = "left";
  }
}

function render(dt) {
  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake = Math.max(0, shake - dt * 32);
  }
  drawSkyAndFloor();
  drawWalls();
  drawSprites();
  drawWeapon();
  drawHud();
  drawEffects(dt);
  ctx.restore();
}

function update(dt, time) {
  if (state === "playing") {
    updatePlayer(dt);
    updateZombies(dt, time);
    updatePickups();
  }
  muzzleFlash = Math.max(0, muzzleFlash - dt);
  updateParticles(dt);
}

function loop(time) {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  if (!gameStarted) {
    ctx.clearRect(0, 0, W, H);
  } else {
    update(dt, time);
    render(dt);
  }
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Escape" && state === "playing") showMenu();
  if (event.code === "Enter" && state === "menu") startGame(!gameStarted);
  if (event.code === "KeyC" && state === "menu" && gameStarted) startGame(false);
});

window.addEventListener("keyup", (event) => keys.delete(event.code));
canvas.addEventListener("click", () => {
  if (state === "playing") fireWeapon();
});
document.addEventListener("pointerlockchange", () => {
  mouseLocked = document.pointerLockElement === canvas;
});
document.addEventListener("mousemove", (event) => {
  if (state === "playing" && mouseLocked) {
    player.angle = normalizeAngle(player.angle + event.movementX * 0.0024);
  }
});

startButton.addEventListener("click", () => startGame(true));
continueButton.addEventListener("click", () => {
  if (gameStarted) startGame(false);
});

Promise.all([
  loadImage("wall", "wall.png"),
  loadImage("zombie", "zombie.png"),
  loadImage("weapon", "weapon.png"),
  loadImage("skybox", "skybox.png"),
]).then((loaded) => {
  for (const [name, image] of loaded) images[name] = image;
  requestAnimationFrame(loop);
});
