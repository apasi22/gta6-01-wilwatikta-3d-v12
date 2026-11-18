// Keyboard + mouse. The game reads axes and edge-triggered presses each frame;
// the main loop clears the edge set after every update.

const Input = {
  keys: {}, pressed: {}, orbitYaw: 0, orbitPitch: 0.32, zoom: 11,
  dragging: false, lastX: 0, lastY: 0, moved: 0, fired: false,

  init: function (canvas) {
    const self = this;
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      self.keys[e.code] = true; self.pressed[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.code) >= 0) e.preventDefault();
      AudioSys.unlock();
    });
    window.addEventListener('keyup', function (e) { self.keys[e.code] = false; });
    // Losing the window must not leave keys stuck down or a drag hanging.
    window.addEventListener('blur', function () { self.keys = {}; self.pressed = {}; self.dragging = false; });
    document.addEventListener('mouseleave', function () { self.dragging = false; });
    canvas.addEventListener('mousedown', function (e) {
      self.dragging = true; self.moved = 0; self.lastX = e.clientX; self.lastY = e.clientY;
      AudioSys.unlock();
    });
    window.addEventListener('mousemove', function (e) {
      if (!self.dragging) return;
      const dx = e.clientX - self.lastX, dy = e.clientY - self.lastY;
      self.moved += Math.abs(dx) + Math.abs(dy);
      self.orbitYaw -= dx * 0.006; self.orbitPitch = clamp(self.orbitPitch + dy * 0.004, 0.08, 1.1);
      self.lastX = e.clientX; self.lastY = e.clientY;
    });
    window.addEventListener('mouseup', function () {
      if (self.dragging && self.moved < 6) self.fired = true;
      self.dragging = false;
    });
    canvas.addEventListener('wheel', function (e) {
      self.zoom = clamp(self.zoom + (e.deltaY > 0 ? 1.5 : -1.5), 6, 20);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  },
  axis: function () {
    let x = 0, y = 0;
    if (this.keys.KeyA || this.keys.ArrowLeft) x -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) x += 1;
    if (this.keys.KeyW || this.keys.ArrowUp) y += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) y -= 1;
    return { x: x, y: y };
  },
  was: function (code) { return !!this.pressed[code]; },
  clearEdges: function () { this.pressed = {}; this.fired = false; },
};
