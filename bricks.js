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
const BRICK_SLIDE_SPEED = 1.5;
const BRICK_RADIUS = 4;   // corner radius for rounded edges
const BRICK_COLOR = "#FFFFFF";  // gray
const BRICK_STROKE_COLOR = "#000000";  // white stroke
const BRICK_STROKE_WIDTH = 1;
const BRICK_CLASSES = {
  "`": { name: "Standard", hits: BRICK_HITS, speed: BRICK_SPEED, color: BRICK_COLOR },
  "2": { name: "Reinforced I", hits: 2, speed: BRICK_SPEED, color: "#AAAAAA" },
  q: { name: "Quick I", hits: BRICK_HITS, speed: BRICK_SPEED * 2, color: "#DBFFFF" },
  g: { name: "Gold I", hits: BRICK_HITS, speed: BRICK_SPEED, color: "#FFFFEF", reward: 50 }
};

// Wave patterns. ` = standard, 2 = Reinforced I, q = Quick I, g = Gold I.
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
  ],
  [
    "..2..2..",
    "`..``..`",
    "........",
    "........"
  ],
  [
    "..qqqq..",
    "22....22",
    "........",
    "........"
  ],
  [
    "..g``g..",
    "........",
    "........",
    "........"
  ]
];

let currentWave = 0;
let waveFiveOffset = 0;
let waveFiveDirection = 1;

function startWave(index) {
  currentWave = index;
  waveFiveOffset = 0;
  waveFiveDirection = 1;
  bricks = makeBricks();
}

function nextWave() {
  if (currentWave < WAVES.length - 1) {
    startWave(currentWave + 1);
  } else {
    startWave(currentWave + 1);
  }
}

function stayStill(brick) {
  brick.y += brick.speed;
}

function slide(brick) {
  brick.y += brick.speed;
  brick.x = brick.startX + waveFiveOffset;
}

function advanceWaveFive() {
  if (currentWave !== 4) {
    return;
  }

  const movingBricks = bricks.filter((brick) => brick.move === slide);
  if (movingBricks.length === 0) {
    return;
  }

  const leftEdge = Math.min(...movingBricks.map((brick) => brick.startX));
  const rightEdge = Math.max(...movingBricks.map((brick) => brick.startX + brick.width));
  waveFiveOffset += BRICK_SLIDE_SPEED * waveFiveDirection;
  if (leftEdge + waveFiveOffset < 0) {
    waveFiveOffset = -leftEdge;
    waveFiveDirection = 1;
  } else if (rightEdge + waveFiveOffset > WIDTH) {
    waveFiveOffset = WIDTH - rightEdge;
    waveFiveDirection = -1;
  }
}

function generateEndlessWave(waveNumber) {
  const formations = [
    ["..####..", ".######.", "........", "........"],
    [".#....#.", "########", "..####..", "........"],
    ["...##...", "..####..", ".######.", "........"],
    ["##....##", ".######.", "..####..", "........"]
  ];
  const formation = formations[Math.floor(Math.random() * formations.length)];
  const goldChance = Math.min(0.08 + waveNumber * 0.015, 0.22);

  return formation.map((row) => {
    const result = Array.from(row);
    for (let col = 0; col < Math.ceil(row.length / 2); col++) {
      if (row[col] !== "#") {
        continue;
      }

      const roll = Math.random();
      const type = roll < goldChance ? "g" : roll < 0.23 ? "2" : roll < 0.36 ? "q" : "`";
      result[col] = type;
      result[row.length - 1 - col] = type;
    }
    return result.join("");
  });
}

// Builds the list of bricks from the current wave pattern.
function makeBricks() {
  const list = [];
  const pattern = currentWave < WAVES.length
    ? WAVES[currentWave]
    : generateEndlessWave(currentWave - WAVES.length + 1);

  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < pattern.length; row++) {
    const rowPattern = pattern[row];
    for (let col = 0; col < rowPattern.length; col++) {
      const brickClass = BRICK_CLASSES[rowPattern[col]];
      if (!brickClass) {
        continue;
      }

      const startX = left + col * (BRICK_WIDTH + BRICK_GAP);
      const isWaveFiveTopRow = currentWave === 4 && row === 0;
      list.push({
        x: startX,
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        brickClass: brickClass.name,
        hits: brickClass.hits,
        move: isWaveFiveTopRow ? slide : stayStill,
        speed: brickClass.speed,
        startX: startX,
        color: brickClass.color,
        reward: brickClass.reward || 10,
        mutations: []
      });
    }
  }

  return list;
}

// Draw a single brick with rounded edges and stroke
function drawBrick(brick) {
  ctx.fillStyle = brick.color;
  
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

  if (brick.hits > 1) {
    ctx.save();
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.strokeText(String(brick.hits), brick.x + brick.width / 2, brick.y + brick.height / 2);
    ctx.fillStyle = "#182033";
    ctx.fillText(String(brick.hits), brick.x + brick.width / 2, brick.y + brick.height / 2);
    ctx.restore();
  }
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
