import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Load texture
const textureLoader = new THREE.TextureLoader();
const spaceTexture = textureLoader.load('/src/jsm/space.jpg');

// Load 3D models
const gltfLoader = new GLTFLoader();

// Basic Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Set up renderer
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000011); // Dark blue space background
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('WEBGLcontainer').appendChild(renderer.domElement);

// Set background texture
scene.background = spaceTexture;

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add a basic sphere to represent a planet
const geometry = new THREE.SphereGeometry(1, 32, 32);
const planetTexture = textureLoader.load('/src/jsm/space1.jpg');
const material = new THREE.MeshLambertMaterial({ map: planetTexture });
const sphere = new THREE.Mesh(geometry, material);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

// Add ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
scene.add(ground);

// Position camera
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// Load 3D models
let loadedModels = [];

gltfLoader.load('/src/models/iron_man.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(2, 0, 0);
  model.scale.set(0.5, 0.5, 0.5);
  scene.add(model);
  loadedModels.push(model);
});

gltfLoader.load('/src/models/football.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(-2, 0, 0);
  model.scale.set(0.3, 0.3, 0.3);
  scene.add(model);
  loadedModels.push(model);
});

// Mouse controls
let mouseX = 0, mouseY = 0;
let isMouseDown = false;

// Mouse event listeners
document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener('mousedown', () => {
  isMouseDown = true;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate the sphere
  sphere.rotation.y += 0.01;
  
  // Rotate loaded models
  loadedModels.forEach(model => {
    model.rotation.y += 0.005;
  });
  
  // Camera movement based on mouse
  if (isMouseDown) {
    camera.position.x += mouseX * 0.1;
    camera.position.y += mouseY * 0.1;
    camera.lookAt(0, 0, 0);
  }
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the animation
animate();
