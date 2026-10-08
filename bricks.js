// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 6;   // how far down the first row starts
const BRICK_HITS = 1;    // how many hits a brick takes before it breaks
const BRICK_SPEED = 0.5;   // how fast bricks move downwards
const BRICK_RADIUS = 4;   // corner radius for rounded edges
const BRICK_COLOR = "#606060";  // gray
const BRICK_STROKE_COLOR = "#FFFFFF";  // white stroke
const BRICK_STROKE_WIDTH = 1;

// Wave patterns. ` = brick, . = empty space.
const WAVES = [
  [
    ".`....`.",
    "........",
    "........",
    "........"
  ],
  [
    "..````..",
    "........",
    "........",
    "........"
  ]
];

let currentWave = 0;

function startWave(index) {
  currentWave = index;
  bricks = makeBricks();
}

function nextWave() {
  if (currentWave < WAVES.length - 1) {
    startWave(currentWave + 1);
  } else {
    startWave(0);
  }
}

// Builds the list of bricks from the current wave pattern.
function makeBricks() {
  const list = [];
  const pattern = WAVES[currentWave];

  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < pattern.length; row++) {
    const rowPattern = pattern[row];
    for (let col = 0; col < rowPattern.length; col++) {
      if (rowPattern[col] === "`") {
        list.push({
          x: left + col * (BRICK_WIDTH + BRICK_GAP),
          y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          hits: BRICK_HITS,
          mutations: []
        });
      }
    }
  }

  return list;
}

// Move all bricks downwards.
function moveBricks() {
  for (const brick of bricks) {
    brick.y = brick.y + BRICK_SPEED;
  }
}

// Draw a single brick with rounded edges and stroke
function drawBrick(brick) {
  ctx.fillStyle = BRICK_COLOR;
  
  // Draw rounded rectangle
  ctx.beginPath();
  ctx.moveTo(brick.x + BRICK_RADIUS, brick.y);
  ctx.lineTo(brick.x + brick.width - BRICK_RADIUS, brick.y);
  ctx.quadraticCurveTo(brick.x + brick.width, brick.y, brick.x + brick.width, brick.y + BRICK_RADIUS);
  ctx.lineTo(brick.x + brick.width, brick.y + brick.height - BRICK_RADIUS);
  ctx.quadraticCurveTo(brick.x + brick.width, brick.y + brick.height, brick.x + brick.width - BRICK_RADIUS, brick.y + brick.height);
  ctx.lineTo(brick.x + BRICK_RADIUS, brick.y + brick.height);
  ctx.quadraticCurveTo(brick.x, brick.y + brick.height, brick.x, brick.y + brick.height - BRICK_RADIUS);
  ctx.lineTo(brick.x, brick.y + BRICK_RADIUS);
  ctx.quadraticCurveTo(brick.x, brick.y, brick.x + BRICK_RADIUS, brick.y);
  ctx.fill();
  
  // Add stroke
  ctx.strokeStyle = BRICK_STROKE_COLOR;
  ctx.lineWidth = BRICK_STROKE_WIDTH;
  ctx.stroke();
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    if (brick.hits <= 0) {
      continue;
    }
    drawBrick(brick);
  }
}
