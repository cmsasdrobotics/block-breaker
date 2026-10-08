// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts
const BRICK_HITS = 1;    // how many hits a brick takes before it breaks
const BRICK_SPEED = 0.5;   // how fast bricks move downwards

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

// Draws every brick in the list.
function drawBricks() {
  ctx.fillStyle = "white";
  for (const brick of bricks) {
    if (brick.hits <= 0) {
      continue;
    }
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  }
}
