const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const shell = document.querySelector(".shell");
const menu = document.getElementById("menu");
const touchControls = document.getElementById("touchControls");
const movePad = document.getElementById("movePad");
const moveKnob = document.getElementById("moveKnob");
const shootButton = document.getElementById("shootButton");
const music = document.getElementById("music");

// Title Screen Redesign Elements
const menuEffectsCanvas = document.getElementById("menuEffects");
const menuEffectsCtx = menuEffectsCanvas ? menuEffectsCanvas.getContext("2d") : null;
const playBtn = document.getElementById("playBtn");
const settingsBtn = document.getElementById("settingsBtn");
const exitBtn = document.getElementById("exitBtn");
const characterSelectContainer = document.getElementById("characterSelectContainer");
const mainMenuActions = document.getElementById("mainMenuActions");
const settingsPanel = document.getElementById("settingsPanel");
const confirmCharacterBtn = document.getElementById("confirmCharacterBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const characterButtons = [...document.querySelectorAll(".character-option")];

// Audio control elements
const masterVolumeRange = document.getElementById("masterVolumeRange");
const musicToggle = document.getElementById("musicToggle");
const fxToggle = document.getElementById("fxToggle");

let W = canvas.width;
let H = canvas.height;
let HALF_W = W / 2;
let HALF_H = H / 2;
const FOV = Math.PI / 3;
const NUM_RAYS = 360;
const MAX_DEPTH = 20;
const RAY_STEP = FOV / NUM_RAYS;
let WALL_SCALE = W / NUM_RAYS;
let SCREEN_DIST = HALF_W / Math.tan(FOV / 2);
const PLAYER_SPEED = 3.1;
const ROT_SPEED = 2.2;
const ZOMBIE_SPEED = 0.72;
const ATTACK_DISTANCE = 0.78;
const CHASE_DISTANCE = 7;
const MAX_CANVAS_DPR = 2;
const SPRITE_OCCLUSION_PAD = 0.35;
const TOUCH_LOOK_SENSITIVITY = 0.0048;
const MOUSE_DRAG_SENSITIVITY = 0.0036;
const POINTER_LOCK_SENSITIVITY = 0.0024;

function resizeCanvas() {
  const rect = shell?.getBoundingClientRect() || canvas.getBoundingClientRect();
  const nextW = Math.max(320, Math.round(rect.width || window.innerWidth || 800));
  const nextH = Math.max(240, Math.round(rect.height || window.innerHeight || 600));
  const dpr = Math.max(1, Math.min(MAX_CANVAS_DPR, window.devicePixelRatio || 1));
  const pixelW = Math.round(nextW * dpr);
  const pixelH = Math.round(nextH * dpr);

  W = nextW;
  H = nextH;
  HALF_W = W / 2;
  HALF_H = H / 2;
  WALL_SCALE = W / NUM_RAYS;
  SCREEN_DIST = HALF_W / Math.tan(FOV / 2);

  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

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
let lookDrag = null;
let moveTouch = null;
let virtualForward = 0;
let virtualStrafe = 0;

const player = {
  x: 1.5,
  y: 5.5,
  angle: 0,
  character: "boy",
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setCharacter(character) {
  player.character = character;
  for (const button of characterButtons) {
    const selected = button.dataset.character === character;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
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

// Layered horror sound system variables
let windNode = null;
let droneOscs = [];
let sirenNode = null;
let isAudioInitialized = false;

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  if (!audioContext) {
    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    // Default master gain matches volume setting (0.5)
    masterGain.gain.value = 0.5;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") audioContext.resume();

  // Initialize Layered Ambient OST and Soundscapes
  if (!isAudioInitialized) {
    isAudioInitialized = true;
    startProceduralWind();
    startProceduralDrone();
    startProceduralSirenScheduler();
  }

  // Play standard bgm as well if enabled
  music.volume = musicToggle && !musicToggle.checked ? 0.0 : 0.22;
  music.play().catch(() => {});
}

// Layer 1: Ambient Wind Noise
function startProceduralWind() {
  if (!audioContext) return;
  
  const bufferSize = audioContext.sampleRate * 2; // 2 seconds of noise
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = audioContext.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const windFilter = audioContext.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 350;
  windFilter.Q.value = 2.0;

  const windGain = audioContext.createGain();
  windGain.gain.value = 0.08;

  // Modulate wind intensity dynamically over time using LFO
  const lfo = audioContext.createOscillator();
  lfo.frequency.value = 0.08; // Very slow modulation
  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = 150; // Pitch swing range

  lfo.connect(lfoGain);
  lfoGain.connect(windFilter.frequency);
  whiteNoise.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);

  lfo.start();
  whiteNoise.start();
  
  windNode = { whiteNoise, lfo, windGain };
}

// Layer 2: Fear & Hunger Inspired Horror Drone OST
function startProceduralDrone() {
  if (!audioContext) return;

  const freqs = [55, 55.4, 82.4, 110]; // Low detuned E / A chord elements
  droneOscs = freqs.map((freq, idx) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
    osc.frequency.value = freq + (Math.random() - 0.5) * 0.8; // Detune slightly
    
    // Oppressive breathing/swelling volume modulation
    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 0.12 + idx * 0.03;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 0.02;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180 + idx * 40;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    // Dynamic base drone levels
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);

    lfo.start();
    osc.start();
    return { osc, lfo, gain };
  });
}

// Layer 3: Faint Distant Emergency Siren Scheduler & Groans
function startProceduralSirenScheduler() {
  if (!audioContext) return;

  const playDistantSiren = () => {
    if (state !== "menu") {
      setTimeout(playDistantSiren, 15000);
      return;
    }

    const now = audioContext.currentTime;
    const sirenOsc = audioContext.createOscillator();
    const sirenGain = audioContext.createGain();
    
    sirenOsc.type = "sine";
    sirenOsc.frequency.setValueAtTime(260, now);
    
    // Slow wailing modulation
    sirenOsc.frequency.linearRampToValueAtTime(320, now + 2);
    sirenOsc.frequency.linearRampToValueAtTime(260, now + 4);
    sirenOsc.frequency.linearRampToValueAtTime(320, now + 6);
    sirenOsc.frequency.linearRampToValueAtTime(260, now + 8);

    sirenGain.gain.setValueAtTime(0.001, now);
    sirenGain.gain.linearRampToValueAtTime(0.03, now + 2); // Faint/distant
    sirenGain.gain.linearRampToValueAtTime(0.001, now + 8);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(masterGain);
    sirenOsc.start(now);
    sirenOsc.stop(now + 8);

    // Schedule next run
    setTimeout(playDistantSiren, 12000 + Math.random() * 15000);
  };

  const playDistantGroan = () => {
    if (state !== "menu") {
      setTimeout(playDistantGroan, 10000);
      return;
    }
    
    if (fxToggle && fxToggle.checked) {
      creepyGrowl(1.5 + Math.random() * 1.0);
    }
    setTimeout(playDistantGroan, 14000 + Math.random() * 18000);
  };

  setTimeout(playDistantSiren, 5000);
  setTimeout(playDistantGroan, 8000);
}

// Adjust ambience intensity based on button hover interaction
function setMenuAmbienceIntensity(isHovering) {
  if (!audioContext || !droneOscs.length) return;
  const now = audioContext.currentTime;
  droneOscs.forEach((drone) => {
    // Elevate pitch or filter slightly on hover for atmospheric feedback
    drone.gain.gain.setTargetAtTime(isHovering ? 0.07 : 0.04, now, 0.5);
  });
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

function creepyGrowl(duration = 1.1) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const base = 42 + Math.random() * 16;
  const growlGain = audioContext.createGain();
  const throat = audioContext.createBiquadFilter();
  const rasp = audioContext.createWaveShaper();
  const tremolo = audioContext.createOscillator();
  const tremoloDepth = audioContext.createGain();
  const lowVoice = audioContext.createOscillator();
  const rattleVoice = audioContext.createOscillator();
  const breathBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
  const breath = breathBuffer.getChannelData(0);

  for (let i = 0; i < breath.length; i++) {
    const t = i / audioContext.sampleRate;
    const pulse = 0.55 + Math.sin(t * 22 + Math.sin(t * 7) * 1.8) * 0.45;
    breath[i] = (Math.random() * 2 - 1) * pulse * (1 - i / breath.length);
  }

  const breathSource = audioContext.createBufferSource();
  breathSource.buffer = breathBuffer;
  const breathFilter = audioContext.createBiquadFilter();
  breathFilter.type = "lowpass";
  breathFilter.frequency.setValueAtTime(360, now);
  breathFilter.frequency.exponentialRampToValueAtTime(130, now + duration);

  const curve = new Float32Array(256);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 3.8);
  }
  rasp.curve = curve;
  rasp.oversample = "2x";

  throat.type = "bandpass";
  throat.frequency.setValueAtTime(115, now);
  throat.frequency.exponentialRampToValueAtTime(72, now + duration);
  throat.Q.value = 5.8;
  growlGain.gain.setValueAtTime(0.001, now);
  growlGain.gain.exponentialRampToValueAtTime(0.34, now + 0.08);
  growlGain.gain.setTargetAtTime(0.12, now + duration * 0.58, 0.22);
  growlGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  tremolo.frequency.value = 8 + Math.random() * 5;
  tremoloDepth.gain.value = 0.12;
  tremolo.connect(tremoloDepth);
  tremoloDepth.connect(growlGain.gain);

  lowVoice.type = "sawtooth";
  lowVoice.frequency.setValueAtTime(base, now);
  lowVoice.frequency.exponentialRampToValueAtTime(base * 0.58, now + duration);
  rattleVoice.type = "square";
  rattleVoice.frequency.setValueAtTime(base * 1.48, now);
  rattleVoice.frequency.exponentialRampToValueAtTime(base * 0.9, now + duration * 0.9);

  lowVoice.connect(rasp);
  rattleVoice.connect(rasp);
  breathSource.connect(breathFilter);
  breathFilter.connect(rasp);
  rasp.connect(throat);
  throat.connect(growlGain);
  growlGain.connect(masterGain);

  lowVoice.start(now);
  rattleVoice.start(now + 0.03);
  breathSource.start(now);
  tremolo.start(now);
  lowVoice.stop(now + duration);
  rattleVoice.stop(now + duration);
  breathSource.stop(now + duration);
  tremolo.stop(now + duration);
}

function hurtVoice() {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const isGirl = player.character === "girl";
  const duration = isGirl ? 0.42 : 0.48;
  const startPitch = isGirl ? 430 + Math.random() * 80 : 230 + Math.random() * 42;
  const endPitch = isGirl ? 210 + Math.random() * 28 : 118 + Math.random() * 22;
  const voice = audioContext.createOscillator();
  const secondVoice = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const breath = audioContext.createBufferSource();
  const breathGain = audioContext.createGain();
  const breathFilter = audioContext.createBiquadFilter();
  const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade;
  }

  voice.type = isGirl ? "triangle" : "sawtooth";
  secondVoice.type = "triangle";
  voice.frequency.setValueAtTime(startPitch, now);
  secondVoice.frequency.setValueAtTime(startPitch * 0.51, now);
  voice.frequency.exponentialRampToValueAtTime(endPitch, now + duration);
  secondVoice.frequency.exponentialRampToValueAtTime(endPitch * 0.58, now + duration);
  filter.type = "bandpass";
  filter.frequency.value = isGirl ? 760 : 390;
  filter.Q.value = isGirl ? 3.4 : 2.6;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(isGirl ? 0.26 : 0.3, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  breath.buffer = buffer;
  breathFilter.type = "highpass";
  breathFilter.frequency.value = isGirl ? 760 : 430;
  breathGain.gain.setValueAtTime(0.08, now);
  breathGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  voice.connect(filter);
  secondVoice.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  breath.connect(breathFilter);
  breathFilter.connect(breathGain);
  breathGain.connect(masterGain);

  voice.start(now);
  secondVoice.start(now + 0.015);
  breath.start(now + 0.02);
  voice.stop(now + duration);
  secondVoice.stop(now + duration);
  breath.stop(now + duration);
}

const sfx = {
  shoot() {
    if (fxToggle && !fxToggle.checked) return;
    noiseBurst(0.16, 0.5, 1900);
    tone("square", 94, 0.1, 0.22, -42);
  },
  zombie() {
    if (fxToggle && !fxToggle.checked) return;
    creepyGrowl(0.95 + Math.random() * 0.45);
    setTimeout(() => tone("sawtooth", 36 + Math.random() * 12, 0.58, 0.1, -12), 120);
  },
  hit() {
    if (fxToggle && !fxToggle.checked) return;
    noiseBurst(0.15, 0.32, 720);
    tone("triangle", 180, 0.12, 0.14, -60);
  },
  hurt() {
    if (fxToggle && !fxToggle.checked) return;
    hurtVoice();
    noiseBurst(0.18, 0.16, 520);
  },
  pickup() {
    if (fxToggle && !fxToggle.checked) return;
    tone("sine", 420, 0.1, 0.16, 150);
    tone("sine", 720, 0.11, 0.12, 40);
  },
  empty() {
    if (fxToggle && !fxToggle.checked) return;
    tone("square", 120, 0.08, 0.12, -40);
  },
  win() {
    if (fxToggle && !fxToggle.checked) return;
    tone("sine", 330, 0.2, 0.18, 110);
    setTimeout(() => tone("sine", 550, 0.24, 0.18, 160), 140);
  },
  // Horror style UI feedback sounds
  uiHover() {
    if (fxToggle && !fxToggle.checked) return;
    tone("triangle", 110, 0.06, 0.12, -20);
  },
  uiClick() {
    if (fxToggle && !fxToggle.checked) return;
    tone("sine", 160, 0.14, 0.2, -40);
    setTimeout(() => tone("square", 80, 0.08, 0.1, -30), 40);
  }
};

function startGame(fresh) {
  ensureAudio();
  if (fresh || !gameStarted) resetGame();
  gameStarted = true;
  state = "playing";
  menu.classList.add("hidden");
  touchControls.classList.remove("hidden");
  if (matchMedia("(pointer: fine)").matches) {
    try {
      const pointerLockRequest = canvas.requestPointerLock?.();
      pointerLockRequest?.catch?.(() => {});
    } catch {
      // Pointer lock is optional; touch and drag look controls still work.
    }
  }
}

function showMenu() {
  state = "menu";
  menu.classList.remove("hidden");
  touchControls.classList.add("hidden");
  
  // Ensure the main navigation menu buttons are displayed, while select survivor/settings are hidden
  if (characterSelectContainer) characterSelectContainer.classList.add("hidden");
  if (settingsPanel) settingsPanel.classList.add("hidden");
  if (mainMenuActions) mainMenuActions.classList.remove("hidden");
  
  resetMoveControl();
  try {
    document.exitPointerLock?.();
  } catch {
    // Some mobile browsers expose the API but reject calls outside user gestures.
  }
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
  const forward = clamp(
    Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown")) + virtualForward,
    -1,
    1,
  );
  const strafe = clamp(Number(keys.has("KeyD")) - Number(keys.has("KeyA")) + virtualStrafe, -1, 1);
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
    const skyWidth = Math.max(W, (images.skybox.width / images.skybox.height) * HALF_H);
    const offset = ((player.angle / (Math.PI * 2)) * skyWidth) % skyWidth;
    ctx.drawImage(images.skybox, -offset, 0, skyWidth, HALF_H);
    ctx.drawImage(images.skybox, skyWidth - offset, 0, skyWidth, HALF_H);
    if (skyWidth < W * 2) ctx.drawImage(images.skybox, skyWidth * 2 - offset, 0, skyWidth, HALF_H);
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

function spriteHasClearDepth(x, width, dist) {
  const left = Math.max(0, Math.floor(x));
  const right = Math.min(W - 1, Math.floor(x + width));
  if (right <= 0 || left >= W) return false;
  const samples = [
    left,
    Math.floor(left + (right - left) * 0.25),
    Math.floor(left + (right - left) * 0.5),
    Math.floor(left + (right - left) * 0.75),
    right,
  ];
  return samples.some((sampleX) => {
    // Map the screen column directly to ray index
    const col = clamp(sampleX, 0, W - 1);
    const rayIndex = clamp(Math.floor((col / W) * NUM_RAYS), 0, zBuffer.length - 1);
    return dist <= zBuffer[rayIndex] + SPRITE_OCCLUSION_PAD;
  });
}

function projectSprite(entity, image, size = 0.85, tint = null) {
  const dx = entity.x - player.x;
  const dy = entity.y - player.y;
  const theta = Math.atan2(dy, dx);
  const delta = angleDelta(theta, player.angle);
  const dist = Math.hypot(dx, dy);
  
  // Make sure we still render zombies even if they are extremely close (attacking the player)
  if (Math.abs(delta) > FOV * 1.1 || dist < 0.05) return;
  
  const screenX = HALF_W + Math.tan(delta) * SCREEN_DIST;
  const projected = Math.max(6, (SCREEN_DIST / dist) * size);
  const height = projected * (entity.health <= 0 ? Math.max(0.18, 1 - entity.deadTime) : 1);
  const width = projected;
  const x = screenX - width / 2;
  const y = HALF_H - height / 2 + projected * 0.22 + player.bob;
  
  // Bypass z-buffer check for extremely close sprites to avoid clipping into wall boundaries
  if (dist > 0.45 && !spriteHasClearDepth(x, width, dist)) return;

  if (image?.complete && image.naturalWidth > 0) {
    try {
      ctx.drawImage(image, x, y, width, height);
    } catch {
      ctx.fillStyle = tint || "#354d38";
      ctx.fillRect(x, y, width, height);
    }
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
  const weaponScale = clamp(Math.min(W / 800, H / 600), 0.72, 1.08);
  const weaponSize = 290 * weaponScale;
  const weaponY = H - 230 * weaponScale + recoil + player.bob;
  if (images.weapon) {
    ctx.drawImage(images.weapon, HALF_W - weaponSize / 2, weaponY, weaponSize, weaponSize);
  } else {
    ctx.fillStyle = "#363638";
    ctx.fillRect(HALF_W - 52 * weaponScale, H - 135 * weaponScale + recoil, 104 * weaponScale, 135 * weaponScale);
  }
  if (muzzleFlash > 0) {
    ctx.save();
    ctx.translate(HALF_W, H - 222 * weaponScale + player.bob);
    const pulse = muzzleFlash / 0.16;
    ctx.fillStyle = `rgba(255, 220, 82, ${pulse})`;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = (i % 2 ? 26 : 86) * pulse * weaponScale;
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
  const hudFont = clamp(W * 0.028, 15, 22);
  const pad = clamp(W * 0.022, 12, 18);
  const mapW = clamp(W * 0.18, 96, 132);
  const mapH = mapW * (96 / 132);
  ctx.font = `${hudFont}px Arial`;
  ctx.fillStyle = "#f44343";
  ctx.fillText(`Health: ${Math.ceil(player.health)}`, pad, H - pad);
  ctx.fillStyle = "#6aa7ff";
  ctx.textAlign = "right";
  ctx.fillText(`Ammo: ${player.ammo}`, W - pad, H - pad);
  ctx.textAlign = "left";
  ctx.fillStyle = "#62df72";
  ctx.fillText(`Zombies: ${zombies.filter((z) => z.alive && z.health > 0).length}`, pad, pad + hudFont);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fillRect(W - mapW - pad, pad, mapW, mapH);
  const sx = mapW / level[0].length;
  const sy = mapH / level.length;
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      if (level[y][x]) {
        ctx.fillStyle = level[y][x] === 3 ? "#4ccd73" : "#6d6d72";
        ctx.fillRect(W - mapW - pad + x * sx, pad + y * sy, sx, sy);
      }
    }
  }
  ctx.fillStyle = "#54eb67";
  ctx.beginPath();
  ctx.arc(W - mapW - pad + player.x * sx, pad + player.y * sy, clamp(mapW * 0.024, 2, 3), 0, Math.PI * 2);
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
    ctx.font = `bold ${clamp(W * 0.08, 34, 62)}px Arial`;
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

// Redesigned Title Screen Particles & Effects System
let menuParticles = [];
let logoBloodDrips = [];
let menuTime = 0;

function initMenuEffects() {
  menuParticles = [];
  // Initialize floating dust and fog particles
  for (let i = 0; i < 60; i++) {
    menuParticles.push({
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5,
      size: 1 + Math.random() * 3,
      alpha: 0.1 + Math.random() * 0.5,
      type: Math.random() > 0.4 ? "dust" : "fog",
      scale: 10 + Math.random() * 30
    });
  }

  // Logo blood drips initialization
  logoBloodDrips = [];
  for (let i = 0; i < 15; i++) {
    logoBloodDrips.push({
      x: 120 + i * 40,
      y: 60 + Math.random() * 15,
      length: 5 + Math.random() * 25,
      speed: 0.05 + Math.random() * 0.15,
      dripState: Math.random() * Math.PI
    });
  }
}

function updateAndDrawMenuEffects(dt) {
  if (!menuEffectsCanvas || !menuEffectsCtx) return;
  
  const w = menuEffectsCanvas.width = menuEffectsCanvas.clientWidth || 800;
  const h = menuEffectsCanvas.height = menuEffectsCanvas.clientHeight || 600;
  
  menuTime += dt;
  menuEffectsCtx.clearRect(0, 0, w, h);

  // 1. Draw Abandoned Hospital corridor silhouette (horror mood styling)
  const grad = menuEffectsCtx.createLinearGradient(w / 2, 0, w / 2, h);
  grad.addColorStop(0, "#050202");
  grad.addColorStop(0.5, "#0c0505");
  grad.addColorStop(1, "#020101");
  menuEffectsCtx.fillStyle = grad;
  menuEffectsCtx.fillRect(0, 0, w, h);

  // Horror lighting flicker: occasional dimming / red alert flash
  let flickerIntensity = 0.15;
  const cycle = (menuTime * 2) % 10;
  if (cycle > 8.8 || cycle < 0.2 || (cycle > 4.0 && cycle < 4.15)) {
    // Flicker moment
    flickerIntensity = Math.random() > 0.5 ? 0.35 : 0.05;
  }
  
  // Ambient Red glow from emergency siren
  const redGlow = menuEffectsCtx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.8);
  redGlow.addColorStop(0, `rgba(180, 15, 20, ${flickerIntensity})`);
  redGlow.addColorStop(1, "rgba(0, 0, 0, 0.9)");
  menuEffectsCtx.fillStyle = redGlow;
  menuEffectsCtx.fillRect(0, 0, w, h);

  // 2. Draw Distant Zombie Silhouettes
  menuEffectsCtx.fillStyle = "rgba(10, 5, 5, 0.72)";
  // Left zombie silhouette
  const zLeftX = w * 0.2 + Math.sin(menuTime * 0.5) * 8;
  menuEffectsCtx.beginPath();
  menuEffectsCtx.moveTo(zLeftX, h - 80);
  menuEffectsCtx.quadraticCurveTo(zLeftX + 15, h - 180, zLeftX + 8, h - 220); // body
  menuEffectsCtx.arc(zLeftX + 8, h - 235, 12, 0, Math.PI * 2); // head
  menuEffectsCtx.lineTo(zLeftX + 2, h - 80);
  menuEffectsCtx.fill();

  // Right zombie silhouette
  const zRightX = w * 0.75 + Math.cos(menuTime * 0.4) * 6;
  menuEffectsCtx.beginPath();
  menuEffectsCtx.moveTo(zRightX, h - 60);
  menuEffectsCtx.quadraticCurveTo(zRightX - 10, h - 140, zRightX - 5, h - 190); // body
  menuEffectsCtx.arc(zRightX - 5, h - 202, 10, 0, Math.PI * 2); // head
  menuEffectsCtx.lineTo(zRightX - 2, h - 60);
  menuEffectsCtx.fill();

  // 3. Draw and Update Particles (Dust & Fog)
  menuParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    // Wrap around borders
    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    if (p.type === "dust") {
      menuEffectsCtx.fillStyle = `rgba(255, 255, 255, ${p.alpha * (0.3 + Math.sin(menuTime + p.x) * 0.2)})`;
      menuEffectsCtx.beginPath();
      menuEffectsCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      menuEffectsCtx.fill();
    } else {
      // Fog particles
      const fogGrad = menuEffectsCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.scale);
      fogGrad.addColorStop(0, `rgba(100, 30, 30, ${p.alpha * 0.15})`);
      fogGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      menuEffectsCtx.fillStyle = fogGrad;
      menuEffectsCtx.beginPath();
      menuEffectsCtx.arc(p.x, p.y, p.scale, 0, Math.PI * 2);
      menuEffectsCtx.fill();
    }
  });

  // 4. Logo blood drips animation & rendering on canvas
  logoBloodDrips.forEach((d) => {
    d.dripState += d.speed;
    const currentLen = d.length + Math.sin(d.dripState) * 6;
    
    // Scale X positioning dynamically with canvas width
    const logoX = w / 2 - 200 + (d.x / 400) * 300;
    const logoY = h * 0.18 + Math.max(10, (w / 1000) * 20);

    menuEffectsCtx.fillStyle = "rgba(160, 10, 15, 0.85)";
    menuEffectsCtx.beginPath();
    menuEffectsCtx.moveTo(logoX, logoY);
    menuEffectsCtx.lineTo(logoX + 3, logoY + currentLen);
    menuEffectsCtx.arc(logoX + 1.5, logoY + currentLen, 2.5, 0, Math.PI * 2);
    menuEffectsCtx.fill();
  });
}

function loop(time) {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  if (!gameStarted) {
    updateAndDrawMenuEffects(dt);
  } else {
    update(dt, time);
    render(dt);
  }
  requestAnimationFrame(loop);
}

function rotateView(deltaX, pointerType = "mouse") {
  const sensitivity = pointerType === "touch" ? TOUCH_LOOK_SENSITIVITY : MOUSE_DRAG_SENSITIVITY;
  player.angle = normalizeAngle(player.angle + clamp(deltaX, -90, 90) * sensitivity);
}

function resetMoveControl() {
  moveTouch = null;
  virtualForward = 0;
  virtualStrafe = 0;
  moveKnob.style.transform = "translate(-50%, -50%)";
}

function updateMoveControl(clientX, clientY) {
  const rect = movePad.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = rect.width * 0.38;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / distance : 1;
  const knobX = dx * scale;
  const knobY = dy * scale;
  const deadZone = 0.12;
  virtualStrafe = Math.abs(knobX / radius) < deadZone ? 0 : knobX / radius;
  virtualForward = Math.abs(knobY / radius) < deadZone ? 0 : -knobY / radius;
  moveKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
}

function beginLookDrag(event) {
  if (state !== "playing") return;
  if (mouseLocked) {
    if (event.button === 0) fireWeapon();
    return;
  }
  if (event.button !== 0 && event.pointerType === "mouse") return;
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  lookDrag = {
    id: event.pointerId,
    lastX: event.clientX,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };
}

function updateLookDrag(event) {
  if (!lookDrag || lookDrag.id !== event.pointerId || state !== "playing") return;
  event.preventDefault();
  const dx = event.clientX - lookDrag.lastX;
  lookDrag.lastX = event.clientX;
  if (Math.hypot(event.clientX - lookDrag.startX, event.clientY - lookDrag.startY) > 6) {
    lookDrag.moved = true;
  }
  rotateView(dx, event.pointerType);
}

function endLookDrag(event) {
  if (!lookDrag || lookDrag.id !== event.pointerId) return;
  const wasTap = !lookDrag.moved;
  lookDrag = null;
  canvas.releasePointerCapture?.(event.pointerId);
  if (state === "playing" && wasTap) fireWeapon();
}

function beginMoveTouch(event) {
  if (state !== "playing") return;
  event.preventDefault();
  event.stopPropagation();
  movePad.setPointerCapture?.(event.pointerId);
  moveTouch = event.pointerId;
  updateMoveControl(event.clientX, event.clientY);
}

function updateMoveTouch(event) {
  if (moveTouch !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  updateMoveControl(event.clientX, event.clientY);
}

function endMoveTouch(event) {
  if (moveTouch !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  movePad.releasePointerCapture?.(event.pointerId);
  resetMoveControl();
}

function resetInputState() {
  keys.clear();
  lookDrag = null;
  resetMoveControl();
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Escape" && state === "playing") showMenu();
  if (event.code === "Enter" && state === "menu" && !characterSelectContainer.classList.contains("hidden")) {
    startGame(true);
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("resize", resizeCanvas, { passive: true });
window.visualViewport?.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener("orientationchange", () => setTimeout(resizeCanvas, 120), { passive: true });
window.addEventListener("blur", resetInputState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetInputState();
});
canvas.addEventListener("pointerdown", beginLookDrag);
canvas.addEventListener("pointermove", updateLookDrag);
canvas.addEventListener("pointerup", endLookDrag);
canvas.addEventListener("pointercancel", endLookDrag);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("pointerlockchange", () => {
  mouseLocked = document.pointerLockElement === canvas;
});
document.addEventListener("mousemove", (event) => {
  if (state === "playing" && mouseLocked) {
    player.angle = normalizeAngle(player.angle + event.movementX * POINTER_LOCK_SENSITIVITY);
  }
});
movePad.addEventListener("pointerdown", beginMoveTouch);
movePad.addEventListener("pointermove", updateMoveTouch);
movePad.addEventListener("pointerup", endMoveTouch);
movePad.addEventListener("pointercancel", endMoveTouch);
shootButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  fireWeapon();
});

// Character Selection Event Handling
for (const button of characterButtons) {
  button.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    setCharacter(button.dataset.character);
  });
}

// ----------------- REDESIGNED TITLE MENU INTERFACES -----------------

// Navigation hover sound triggers
const menuButtons = [...document.querySelectorAll(".menu-btn, .character-option")];
menuButtons.forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    ensureAudio();
    sfx.uiHover();
    setMenuAmbienceIntensity(true);
  });
  btn.addEventListener("mouseleave", () => {
    setMenuAmbienceIntensity(false);
  });
});

// PLAY Flow: transitions to Character Selection Screen
if (playBtn) {
  playBtn.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    mainMenuActions.classList.add("hidden");
    characterSelectContainer.classList.remove("hidden");
  });
}

// START GAME from Select Survivor Screen
if (confirmCharacterBtn) {
  confirmCharacterBtn.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    startGame(true);
  });
}

// BACK Button: Select Survivor -> Main Menu
if (backToMenuBtn) {
  backToMenuBtn.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    characterSelectContainer.classList.add("hidden");
    mainMenuActions.classList.remove("hidden");
  });
}

// SETTINGS Open
if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    mainMenuActions.classList.add("hidden");
    settingsPanel.classList.remove("hidden");
  });
}

// SETTINGS Close
if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    settingsPanel.classList.add("hidden");
    mainMenuActions.classList.remove("hidden");
  });
}

// EXIT button flow
if (exitBtn) {
  exitBtn.addEventListener("click", () => {
    ensureAudio();
    sfx.uiClick();
    if (confirm("Are you sure you want to exit?")) {
      window.close();
    }
  });
}

// Master volume slider behavior
if (masterVolumeRange) {
  masterVolumeRange.addEventListener("input", (e) => {
    ensureAudio();
    if (masterGain) {
      masterGain.gain.value = Number(e.target.value) / 100;
    }
  });
}

// Sound settings toggles
if (musicToggle) {
  musicToggle.addEventListener("change", (e) => {
    ensureAudio();
    if (music) {
      music.volume = e.target.checked ? 0.22 : 0.0;
    }
    // Procedural drone level adjusting
    if (droneOscs.length) {
      const droneVol = e.target.checked ? 0.04 : 0.0;
      droneOscs.forEach(drone => {
        drone.gain.gain.setValueAtTime(droneVol, audioContext.currentTime);
      });
    }
  });
}

setCharacter(player.character);
resizeCanvas();
initMenuEffects();

Promise.all([
  loadImage("wall", "wall.png"),
  loadImage("zombie", "zombie.png"),
  loadImage("weapon", "weapon.png"),
  loadImage("skybox", "skybox.png"),
]).then((loaded) => {
  for (const [name, image] of loaded) images[name] = image;
  requestAnimationFrame(loop);
});
