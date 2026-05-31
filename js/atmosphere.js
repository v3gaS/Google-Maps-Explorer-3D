/**
 * @file atmosphere.js
 * @description Screen-space atmosphere: day/night tint, clouds, rain, and snow.
 *
 * All effects render on a transparent canvas overlay with pointer-events disabled
 * so Map3DElement gestures are never blocked.
 */

import { ATMOSPHERE, WEATHER_EFFECT } from './constants.js';
import { state } from './state.js';
import { clamp, formatTimeOfDay } from './utils/format.js';

/** @type {HTMLCanvasElement | null} */
let canvas = null;

/** @type {CanvasRenderingContext2D | null} */
let ctx = null;

/** @type {number | null} */
let animationId = null;

/** @type {Array<object>} */
let clouds = [];

/** @type {Array<object>} */
let rainDrops = [];

/** @type {Array<object>} */
let snowFlakes = [];

/** @type {HTMLElement | null} */
let tintOverlay = null;

/**
 * Initializes the atmosphere overlay and starts the animation loop.
 */
export function initAtmosphere() {
  tintOverlay = document.getElementById('atmosphere-tint');
  canvas = document.getElementById('atmosphere-canvas');

  if (!canvas || !tintOverlay) {
    throw new Error('Atmosphere elements are missing from the page.');
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to acquire 2D rendering context for atmosphere canvas.');
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  initClouds();
  updateTimeOfDay();
  startAnimation();
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initClouds() {
  clouds = [];
  const count = Math.floor(state.cloudCoverage / ATMOSPHERE.CLOUDS_PER_COVERAGE_STEP);
  for (let i = 0; i < count; i += 1) {
    clouds.push(createCloud());
  }
}

function createCloud() {
  const width = canvas?.width || window.innerWidth;
  const height = canvas?.height || window.innerHeight;

  return {
    x: Math.random() * width,
    y: Math.random() * (height * 0.35) + 20,
    width: 80 + Math.random() * 120,
    height: 30 + Math.random() * 40,
    speed: 0.15 + Math.random() * 0.25,
    opacity: 0.15 + Math.random() * 0.35,
  };
}

/** Rebuilds cloud sprites after manual cloud coverage changes. */
export function updateCloudCoverage() {
  initClouds();
}

/**
 * Sets cloud coverage from live weather or programmatic updates.
 * @param {number} value - Percentage from 0 to 100.
 */
export function applyCloudCoverage(value) {
  state.cloudCoverage = clamp(Math.round(value), 0, 100);

  const cloudValue = document.getElementById('cloud-value');
  const cloudSlider = document.getElementById('cloud-slider');
  if (cloudValue) cloudValue.textContent = `${state.cloudCoverage}%`;
  if (cloudSlider) cloudSlider.value = String(state.cloudCoverage);

  initClouds();
}

/** Updates map tint and overlay gradient based on state.timeOfDay. */
export function updateTimeOfDay() {
  if (!tintOverlay) return;

  const hour = state.timeOfDay;
  const timeValue = document.getElementById('time-value');
  if (timeValue) {
    timeValue.textContent = formatTimeOfDay(hour);
  }

  let filter = '';
  let gradient = 'transparent';

  if (hour < 6 || hour > 18) {
    filter = 'brightness(0.45) saturate(0.7) hue-rotate(200deg)';
    gradient =
      'radial-gradient(ellipse at 50% 20%, rgba(10,26,42,0.5) 0%, rgba(5,10,30,0.75) 100%)';
  } else if (hour < 7 || hour > 17) {
    filter = 'brightness(0.75) saturate(1.1) hue-rotate(15deg)';
    gradient =
      'linear-gradient(to bottom, rgba(255,160,122,0.35) 0%, rgba(255,120,80,0.15) 40%, transparent 70%)';
  } else {
    filter = 'brightness(1) saturate(1) hue-rotate(0deg)';
  }

  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.style.filter = filter;
  }
  tintOverlay.style.background = gradient;
}

/**
 * Applies a weather effect to the atmosphere overlay.
 * @param {'clear' | 'rain' | 'snow'} effect
 * @param {{ fromLive?: boolean }} [options]
 */
export function setWeather(effect, { fromLive = false } = {}) {
  state.weatherEffect = effect;
  updateWeatherButtons();

  if (effect === WEATHER_EFFECT.RAIN) {
    initRain();
    snowFlakes = [];
  } else if (effect === WEATHER_EFFECT.SNOW) {
    initSnow();
    rainDrops = [];
  } else {
    rainDrops = [];
    snowFlakes = [];
  }

  if (!fromLive) {
    state.matchRealWeather = false;
    const toggle = document.getElementById('match-real-weather');
    if (toggle) toggle.checked = false;
  }
}

function initRain() {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return;

  rainDrops = [];
  for (let i = 0; i < ATMOSPHERE.RAIN_PARTICLE_COUNT; i += 1) {
    rainDrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 8 + Math.random() * 12,
      length: 10 + Math.random() * 15,
    });
  }
}

function initSnow() {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return;

  snowFlakes = [];
  for (let i = 0; i < ATMOSPHERE.SNOW_PARTICLE_COUNT; i += 1) {
    snowFlakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 1.5,
      radius: 1 + Math.random() * 2,
      drift: Math.random() * Math.PI * 2,
    });
  }
}

function updateWeatherButtons() {
  document.querySelectorAll('.weather-buttons button').forEach((btn) => {
    btn.classList.remove('active');
  });

  const activeId = {
    [WEATHER_EFFECT.RAIN]: 'rain-btn',
    [WEATHER_EFFECT.SNOW]: 'snow-btn',
    [WEATHER_EFFECT.CLEAR]: 'clear-btn',
  }[state.weatherEffect] || 'clear-btn';

  document.getElementById(activeId)?.classList.add('active');
}

function drawClouds() {
  if (!ctx || !canvas) return;

  clouds.forEach((cloud) => {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - cloud.width * 0.25, cloud.y + 5, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.width * 0.25, cloud.y + 5, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    cloud.x += cloud.speed;
    if (cloud.x - cloud.width > canvas.width) {
      cloud.x = -cloud.width;
      cloud.y = Math.random() * (canvas.height * 0.35) + 20;
    }
  });
}

function drawRain() {
  if (!ctx || !canvas) return;

  ctx.strokeStyle = 'rgba(170, 170, 200, 0.6)';
  ctx.lineWidth = 1;

  rainDrops.forEach((drop) => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - 2, drop.y + drop.length);
    ctx.stroke();

    drop.y += drop.speed;
    drop.x -= 1;
    if (drop.y > canvas.height) {
      drop.y = -drop.length;
      drop.x = Math.random() * canvas.width;
    }
  });
}

function drawSnow() {
  if (!ctx || !canvas) return;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

  snowFlakes.forEach((flake) => {
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fill();

    flake.y += flake.speed;
    flake.x += Math.sin(flake.drift + Date.now() * 0.001) * 0.5;
    flake.drift += 0.01;

    if (flake.y > canvas.height) {
      flake.y = -5;
      flake.x = Math.random() * canvas.width;
    }
  });
}

function renderFrame() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.cloudCoverage > 0) {
    drawClouds();
  }

  if (state.weatherEffect === WEATHER_EFFECT.RAIN) {
    drawRain();
  } else if (state.weatherEffect === WEATHER_EFFECT.SNOW) {
    drawSnow();
  }
}

function startAnimation() {
  const loop = () => {
    renderFrame();
    animationId = requestAnimationFrame(loop);
  };

  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  loop();
}

/** Stops the animation loop and removes listeners. */
export function destroyAtmosphere() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  window.removeEventListener('resize', resizeCanvas);
}
