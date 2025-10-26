import * as THREE from 'three';

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
const material = new THREE.MeshLambertMaterial({ color: 0x8888ff });
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

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate the sphere
  sphere.rotation.y += 0.01;
  
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
