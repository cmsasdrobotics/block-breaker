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
  "`": { name: "Standard", hits: 1, speed: BRICK_SPEED, color: BRICK_COLOR },
  "2": { name: "Reinforced I", hits: 2, speed: BRICK_SPEED, color: "#AAAAAA" },
  "3": { name: "Reinforced III", hits: 3, speed: BRICK_SPEED, color: "#999999" },
  "4": { name: "Reinforced IV", hits: 4, speed: BRICK_SPEED, color: "#888888" },
  "5": { name: "Reinforced V", hits: 5, speed: BRICK_SPEED, color: "#777777" },
  "6": { name: "Reinforced VI", hits: 6, speed: BRICK_SPEED, color: "#666666" },
  "7": { name: "Reinforced VII", hits: 7, speed: BRICK_SPEED, color: "#555555" },
  "8": { name: "Reinforced VIII", hits: 8, speed: BRICK_SPEED, color: "#444444" },
  "9": { name: "Reinforced IX", hits: 9, speed: BRICK_SPEED, color: "#333333" },
  "0": { name: "Reinforced X", hits: 10, speed: BRICK_SPEED, color: "#222222" },
  q: { name: "Quick I", hits: 1, speed: BRICK_SPEED * 2, color: "#DBFFFF" },
  w: { name: "Quick II", hits: 1, speed: BRICK_SPEED * 3, color: "#99DDFF" },
  e: { name: "Quick III", hits: 1, speed: BRICK_SPEED * 4, color: "#66BBFF" },
  r: { name: "Quick IV", hits: 1, speed: BRICK_SPEED * 5, color: "#3399FF" },
  t: { name: "Quick V", hits: 1, speed: BRICK_SPEED * 6, color: "#0066FF" },
  y: { name: "Quick VI", hits: 1, speed: BRICK_SPEED * 7, color: "#0033FF" },
  u: { name: "Quick VII", hits: 1, speed: BRICK_SPEED * 8, color: "#0000FF" },
  a: { name: "Ghost I", hits: 1, speed: BRICK_SPEED, color: "#FFFFFF", ghostLevel: 1 },
  b: { name: "Ghost II", hits: 1, speed: BRICK_SPEED, color: "#FFFFFF", ghostLevel: 2 },
  c: { name: "Ghost III", hits: 1, speed: BRICK_SPEED, color: "#FFFFFF", ghostLevel: 3 },
  g: { name: "Gold I", hits: 1, speed: BRICK_SPEED, color: "#FFFFEF", reward: 50 },
  f: { name: "Standard + Quick I", hits: 1, speed: BRICK_SPEED * 2, colors: ["#FFFFFF", "#DBFFFF"] },
  h: { name: "Reinforced I + Gold I", hits: 2, speed: BRICK_SPEED, colors: ["#AAAAAA", "#FFFFEF"], reward: 60 },
  j: { name: "Quick II + Ghost I", hits: 1, speed: BRICK_SPEED * 3, colors: ["#AADDFF", "#FFFFFF"], ghostLevel: 1 }
};

// Wave patterns use single-character brick class IDs; . = empty space.
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
    "..3..3..",
    "`..``..`",
    "........",
    "........"
  ],
  [
    "..wwww..",
    "22....22",
    "........",
    "........"
  ],
  [
    "..gfhg..",
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

function randomEndlessBrickType(waveNumber) {
  const roll = Math.random();
  if (roll < 0.08) return "g";
  if (roll < 0.17) return ["a", "b", "c"][Math.min(2, Math.floor(Math.random() * (1 + waveNumber / 4)))];
  if (roll < 0.29) return ["q", "w", "e", "r", "t", "y", "u"][Math.min(6, Math.floor(Math.random() * (1 + waveNumber / 2)))];
  if (roll < 0.37) return ["f", "h", "j"][Math.floor(Math.random() * 3)];
  if (roll < 0.57) return String(Math.min(10, 2 + Math.floor(Math.random() * Math.min(9, 1 + waveNumber / 2))) % 10);
  return "`";
}

function generateEndlessWave(waveNumber) {
  const rowCount = 3 + Math.floor(Math.random() * 3);
  const rows = [];

  for (let row = 0; row < rowCount; row++) {
    const pattern = Array(BRICK_COLUMNS).fill(".");
    const count = 3 + Math.floor(Math.random() * 4);
    const columns = Array.from({ length: BRICK_COLUMNS }, (_, index) => index)
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    for (const col of columns) {
      pattern[col] = randomEndlessBrickType(waveNumber);
    }
    rows.push(pattern.join(""));
  }

  return rows;
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
        color: brickClass.color || brickClass.colors[0],
        colors: brickClass.colors || [brickClass.color],
        reward: brickClass.reward || 10,
        ghostLevel: brickClass.ghostLevel || 0,
        ghostHidden: false,
        ghostTimer: 90 + Math.random() * 45,
        mutations: []
      });
    }
  }

  return list;
}

// Draw a single brick with rounded edges and stroke
function drawBrick(brick) {
  ctx.save();
  if (brick.ghostLevel) {
    ctx.globalAlpha = brick.ghostHidden ? 0.08 : 0.72;
  }

  const drawShape = function () {
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
    ctx.closePath();
  };

  const colors = brick.colors || [brick.color];
  drawShape();
  ctx.save();
  ctx.clip();
  const segmentWidth = brick.width / colors.length;
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(brick.x + index * segmentWidth, brick.y, segmentWidth + 1, brick.height);
  });
  ctx.restore();

  drawShape();
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
  ctx.restore();
}

function updateGhostBrick(brick) {
  if (!brick.ghostLevel) {
    return;
  }

  brick.ghostTimer--;
  if (brick.ghostTimer <= 0) {
    brick.ghostHidden = !brick.ghostHidden;
    brick.ghostTimer = brick.ghostHidden
      ? 24 + brick.ghostLevel * 12
      : 110 - brick.ghostLevel * 18;
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
