'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKINS = [
  { id: 'classic',  name: 'CLÁSICA',  stroke: '#fff',    flame: 'rgba(255,130,0,0.85)', body: [[20,0],[-12,-9],[-7,0],[-12,9]],   flameBase: -8 },
  { id: 'viper',    name: 'VÍBORA',   stroke: '#ff5b4d', flame: 'rgba(255,80,40,0.85)',  body: [[21,0],[-6,-11],[-2,0],[-6,11]],   flameBase: -4 },
  { id: 'javelin',  name: 'JABALINA', stroke: '#4de1ff', flame: 'rgba(80,220,255,0.85)', body: [[22,0],[-2,-6],[-10,0],[-2,6]],    flameBase: -11 },
  { id: 'phoenix',  name: 'FÉNIX',    stroke: '#ffd24d', flame: 'rgba(255,180,60,0.85)', body: [[20,0],[-4,-12],[-14,-4],[-6,0],[-14,4],[-4,12]], flameBase: -7 },
];

const STORAGE_KEY = 'asteroidsSkin';
let currentSkinId = loadSkin();

function loadSkin() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SKINS.some(s => s.id === saved)) return saved;
  } catch (e) { /* localStorage no disponible */ }
  return SKINS[0].id;
}

function saveSkin() {
  try { localStorage.setItem(STORAGE_KEY, currentSkinId); } catch (e) { /* ignorar */ }
}

function selectSkin(id) {
  if (!SKINS.some(s => s.id === id)) return;
  if (currentSkinId === id) return;
  currentSkinId = id;
  saveSkin();
  skinToast = 2;
  syncSkinButtons();
}

function cycleSkin() {
  const i = SKINS.findIndex(s => s.id === currentSkinId);
  selectSkin(SKINS[(i + 1) % SKINS.length].id);
}

let skinToast = 0;

const skinButtons = document.querySelectorAll('#skinbar [data-skin]');
function syncSkinButtons() {
  for (const b of skinButtons) {
    b.classList.toggle('active', b.dataset.skin === currentSkinId);
  }
}
for (const b of skinButtons) {
  b.addEventListener('click', () => selectSkin(b.dataset.skin));
}
syncSkinButtons();

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.shield        = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.shield        > 0) this.shield        -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    let thrust = THRUST;
    if (this.speedBoost > 0) {
      thrust *= 2;
      this.speedBoost -= dt;
    }

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;

    // Anillo del escudo (se dibuja aunque la nave parpadee por invencibilidad)
    if (this.shield > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.7)';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS.find(s => s.id === currentSkinId);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta según la skin activa
    ctx.beginPath();
    ctx.moveTo(skin.body[0][0], skin.body[0][1]);
    for (let i = 1; i < skin.body.length; i++)
      ctx.lineTo(skin.body[i][0], skin.body[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.flameBase, -4);
      ctx.lineTo(skin.flameBase - rand(6, 14), 0);
      ctx.lineTo(skin.flameBase,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Power-up (Velocidad) ──────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.ttl  = 7;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const blink = this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Símbolo » (doble velocidad)
    if (!blink) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(-5, -7);
      ctx.lineTo( 4,  0);
      ctx.lineTo(-5,  7);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo( 2, -7);
      ctx.lineTo(11,  0);
      ctx.lineTo( 2,  7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── Estrella-Fugaz (Escudo) ───────────────────────────────────────────────────
class EstrellaFugaz {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.ttl  = 3;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = rand(140, 200);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.dir = angle;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const blink = this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Estela (cometa) orientada en dirección de movimiento
    ctx.strokeStyle = 'rgba(255, 200, 60, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i <= 5; i++) {
      const tx = -Math.cos(this.dir) * i * 8;
      const ty = -Math.sin(this.dir) * i * 8;
      if (i === 1) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    // Núcleo: estrella de 4 puntas dorada
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo( 0, -this.radius);
    ctx.lineTo( 4, -4);
    ctx.lineTo( this.radius, 0);
    ctx.lineTo( 4,  4);
    ctx.lineTo( 0,  this.radius);
    ctx.lineTo(-4,  4);
    ctx.lineTo(-this.radius, 0);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, powerups, particles;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  powerups  = [];
  particles = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  powerups  = [];
  particles = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (pressed('KeyC')) cycleSkin();
  if (skinToast > 0) skinToast -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  let powerupSpawned = false;
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (!powerupSpawned && powerups.length === 0) {
          const roll = Math.random();
          if (roll < 0.08) {
            powerups.push(new EstrellaFugaz(a.x, a.y));
            powerupSpawned = true;
          } else if (roll < 0.2) {
            powerups.push(new PowerUp(a.x, a.y));
            powerupSpawned = true;
          }
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Power-ups: movimiento, recogida con la nave
  powerups.forEach(p => p.update(dt));
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p instanceof EstrellaFugaz) {
        ship.shield = 4;
        explode(p.x, p.y, 10);
      } else {
        ship.speedBoost = 5;
        explode(p.x, p.y, 6);
      }
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0 && ship.shield <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS.find(s => s.id === currentSkinId);
  const s = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.body[0][0], skin.body[0][1]);
  for (let i = 1; i < skin.body.length; i++)
    ctx.lineTo(skin.body[i][0], skin.body[i][1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  // Indicador del power-up Velocidad
  if (ship.speedBoost > 0) {
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('VELOCIDAD', W / 2, 44);
    const bw = 90;
    const bx = W / 2 - bw / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(bx, 50, bw, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx, 50, bw * (ship.speedBoost / 5), 4);
  }

  // Indicador del power-up Escudo (Estrella-Fugaz)
  if (ship.shield > 0) {
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(0, 220, 255, 0.9)';
    ctx.fillText('ESCUDO', W / 2, 62);
    const bw = 90;
    const bx = W / 2 - bw / 2;
    ctx.fillStyle = 'rgba(0, 220, 255, 0.2)';
    ctx.fillRect(bx, 68, bw, 4);
    ctx.fillStyle = 'rgba(0, 220, 255, 1)';
    ctx.fillRect(bx, 68, bw * (ship.shield / 4), 4);
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (skinToast > 0) {
    const alpha = Math.min(1, skinToast);
    const skin  = SKINS.find(s => s.id === currentSkinId);
    ctx.textAlign = 'center';
    ctx.font      = '15px monospace';
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.fillText(`SKIN: ${skin.name}   (C)`, W / 2, H - 18);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
