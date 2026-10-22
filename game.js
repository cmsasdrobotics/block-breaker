// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

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
const PADDLE_COLOR = "#00D9FF";  // cyan
const PADDLE_RADIUS = 6;
const BALL_COLOR = "#FFFFFF";   // white
const BALL_STROKE_COLOR = "#00D9FF";  // cyan stroke
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
const TURRET_SWEEP = 0.75;

const balls = [];
let gameTick = 0;

const turret = {
  x: WIDTH / 2,
  y: HEIGHT - 10,
  angle: -Math.PI / 2,
  cooldown: 12
};

function launchBall() {
  const centerX = turret.x + Math.cos(turret.angle) * TURRET_BARREL_LENGTH;
  const centerY = turret.y + Math.sin(turret.angle) * TURRET_BARREL_LENGTH;

  balls.push({
    x: centerX - BALL_SIZE / 2,
    y: centerY - BALL_SIZE / 2,
    width: BALL_SIZE,
    height: BALL_SIZE,
    vx: Math.cos(turret.angle) * BALL_SPEED,
    vy: Math.sin(turret.angle) * BALL_SPEED
  });
}


// ============================================================
// DRAW BALL AS CIRCLE WITH STROKE
// ============================================================
function drawBall(ball) {
  const radius = ball.width / 2;
  const centerX = ball.x + radius;
  const centerY = ball.y + radius;
  
  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = BALL_STROKE_COLOR;
  ctx.lineWidth = BALL_STROKE_WIDTH;
  ctx.stroke();
}


// ============================================================
// DRAW PADDLE WITH ROUNDED EDGES
// ============================================================
function drawPaddle() {
  ctx.fillStyle = PADDLE_COLOR;
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
}

function drawTurret() {
  const barrelEndX = turret.x + Math.cos(turret.angle) * TURRET_BARREL_LENGTH;
  const barrelEndY = turret.y + Math.sin(turret.angle) * TURRET_BARREL_LENGTH;

  ctx.strokeStyle = PADDLE_COLOR;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(turret.x, turret.y);
  ctx.lineTo(barrelEndX, barrelEndY);
  ctx.stroke();

  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(turret.x, turret.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PADDLE_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = PADDLE_COLOR;
  ctx.fillRect(turret.x - 18, turret.y + 2, 36, 8);
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
  keys[event.key.toLowerCase()] = true;
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
  gameTick++;
  moveTurret();
  movePaddle();
  moveBalls();
  moveBricks();

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
  }

}

function moveTurret() {
  turret.angle = -Math.PI / 2 + Math.sin(gameTick * 0.035) * TURRET_SWEEP;
  turret.cooldown--;
  if (turret.cooldown <= 0) {
    launchBall();
    turret.cooldown = BALL_FIRE_INTERVAL;
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
  drawTurret();
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
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
