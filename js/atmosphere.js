import { state } from './state.js';

let canvas = null;
let ctx = null;
let animationId = null;
let clouds = [];
let rainDrops = [];
let snowFlakes = [];
let tintOverlay = null;

const RAIN_COUNT = 800;
const SNOW_COUNT = 400;

export function initAtmosphere() {
  tintOverlay = document.getElementById('atmosphere-tint');
  canvas = document.getElementById('atmosphere-canvas');
  ctx = canvas.getContext('2d');

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
  const count = Math.floor(state.cloudCoverage / 5);
  for (let i = 0; i < count; i += 1) {
    clouds.push(createCloud());
  }
}

function createCloud() {
  return {
    x: Math.random() * (canvas?.width || window.innerWidth),
    y: Math.random() * ((canvas?.height || window.innerHeight) * 0.35) + 20,
    width: 80 + Math.random() * 120,
    height: 30 + Math.random() * 40,
    speed: 0.15 + Math.random() * 0.25,
    opacity: 0.15 + Math.random() * 0.35,
  };
}

export function updateCloudCoverage() {
  initClouds();
}

export function applyCloudCoverage(value) {
  state.cloudCoverage = Math.max(0, Math.min(100, Math.round(value)));
  const cloudValue = document.getElementById('cloud-value');
  const cloudSlider = document.getElementById('cloud-slider');
  if (cloudValue) cloudValue.textContent = `${state.cloudCoverage}%`;
  if (cloudSlider) cloudSlider.value = String(state.cloudCoverage);
  initClouds();
}

export function updateTimeOfDay() {
  if (!tintOverlay) return;

  const hour = state.timeOfDay;
  const hours = Math.floor(hour);
  const minutes = Math.floor((hour - hours) * 60);
  const timeValue = document.getElementById('time-value');
  if (timeValue) {
    timeValue.textContent = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
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
    gradient = 'transparent';
  }

  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.style.filter = filter;
  }
  tintOverlay.style.background = gradient;
}

export function setWeather(effect, { fromLive = false } = {}) {
  state.weatherEffect = effect;
  updateWeatherButtons();

  if (effect === 'rain') {
    initRain();
    snowFlakes = [];
  } else if (effect === 'snow') {
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
  rainDrops = [];
  for (let i = 0; i < RAIN_COUNT; i += 1) {
    rainDrops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 8 + Math.random() * 12,
      length: 10 + Math.random() * 15,
    });
  }
}

function initSnow() {
  snowFlakes = [];
  for (let i = 0; i < SNOW_COUNT; i += 1) {
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

  const activeId =
    state.weatherEffect === 'rain'
      ? 'rain-btn'
      : state.weatherEffect === 'snow'
        ? 'snow-btn'
        : 'clear-btn';
  document.getElementById(activeId)?.classList.add('active');
}

function drawClouds() {
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

  if (state.weatherEffect === 'rain') {
    drawRain();
  } else if (state.weatherEffect === 'snow') {
    drawSnow();
  }
}

function startAnimation() {
  const loop = () => {
    renderFrame();
    animationId = requestAnimationFrame(loop);
  };
  if (animationId) cancelAnimationFrame(animationId);
  loop();
}

export function destroyAtmosphere() {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', resizeCanvas);
}
