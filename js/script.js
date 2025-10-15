// js/script.js - Copiar y pegar completo para su modelo 3D

// Ruta del modelo
const MODEL_PATH = 'models/model.glb'; // Cambie la extensión si su archivo no es .glb

// DOM
const enterBtn = document.getElementById('enterBtn');
const accBtns = document.querySelectorAll('.acc-btn');
const colorPicker = document.getElementById('colorPicker');
const resetViewBtn = document.getElementById('resetView');
const canvasContainer = document.getElementById('canvasContainer');

// Botón para ir a la sección del visor 3D
enterBtn.addEventListener('click', () => {
  document.getElementById('viewer').scrollIntoView({ behavior: 'smooth' });
});

// Acordeón de información
accBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const next = btn.nextElementSibling;
    const open = next.style.display === 'block';
    document.querySelectorAll('.acc-content').forEach(c => c.style.display = 'none');
    next.style.display = open ? 'none' : 'block';
  });
});

// --- Three.js: configuración básica ---
let scene, camera, renderer, controls, modelRoot;
let initialCameraPos;

function initThree() {
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
  camera.position.set(0, 1.2, 3);
  initialCameraPos = camera.position.clone();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasContainer.innerHTML = '';
  canvasContainer.appendChild(renderer.domElement);

  // luces
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  hemi.position.set(0, 2, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 10, 10);
  scene.add(dir);

  // piso sutil
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x0b0f14, metalness: 0, roughness: 0.9 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.001;
  scene.add(ground);

  // controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0);
  controls.update();

  window.addEventListener('resize', onWindowResize);

  // cargamos modelo
  loadModel(MODEL_PATH).catch(err => {
    console.warn('No se cargó el modelo. Usando cubo de ejemplo.', err);
    addPlaceholder();
  });

  animate();
}

function onWindowResize() {
  const w = canvasContainer.clientWidth;
  const h = canvasContainer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

async function loadModel(path) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    loader.load(path, gltf => {
      modelRoot = gltf.scene;

      // centrar y escalar
      const box = new THREE.Box3().setFromObject(modelRoot);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.6 / maxDim;
      modelRoot.scale.setScalar(scale);

      // centrar
      box.setFromObject(modelRoot);
      const center = new THREE.Vector3();
      box.getCenter(center);
      modelRoot.position.sub(center);
      modelRoot.position.y += size.y * scale / 2;

      scene.add(modelRoot);
      resolve();
    }, undefined, err => reject(err));
  });
}

function addPlaceholder() {
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x337ab7 });
  const cube = new THREE.Mesh(geom, mat);
  scene.add(cube);
  modelRoot = cube;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Cambiar color del modelo
function applyColorToModel(hex) {
  if (!modelRoot) return;
  modelRoot.traverse(node => {
    if (node.isMesh && node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach(m => { if (m.color) m.color.set(hex); m.needsUpdate = true; });
      } else {
        if (node.material.color) node.material.color.set(hex);
        node.material.needsUpdate = true;
      }
    }
  });
}

colorPicker.addEventListener('input', e => {
  applyColorToModel(e.target.value);
});

resetViewBtn.addEventListener('click', () => {
  camera.position.copy(initialCameraPos);
  controls.target.set(0, 0.5, 0);
  controls.update();
});

// Iniciar Three.js al cargar DOM
window.addEventListener('DOMContentLoaded', () => {
  try { initThree(); } catch (e) { console.error(e); }
});



