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

const ball = {
  x: 0,
  y: 0,
  width: 12,
  height: 12,
  vx: 0,
  vy: 0
};

// Put the ball in the center and reset its speed and direction.
function resetBall() {
  ball.x = WIDTH / 2 - ball.width / 2;
  ball.y = HEIGHT / 2 - ball.height / 2;
  ball.vx = BALL_SPEED;  // right
  ball.vy = BALL_SPEED;  // down
}


// ============================================================
// DRAW BALL WITH STROKE
// ============================================================
function drawBall() {
  ctx.fillStyle = BALL_COLOR;
  ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  
  ctx.strokeStyle = BALL_STROKE_COLOR;
  ctx.lineWidth = BALL_STROKE_WIDTH;
  ctx.strokeRect(ball.x, ball.y, ball.width, ball.height);
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


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
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
  movePaddle();
  moveBall();
  moveBricks();

  bounceOffWalls();   // collisions.js
  bounceOffPaddle();  // collisions.js
  bounceOffBricks();  // collisions.js

  // All bricks destroyed, advance to next wave.
  if (bricks.length === 0) {
    nextWave();
  }

  // The ball fell off the bottom: back to the center.
  if (ball.y > HEIGHT) {
    resetBall();
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

function moveBall() {
  ball.x = ball.x + ball.vx;
  ball.y = ball.y + ball.vy;
}


// ============================================================
// DRAW: paints everything on the canvas.
// ============================================================
function draw() {
  drawBackground();

  drawPaddle();
  drawBall();

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
  resetBall();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
