// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const titleScreen = document.getElementById("title-screen");
const playButton = document.getElementById("play-button");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450
const HUD_HEIGHT = 48;

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * pixelRatio);
  canvas.height = Math.round(window.innerHeight * pixelRatio);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const fullscreenButton = document.getElementById("fullscreen-button");
const shopButton = document.getElementById("shop-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const shopMenu = document.getElementById("shop-menu");
const pauseMenu = document.getElementById("pause-menu");
const shopBalance = document.getElementById("shop-balance");
const hudBalance = document.getElementById("hud-balance");
const hudWave = document.getElementById("hud-wave");
const turretOptions = Array.from(document.querySelectorAll(".turret-option"));
const turretUpgrades = document.getElementById("turret-upgrades");
const selectedTurretNumber = document.getElementById("selected-turret-number");
const turretPurchase = document.getElementById("turret-purchase");
const purchaseDescription = document.getElementById("purchase-description");
const buyTurretButton = document.getElementById("buy-turret-button");
const equippedClasses = document.getElementById("equipped-classes");
const ballClassList = document.getElementById("ball-class-list");
const ballClassDescription = document.getElementById("ball-class-description");
const ballClassPrice = document.getElementById("ball-class-price");
const upgradeClassButton = document.getElementById("upgrade-class-button");
const fusionClassButton = document.getElementById("fusion-class-button");
const fusionPicker = document.getElementById("fusion-picker");
const fusionDescription = document.getElementById("fusion-description");
const confirmFusionButton = document.getElementById("confirm-fusion-button");
const cancelFusionButton = document.getElementById("cancel-fusion-button");
const classActionStatus = document.getElementById("class-action-status");

fullscreenButton.addEventListener("click", async function () {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.querySelector("main").requestFullscreen();
  }
});

document.addEventListener("fullscreenchange", function () {
  fullscreenButton.textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
});


// ============================================================
// COLORS AND STYLING
// ============================================================
const PADDLE_COLOR = "#FFFFFF";  // white
const OBJECT_OUTLINE_COLOR = "#000000";
const PADDLE_RADIUS = 6;
const BALL_STROKE_COLOR = OBJECT_OUTLINE_COLOR;
const BALL_STROKE_WIDTH = 2;


// ============================================================
// BACKGROUND
// ============================================================
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#0a1428");      // dark navy at top
  gradient.addColorStop(0.5, "#1a2a4a");    // medium blue in middle
  gradient.addColorStop(1, "#0d1f3c");      // darker blue at bottom
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 4;
const BALL_SIZE = 12;
const BALL_FIRE_INTERVAL = 30;
const TURRET_BARREL_LENGTH = 30;
const TURRET_SWEEP_RANGE = 37.5;
const TURRET_EDGE_INSET = 20;
const TURRET_SPACING = (WIDTH - TURRET_EDGE_INSET * 2) / 4;

const balls = [];
let gameTick = 0;

const turrets = [
  { x: TURRET_EDGE_INSET, y: HEIGHT - 10, sweepCenterDegrees: 45, sweepRangeDegrees: TURRET_SWEEP_RANGE, angle: -Math.PI / 2, cooldown: 12, owned: true, ballClassIds: ["default"], ballMultiplier: 1 },
  { x: TURRET_EDGE_INSET + TURRET_SPACING, y: HEIGHT - 10, sweepCenterDegrees: 22.5, sweepRangeDegrees: TURRET_SWEEP_RANGE, angle: -Math.PI / 2, cooldown: 12, owned: false, ballClassIds: ["default"], ballMultiplier: 1 },
  { x: WIDTH / 2, y: HEIGHT - 10, sweepCenterDegrees: 0, sweepRangeDegrees: TURRET_SWEEP_RANGE, angle: -Math.PI / 2, cooldown: 12, owned: false, ballClassIds: ["default"], ballMultiplier: 1 },
  { x: TURRET_EDGE_INSET + TURRET_SPACING * 3, y: HEIGHT - 10, sweepCenterDegrees: -22.5, sweepRangeDegrees: TURRET_SWEEP_RANGE, angle: -Math.PI / 2, cooldown: 12, owned: false, ballClassIds: ["default"], ballMultiplier: 1 },
  { x: WIDTH - TURRET_EDGE_INSET, y: HEIGHT - 10, sweepCenterDegrees: -45, sweepRangeDegrees: TURRET_SWEEP_RANGE, angle: -Math.PI / 2, cooldown: 12, owned: false, ballClassIds: ["default"], ballMultiplier: 1 }
];
const TURRET_PRICES = [0, 100, 300, 1000, 2000];
const BALL_CLASSES = [
  { id: "default", name: "Default", description: "Regular balls without mutations.", price: 0, multiplier: 1, color: "#FFFFFF" },
  { id: "speedy", name: "Speedy", description: "Fast balls that are harder to control.", price: 100, multiplier: 1.25, color: "#FF0000" },
  { id: "grower", name: "Grower", description: "Grows to have a higher chance of hitting bricks.", price: 250, multiplier: 1.3, color: "#00FF00" },
  { id: "drilly", name: "Drilly", description: "Shoots drills that pierce through bricks.", price: 500, multiplier: 1.5, color: "#779900" },
  { id: "laser", name: "Laser", description: "Beams a laser that is deadly to bricks.", price: 750, multiplier: 1.2, color: "#0088FF" },
  { id: "gravitron", name: "Gravitron", description: "Gets pulled into bricks to chip through.", price: 1000, multiplier: 1.6, color: "#FFFF00" },
  { id: "rapidfire", name: "Rapidfire", description: "Turrets shoot at a higher frequency.", price: 1250, multiplier: 1.25, color: "#FFFF88" },
  { id: "sticky", name: "Sticky", description: "Sticks onto blocks to deal extra hits.", price: 1500, multiplier: 1.1, color: "#00FFFF" },
  { id: "multishot", name: "Multishot", description: "Shoots multiple balls at once.", price: 1750, multiplier: 1.85, color: "#008800" },
  { id: "slammy", name: "Slammy", description: "Deals extra damage to high-HP bricks.", price: 2000, multiplier: 1.4, color: "#CC8822" },
  { id: "poison", name: "Poison", description: "Can spread to nearby bricks when hit.", price: 2500, multiplier: 1.85, color: "#8800FF" },
  { id: "splodey", name: "Splodey", description: "Throws bombs for crowd control.", price: 3000, multiplier: 1.45, color: "#FF8800" },
  { id: "orbital", name: "Orbital", description: "Contains orbiting balls that cause chaos.", price: 3500, multiplier: 1.35, color: "#228899" },
  { id: "duplicator", name: "Duplicator", description: "Can duplicate and scale exponentially.", price: 4000, multiplier: 1.75, color: "#FF00FF" }
];
const BALL_CLASS_BY_ID = Object.fromEntries(BALL_CLASSES.map((ballClass) => [ballClass.id, ballClass]));
let money = 0;
let gameStarted = false;
let selectedTurretIndex = 0;
let selectedBallClassId = "default";
let selectedFusionClassId = null;
let isChoosingFusion = false;
let isShopOpen = false;
let isPaused = false;
let audioContext = null;
let lastSoundAt = { wall: 0, brick: 0, paddle: 0 };
const particles = [];
let paddleImpact = 0;

function startAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playGameSound(type) {
  if (!audioContext || audioContext.state !== "running") {
    return;
  }

  const now = audioContext.currentTime;
  const minimumGap = type === "paddle" ? 0.045 : 0.035;
  if (now - lastSoundAt[type] < minimumGap) {
    return;
  }
  lastSoundAt[type] = now;

  const settings = {
    paddle: { frequency: 520, duration: 0.09, volume: 0.11, wave: "sine" },
    brick: { frequency: 310, duration: 0.055, volume: 0.018, wave: "triangle" },
    wall: { frequency: 210, duration: 0.045, volume: 0.012, wave: "sine" }
  }[type];
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = settings.wave;
  oscillator.frequency.setValueAtTime(settings.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(settings.frequency * 0.72, now + settings.duration);
  gain.gain.setValueAtTime(settings.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + settings.duration);
}

function createPaddleParticles(x, y) {
  paddleImpact = 1;
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI + Math.random() * Math.PI;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 18 + Math.random() * 12,
      maxLife: 30,
      size: 2 + Math.random() * 3
    });
  }
}

function renderShop() {
  shopBalance.textContent = `Cash: $${money}`;
  hudBalance.textContent = `Cash: $${money}`;
  hudWave.textContent = `Wave ${currentWave + 1}`;

  for (const option of turretOptions) {
    const index = Number(option.dataset.turret);
    const turret = turrets[index];
    option.setAttribute("aria-pressed", String(index === selectedTurretIndex));
    option.querySelector(".turret-status").textContent = turret.owned ? "Owned" : `$${TURRET_PRICES[index]}`;
  }

  const selectedTurret = turrets[selectedTurretIndex];
  turretUpgrades.hidden = !selectedTurret.owned;
  turretPurchase.hidden = selectedTurret.owned;
  selectedTurretNumber.textContent = String(selectedTurretIndex + 1);
  renderTurretUpgrades(selectedTurret);

  if (!selectedTurret.owned) {
    purchaseDescription.textContent = `Turret ${selectedTurretIndex + 1} costs $${TURRET_PRICES[selectedTurretIndex]}.`;
    buyTurretButton.disabled = money < TURRET_PRICES[selectedTurretIndex];
  }
}

function renderTurretUpgrades(turret) {
  if (!turret.owned) {
    return;
  }

  const selectedClass = isChoosingFusion && selectedFusionClassId
    ? BALL_CLASS_BY_ID[selectedFusionClassId]
    : BALL_CLASS_BY_ID[selectedBallClassId];
  const firstClass = BALL_CLASS_BY_ID[turret.ballClassIds[0]];
  const equippedClassNames = turret.ballClassIds.map((id) => BALL_CLASS_BY_ID[id].name);
  equippedClasses.textContent = `Equipped: ${equippedClassNames.join(" + ")} (x${turret.ballMultiplier.toFixed(2)})`;
  ballClassDescription.textContent = selectedClass.description;
  ballClassPrice.textContent = `Price: $${selectedClass.price} · Multiplier: x${selectedClass.multiplier}`;

  for (const option of ballClassList.querySelectorAll(".ball-class-option")) {
    const optionClassId = option.dataset.classId;
    const isSelected = isChoosingFusion ? optionClassId === selectedFusionClassId : optionClassId === selectedBallClassId;
    option.setAttribute("aria-pressed", String(isSelected));
    option.disabled = isChoosingFusion
      && (optionClassId === "default" || turret.ballClassIds.includes(optionClassId));
  }

  const upgradePrice = Math.ceil(selectedClass.price * turret.ballMultiplier);
  upgradeClassButton.textContent = `Upgrade · $${upgradePrice}`;
  upgradeClassButton.disabled = isChoosingFusion || money < upgradePrice;
  fusionClassButton.disabled = isChoosingFusion || selectedBallClassId !== firstClass.id
    || BALL_CLASSES.every((ballClass) => ballClass.id === "default" || turret.ballClassIds.includes(ballClass.id));
  fusionPicker.hidden = !isChoosingFusion;

  if (isChoosingFusion) {
    const secondClass = selectedFusionClassId ? BALL_CLASS_BY_ID[selectedFusionClassId] : null;
    const fusionPrice = getFusionPrice(firstClass, secondClass, turret);
    fusionDescription.textContent = secondClass
      ? `Add ${secondClass.name} to the fusion for $${fusionPrice}. Colors are split evenly in purchase order. Combined multiplier: x${(turret.ballMultiplier * secondClass.multiplier).toFixed(2)}.`
      : `Choose a second class to fuse with ${firstClass.name}.`;
    confirmFusionButton.disabled = !secondClass || turret.ballClassIds.includes(selectedFusionClassId) || money < fusionPrice;
    confirmFusionButton.textContent = secondClass ? `Fuse · $${fusionPrice}` : "Fuse classes";
  }
}

function getFusionPrice(firstClass, secondClass, turret) {
  if (!secondClass) {
    return 0;
  }
  if (secondClass.id === "slammy") {
    return Math.ceil(10000 * turret.ballMultiplier);
  }

  const fusionMultiplier = firstClass.id === "slammy" ? 5 : 3;
  return Math.ceil(secondClass.price * fusionMultiplier * turret.ballMultiplier);
}

function createBallClassOptions() {
  for (const ballClass of BALL_CLASSES) {
    const option = document.createElement("button");
    option.className = "ball-class-option";
    option.type = "button";
    option.dataset.classId = ballClass.id;
    option.setAttribute("aria-pressed", "false");

    const name = document.createElement("span");
    name.textContent = ballClass.name;
    const price = document.createElement("span");
    price.textContent = ballClass.price === 0 ? "FREE" : `$${ballClass.price}`;
    option.append(name, price);

    option.addEventListener("click", function () {
      if (isChoosingFusion) {
        if (ballClass.id !== "default" && !turrets[selectedTurretIndex].ballClassIds.includes(ballClass.id)) {
          selectedFusionClassId = ballClass.id;
        }
      } else {
        selectedBallClassId = ballClass.id;
      }
      classActionStatus.textContent = "";
      renderShop();
    });

    ballClassList.append(option);
  }
}

function selectTurret(index) {
  selectedTurretIndex = index;
  selectedBallClassId = turrets[index].ballClassIds[0];
  selectedFusionClassId = null;
  isChoosingFusion = false;
  classActionStatus.textContent = "";
  renderShop();
}

function buySelectedTurret() {
  const price = TURRET_PRICES[selectedTurretIndex];
  const turret = turrets[selectedTurretIndex];

  if (turret.owned || money < price) {
    return;
  }

  money -= price;
  turret.owned = true;
  renderShop();
}

function upgradeSelectedTurretClass() {
  const turret = turrets[selectedTurretIndex];
  const ballClass = BALL_CLASS_BY_ID[selectedBallClassId];
  const price = Math.ceil(ballClass.price * turret.ballMultiplier);

  if (!turret.owned || money < price) {
    return;
  }

  money -= price;
  turret.ballClassIds = [ballClass.id];
  turret.ballMultiplier *= ballClass.multiplier;
  isChoosingFusion = false;
  selectedFusionClassId = null;
  classActionStatus.textContent = `${ballClass.name} equipped.`;
  renderShop();
}

function beginTurretFusion() {
  isChoosingFusion = true;
  selectedFusionClassId = null;
  classActionStatus.textContent = "Select another class to add to the fusion.";
  renderShop();
}

function fuseSelectedTurretClasses() {
  const turret = turrets[selectedTurretIndex];
  const firstClass = BALL_CLASS_BY_ID[selectedBallClassId];
  const secondClass = BALL_CLASS_BY_ID[selectedFusionClassId];
  const price = getFusionPrice(firstClass, secondClass, turret);

  if (!turret.owned || !isChoosingFusion || !secondClass || money < price) {
    return;
  }

  money -= price;
  turret.ballClassIds = [...turret.ballClassIds, secondClass.id];
  turret.ballMultiplier *= secondClass.multiplier;
  isChoosingFusion = false;
  classActionStatus.textContent = `${turret.ballClassIds.map((id) => BALL_CLASS_BY_ID[id].name).join(" + ")} fused.`;
  renderShop();
}

function openShop() {
  isShopOpen = true;
  isPaused = false;
  shopMenu.hidden = false;
  pauseMenu.hidden = true;
  renderShop();
}

function openPauseMenu() {
  isPaused = true;
  isShopOpen = false;
  pauseMenu.hidden = false;
  shopMenu.hidden = true;
}

function resumeGame() {
  isPaused = false;
  pauseMenu.hidden = true;
}

playButton.addEventListener("click", function () {
  gameStarted = true;
  titleScreen.hidden = true;
  startAudio();
});

shopButton.addEventListener("click", function () {
  if (isShopOpen) {
    isShopOpen = false;
    shopMenu.hidden = true;
  } else {
    openShop();
  }
});

pauseButton.addEventListener("click", openPauseMenu);
resumeButton.addEventListener("click", resumeGame);
buyTurretButton.addEventListener("click", buySelectedTurret);
upgradeClassButton.addEventListener("click", upgradeSelectedTurretClass);
fusionClassButton.addEventListener("click", beginTurretFusion);
confirmFusionButton.addEventListener("click", fuseSelectedTurretClasses);
cancelFusionButton.addEventListener("click", function () {
  isChoosingFusion = false;
  selectedFusionClassId = null;
  renderShop();
});

for (const option of turretOptions) {
  option.addEventListener("click", function () {
    selectTurret(Number(option.dataset.turret));
  });
}

function launchBall(turret) {
  const centerX = turret.x + Math.cos(turret.angle) * TURRET_BARREL_LENGTH;
  const centerY = turret.y + Math.sin(turret.angle) * TURRET_BARREL_LENGTH;

  balls.push({
    x: centerX - BALL_SIZE / 2,
    y: centerY - BALL_SIZE / 2,
    width: BALL_SIZE,
    height: BALL_SIZE,
    vx: Math.cos(turret.angle) * BALL_SPEED,
    vy: Math.sin(turret.angle) * BALL_SPEED,
    ballClassIds: [...turret.ballClassIds],
    colors: turret.ballClassIds.map((id) => BALL_CLASS_BY_ID[id].color),
    color: BALL_CLASS_BY_ID[turret.ballClassIds[0]].color,
    classMultiplier: turret.ballMultiplier
  });
}


// ============================================================
// DRAW BALL AS CIRCLE WITH STROKE
// ============================================================
function drawBall(ball) {
  const radius = ball.width / 2;
  const centerX = ball.x + radius;
  const centerY = ball.y + radius;
  
  const colors = ball.colors || [ball.color];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, -Math.PI / 2 + index * Math.PI * 2 / colors.length, -Math.PI / 2 + (index + 1) * Math.PI * 2 / colors.length);
    ctx.closePath();
    ctx.fill();
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = BALL_STROKE_COLOR;
  ctx.lineWidth = BALL_STROKE_WIDTH;
  ctx.stroke();
}


// ============================================================
// DRAW PADDLE WITH ROUNDED EDGES
// ============================================================
function drawPaddle() {
  ctx.fillStyle = paddleImpact > 0 ? "#8ce2ff" : PADDLE_COLOR;
  ctx.beginPath();
  ctx.moveTo(paddle.x + PADDLE_RADIUS, paddle.y);
  ctx.lineTo(paddle.x + paddle.width - PADDLE_RADIUS, paddle.y);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + PADDLE_RADIUS);
  ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - PADDLE_RADIUS);
  ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - PADDLE_RADIUS, paddle.y + paddle.height);
  ctx.lineTo(paddle.x + PADDLE_RADIUS, paddle.y + paddle.height);
  ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - PADDLE_RADIUS);
  ctx.lineTo(paddle.x, paddle.y + PADDLE_RADIUS);
  ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + PADDLE_RADIUS, paddle.y);
  ctx.fill();
  ctx.strokeStyle = OBJECT_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTurret(turret) {
  const turretColor = BALL_CLASS_BY_ID[turret.ballClassIds[0]].color;
  const barrelEndX = turret.x + Math.cos(turret.angle) * TURRET_BARREL_LENGTH;
  const barrelEndY = turret.y + Math.sin(turret.angle) * TURRET_BARREL_LENGTH;

  ctx.strokeStyle = OBJECT_OUTLINE_COLOR;
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(turret.x, turret.y);
  ctx.lineTo(barrelEndX, barrelEndY);
  ctx.stroke();
  ctx.strokeStyle = turretColor;
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.fillStyle = turretColor;
  ctx.beginPath();
  ctx.arc(turret.x, turret.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OBJECT_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = turretColor;
  ctx.fillRect(turret.x - 18, turret.y + 2, 36, 8);
  ctx.strokeStyle = OBJECT_OUTLINE_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(turret.x - 18, turret.y + 2, 36, 8);
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 58,
  width: 90,
  height: 12,
  speed: 6
};


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === "escape") {
    event.preventDefault();
    if (!event.repeat) {
      openPauseMenu();
    }
  } else if (key === "e" && !event.repeat) {
    if (isShopOpen) {
      isShopOpen = false;
      shopMenu.hidden = true;
    } else {
      openShop();
    }
  } else if (/^[1-5]$/.test(key) && !event.repeat) {
    selectTurret(Number(key) - 1);
  }

  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  if (!gameStarted || isPaused || isShopOpen) {
    return;
  }

  gameTick++;
  paddleImpact = Math.max(0, paddleImpact - 0.08);
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.035;
    particle.life--;
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
  moveTurrets();
  movePaddle();
  moveBalls();
  advanceWaveFive();
  for (const brick of bricks) {
    brick.move(brick);
    updateGhostBrick(brick);
  }

  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    bounceOffWalls(ball);   // collisions.js
    bounceOffPaddle(ball);  // collisions.js
    bounceOffBricks(ball);  // collisions.js

    if (ball.y > HEIGHT) {
      balls.splice(i, 1);
    }
  }

  // All bricks destroyed, advance to next wave.
  if (bricks.length === 0) {
    nextWave();
    renderShop();
  }

}

function moveTurrets() {
  for (const turret of turrets) {
    if (!turret.owned) {
      continue;
    }

    const angleDegrees = turret.sweepCenterDegrees + Math.sin(gameTick * 0.035) * turret.sweepRangeDegrees;
    turret.angle = (angleDegrees - 90) * Math.PI / 180;
    turret.cooldown--;
    if (turret.cooldown <= 0) {
      launchBall(turret);
      turret.cooldown = BALL_FIRE_INTERVAL;
    }
  }
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBalls() {
  for (const ball of balls) {
    ball.x = ball.x + ball.vx;
    ball.y = ball.y + ball.vy;
  }
}


// ============================================================
// DRAW: paints everything on the canvas.
// ============================================================
function draw() {
  const pixelRatio = window.devicePixelRatio || 1;
  const availableHeight = window.innerHeight - HUD_HEIGHT;
  const scale = Math.min(window.innerWidth / WIDTH, availableHeight / HEIGHT);
  const offsetX = (window.innerWidth - WIDTH * scale) / 2;
  const offsetY = HUD_HEIGHT + (availableHeight - HEIGHT * scale) / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    pixelRatio * scale,
    0,
    0,
    pixelRatio * scale,
    pixelRatio * offsetX,
    pixelRatio * offsetY
  );

  drawBackground();

  drawPaddle();
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = "#75dcff";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const turret of turrets) {
    if (turret.owned) {
      drawTurret(turret);
    }
  }
  for (const ball of balls) {
    drawBall(ball);
  }

  drawBricks();  // bricks.js
}


// ============================================================
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw.
// Some screens are faster than others, so we make sure update()
// always runs exactly 60 times per second on every computer.
// ============================================================
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  leftover = leftover + (now - lastTime);
  lastTime = now;

  // If the tab was hidden for a while, don't try to catch up.
  if (leftover > 250) {
    leftover = 250;
  }

  while (leftover >= STEP) {
    update();
    leftover = leftover - STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

function start() {
  startWave(0);
  createBallClassOptions();
  renderShop();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
