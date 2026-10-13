// components.js: data-only components
// A 'Movable' component holds only data: vx and vy (pixels per update).
function Movable(vx, vy) {
  return { vx: vx || 0, vy: vy || 0 };
}
