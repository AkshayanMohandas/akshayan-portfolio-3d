import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WEBGL } from './WebGL';
import * as Ammo from './builds/ammo';
import { boxTexture, toolTexture, URL } from './resources/textures';
import { setupEventHandlers, moveDirection, shouldJump, isTouchscreenDevice, touchEvent, createJoystick } from './resources/eventHandlers';
import { preloadDivs, preloadOpacity, postloadDivs, startScreenDivs, startButton, noWebGL, fadeOutDivs } from './resources/preload';
import {
  clock,
  scene,
  camera,
  renderer,
  stats,
  manager,
  createWorld,
  lensFlareObject,
  createLensFlare,
  particleGroup,
  particleAttributes,
  particleSystemObject,
  glowingParticles,
  addParticles,
  moveParticles,
  generateGalaxy,
  galaxyMaterial,
  galaxyClock,
  galaxyPoints,
} from './resources/world';
import { simpleText, leftAlignedText } from './resources/surfaces';
import { pickPosition, launchClickPosition, getCanvasRelativePosition, rotateCamera, launchHover, updateHoverAnimations } from './resources/utils';
import { createInfoModal, openModal } from './infoModal.js';

export let cursorHoverObjects = [];

// Global loading state for coordination
window.sceneLoadingComplete = false;

// Function to create info icons using GLB model
function createInfoIcon(x, y, z, infoKey) {
  const loader = new GLTFLoader();
  
  console.log(`Loading info icon for ${infoKey} at position (${x}, ${y}, ${z})`);
  
  loader.load('./src/models/highpoly_info_sign_3d_icon.glb', function (gltf) {
    console.log('GLB model loaded successfully');
    const model = gltf.scene;
    
    // Scale the model to appropriate size
    model.scale.set(0.3, 0.3, 0.3);
    
    // Position the model
    model.position.set(x, y, z);
    
    // Rotate to be flat on the ground like text
    model.rotation.x = -Math.PI * 0.5;
    
    // Set user data for click detection
    model.userData = { 
      type: 'infoIcon', 
      infoKey: infoKey,
      hoverable: true,
      hoverScale: 1.2
    };
    
    // Apply user data to all meshes in the model for click detection
    model.traverse(function (child) {
      if (child.isMesh) {
        // Keep original texture and blue color, just ensure it's visible
        child.material.transparent = true;
        child.material.opacity = 1;
        child.material.side = THREE.DoubleSide;
        
        // Set user data for click detection
        child.userData = model.userData;
        child.castShadow = true;
        child.receiveShadow = true;
        
        console.log(`Applied userData to mesh: ${child.name || 'unnamed'}`);
      }
    });
    
    // Add to scene
    scene.add(model);
    cursorHoverObjects.push(model);
    
    // Store reference for potential cleanup
    model.userData.originalScale = model.scale.clone();
    
    console.log(`Info icon ${infoKey} added to scene and cursorHoverObjects`);
    
  }, function (progress) {
    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
  }, function (error) {
    console.error('Error loading info icon model:', error);
    
    // Fallback to simple circle if model fails to load
    console.log('Creating fallback circle icon');
    const geometry = new THREE.CircleGeometry(0.3, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const fallbackIcon = new THREE.Mesh(geometry, material);
    fallbackIcon.position.set(x, y, z);
    fallbackIcon.rotation.x = -Math.PI * 0.5;
    fallbackIcon.userData = { 
      type: 'infoIcon', 
      infoKey: infoKey,
      hoverable: true,
      hoverScale: 1.2
    };
    
    scene.add(fallbackIcon);
    cursorHoverObjects.push(fallbackIcon);
    console.log(`Fallback icon ${infoKey} added to scene`);
  });
}

// Mouse drag variables for ball movement
let isDragging = false;
let dragStartPosition = null;
let dragTargetPosition = null;

// start Ammo Engine
Ammo().then((Ammo) => {
  //Ammo.js variable declaration
  let rigidBodies = [],
    physicsWorld;

  //Ammo Dynamic bodies for ball
  let ballObject = null;
  const STATE = { DISABLE_DEACTIVATION: 4 };

  //default transform object
  let tmpTrans = new Ammo.btTransform();

  // list of hyperlink objects
  var objectsWithLinks = [];

  //function to create physics world with Ammo.js
  function createPhysicsWorld() {
    //algortihms for full (not broadphase) collision detection
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration), // dispatch calculations for overlapping pairs/ collisions.
      overlappingPairCache = new Ammo.btDbvtBroadphase(), //broadphase collision detection list of all possible colliding pairs
      constraintSolver = new Ammo.btSequentialImpulseConstraintSolver(); //causes the objects to interact properly, like gravity, game logic forces, collisions

    // see bullet physics docs for info
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, constraintSolver, collisionConfiguration);

    // add gravity
    physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
  }

  //create flat plane
  function createGridPlane() {
    // block properties - reduced ground area to 200 units
    let pos = { x: 0, y: -0.25, z: 0 };
    let scale = { x: 250, y: 0.5, z: 250 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //create grid overlay on plane - reduced grid
    var grid = new THREE.GridHelper(250, 25, 0xffffff, 0xffffff);
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    grid.position.y = 0.005;
    scene.add(grid);

    //Create Threejs Plane
    let blockPlane = new THREE.Mesh(
      new THREE.BoxBufferGeometry(),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
      })
    );
    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);
    blockPlane.receiveShadow = true;
    scene.add(blockPlane);

    //Ammo.js Physics
    let transform = new Ammo.btTransform();
    transform.setIdentity(); // sets safe default values
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    //setup collision box
    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    //  provides information to create a rigid body
    let rigidBodyStruct = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rigidBodyStruct);
    body.setFriction(10);
    body.setRollingFriction(10);

    // add to world
    physicsWorld.addRigidBody(body);
  }

  // create ball
  function createBall() {
    let pos = { x: 0, y: 50, z: 90 }; // Start high in the sky to fall down
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 3;

    var marble_loader = new THREE.TextureLoader(manager);
    var marbleTexture = marble_loader.load('./src/jsm/earth.jpg');
    marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
    marbleTexture.repeat.set(1, 1);
    marbleTexture.anisotropy = 1;
    marbleTexture.encoding = THREE.sRGBEncoding;

    //threeJS Section
    let ball = (ballObject = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshLambertMaterial({ map: marbleTexture })));

    ball.geometry.computeBoundingSphere();
    ball.geometry.computeBoundingBox();

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    scene.add(ball);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    //body.setFriction(4);
    body.setRollingFriction(10);

    //set ball friction

    //once state is set to disable, dynamic interaction no longer calculated
    body.setActivationState(STATE.DISABLE_DEACTIVATION);

    // Add initial downward velocity to make the ball fall naturally
    const initialVelocity = new Ammo.btVector3(0, -10, 0); // Small downward velocity
    body.setLinearVelocity(initialVelocity);

    physicsWorld.addRigidBody(
      body //collisionGroupRedBall, collisionGroupGreenBall | collisionGroupPlane
    );

    ball.userData.physicsBody = body;
    ballObject.userData.physicsBody = body;

    rigidBodies.push(ball);
    rigidBodies.push(ballObject);
  }


  // Create planets with relative sizes compared to Earth (radius = 2)
  function createPlanet(x, y, z, planetName, relativeSize, texturePath, mass = 5) {
    const earthRadius = 2; // Earth's radius in the scene
    const radius = earthRadius * relativeSize;
    const quat = { x: 0, y: 0, z: 0, w: 1 };

    // Load planet texture
    const loader = new THREE.TextureLoader(manager);
    const planetTexture = loader.load(texturePath);
    planetTexture.wrapS = planetTexture.wrapT = THREE.RepeatWrapping;
    planetTexture.repeat.set(1, 1);
    planetTexture.anisotropy = 1;
    planetTexture.encoding = THREE.sRGBEncoding;

    // Create planet material with texture
    const planetMaterial = new THREE.MeshLambertMaterial({ 
      map: planetTexture,
      transparent: false
    });

    // Create planet mesh
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32), 
      planetMaterial
    );

    planet.position.set(x, y, z);
    planet.castShadow = true;
    planet.receiveShadow = true;
    planet.userData = { planetName: planetName };
    scene.add(planet);

    // Add ring for Saturn
    if (planetName === 'Saturn') {
      const ring = createSaturnRing(radius);
      planet.add(ring); // Make ring a child of the planet
    }

    // Add physics - DISABLED initially so planets don't fall
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(x, y, z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);

    body.setRollingFriction(1);
    // DISABLE physics initially - planets won't fall until button is pressed
    body.setActivationState(0); // DISABLE_SIMULATION
    physicsWorld.addRigidBody(body);

    planet.userData.physicsBody = body;
    planet.userData.originalPosition = { x: x, y: y, z: z };
    planet.userData.hasFallen = false;
    rigidBodies.push(planet);

    return planet;
  }

  // Create Saturn's ring
  function createSaturnRing(planetRadius) {
    // Create a single ring around Saturn
    const innerRadius = planetRadius * 1.3;
    const outerRadius = planetRadius * 2.0;
    
    // Create ring geometry
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
    
    // Create ring material with Saturn's color
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFAD5A5, // Light orange color matching Saturn
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });

    // Create ring mesh
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Rotate to be horizontal
    
    return ring; // Return the ring instead of adding to scene
  }

  // Array to store planet objects for fall functionality
  let planetObjects = [];

  // Create sun in the center with texture and glow
  function createSun(x, y, z) {
    const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
    const sunTexture = new THREE.TextureLoader().load('./src/jsm/planet stexture images/sun.jpg');
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      map: sunTexture,
      emissive: 0xff4400,
      emissiveIntensity: 0.3
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(x, y, z);
    sun.name = 'Sun';
    
    // Add subtle glow layers
    const glowGeometry1 = new THREE.SphereGeometry(5.5, 32, 32);
    const glowMaterial1 = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.15
    });
    const glow1 = new THREE.Mesh(glowGeometry1, glowMaterial1);
    sun.add(glow1);
    
    const glowGeometry2 = new THREE.SphereGeometry(7, 32, 32);
    const glowMaterial2 = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.08
    });
    const glow2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
    sun.add(glow2);
    
    scene.add(sun);
    return sun;
  }

  // Create all planets in 3 rings to prevent overlapping
  function createAllPlanets() {
    // Planet data moved to center middle of ground
    const centerX = 0; // Center of ground area
    const centerZ = -10; // Moved forward from center
    const innerRingRadius = 9; // Inner ring radius - closer
    const middleRingRadius = 16; // Middle ring radius
    const outerRingRadius = 26; // Outer ring radius
    const height = 15; // Higher height for better visibility
    
    // Create sun in the center
    createSun(centerX, height, centerZ);
    
    // Inner ring planets (2 planets) - same speed for all
    const innerRingSpeed = 0.003;
    const innerRingPlanets = [
      { name: 'Mercury', size: 1.0, texture: './src/jsm/planet stexture images/mercury.jpg', mass: 2, orbitSpeed: innerRingSpeed },
      { name: 'Venus', size: 1.2, texture: './src/jsm/planet stexture images/venus.jpg', mass: 4, orbitSpeed: innerRingSpeed }
    ];

    // Middle ring planets (2 planets) - same speed for all
    const middleRingSpeed = 0.002;
    const middleRingPlanets = [
      { name: 'Mars', size: 1.1, texture: './src/jsm/planet stexture images/mars.jpeg', mass: 2, orbitSpeed: middleRingSpeed },
      { name: 'Jupiter', size: 2.0, texture: './src/jsm/planet stexture images/jupiter.jpg', mass: 15, orbitSpeed: middleRingSpeed }
    ];

    // Outer ring planets (3 planets) - same speed for all
    const outerRingSpeed = 0.001;
    const outerRingPlanets = [
      { name: 'Saturn', size: 1.8, texture: './src/jsm/planet stexture images/saturn.jpg', mass: 12, orbitSpeed: outerRingSpeed },
      { name: 'Uranus', size: 1.4, texture: './src/jsm/planet stexture images/Uranus.png', mass: 8, orbitSpeed: outerRingSpeed },
      { name: 'Neptune', size: 1.4, texture: './src/jsm/planet stexture images/Neptune.jpg', mass: 8, orbitSpeed: outerRingSpeed }
    ];

    // Create inner ring planets
    innerRingPlanets.forEach((planet, index) => {
      const angle = (index / innerRingPlanets.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * innerRingRadius;
      const z = centerZ + Math.sin(angle) * innerRingRadius;
      const y = height;
      
      const planetObj = createPlanet(x, y, z, planet.name, planet.size, planet.texture, planet.mass);
      planetObj.userData.orbitCenter = { x: centerX, y: height, z: centerZ };
      planetObj.userData.orbitDistance = innerRingRadius;
      planetObj.userData.orbitSpeed = planet.orbitSpeed;
      planetObj.userData.orbitAngle = angle;
      planetObjects.push(planetObj);
    });

    // Create middle ring planets
    middleRingPlanets.forEach((planet, index) => {
      const angle = (index / middleRingPlanets.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * middleRingRadius;
      const z = centerZ + Math.sin(angle) * middleRingRadius;
      const y = height;
      
      const planetObj = createPlanet(x, y, z, planet.name, planet.size, planet.texture, planet.mass);
      planetObj.userData.orbitCenter = { x: centerX, y: height, z: centerZ };
      planetObj.userData.orbitDistance = middleRingRadius;
      planetObj.userData.orbitSpeed = planet.orbitSpeed;
      planetObj.userData.orbitAngle = angle;
      planetObjects.push(planetObj);
    });

    // Create outer ring planets
    outerRingPlanets.forEach((planet, index) => {
      const angle = (index / outerRingPlanets.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * outerRingRadius;
      const z = centerZ + Math.sin(angle) * outerRingRadius;
      const y = height;
      
      const planetObj = createPlanet(x, y, z, planet.name, planet.size, planet.texture, planet.mass);
      planetObj.userData.orbitCenter = { x: centerX, y: height, z: centerZ };
      planetObj.userData.orbitDistance = outerRingRadius;
      planetObj.userData.orbitSpeed = planet.orbitSpeed;
      planetObj.userData.orbitAngle = angle;
      planetObjects.push(planetObj);
    });
  }

  // Update planet orbital motion
  function updatePlanetOrbits() {
    planetObjects.forEach(planet => {
      if (!planet.userData.hasFallen) {
        // Update orbit angle
        planet.userData.orbitAngle += planet.userData.orbitSpeed;
        
        // Calculate new position
        const center = planet.userData.orbitCenter;
        const distance = planet.userData.orbitDistance;
        const angle = planet.userData.orbitAngle;
        
        const newX = center.x + Math.cos(angle) * distance;
        const newZ = center.z + Math.sin(angle) * distance;
        
        // Update planet position
        planet.position.set(newX, planet.position.y, newZ);
        
        // Update physics body position
        const body = planet.userData.physicsBody;
        if (body) {
          let transform = new Ammo.btTransform();
          transform.setIdentity();
          transform.setOrigin(new Ammo.btVector3(newX, planet.position.y, newZ));
          transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
          body.setWorldTransform(transform);
        }
      }
    });
  }

  // Function to make all planets fall
  function makePlanetsFall() {
    planetObjects.forEach(planet => {
      if (!planet.userData.hasFallen) {
        const body = planet.userData.physicsBody;
        if (body) {
          // Enable physics and add downward force
          body.setActivationState(1); // ACTIVE_TAG
          
          // Add random horizontal force for more interesting fall
          const randomX = (Math.random() - 0.5) * 20;
          const randomZ = (Math.random() - 0.5) * 20;
          const downwardForce = -30; // Strong downward force
          
          const impulse = new Ammo.btVector3(randomX, downwardForce, randomZ);
          body.applyCentralImpulse(impulse);
          
          // Add some rotation
          const torque = new Ammo.btVector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          );
          body.applyTorqueImpulse(torque);
          
          planet.userData.hasFallen = true;
        }
      }
    });
  }

  // Reset planets to original positions
  function resetPlanets() {
    planetObjects.forEach(planet => {
      const body = planet.userData.physicsBody;
      const originalPos = planet.userData.originalPosition;
      
      if (body) {
        // Reset position
        planet.position.set(originalPos.x, originalPos.y, originalPos.z);
        
        // Reset physics body
        body.setActivationState(0); // Disable simulation
        body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
        body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        
        // Reset transform
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(originalPos.x, originalPos.y, originalPos.z));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
        body.setWorldTransform(transform);
        
        planet.userData.hasFallen = false;
      }
    });
  }

  // Create fall button using Portal 2 button model
  function createFallButton() {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/button_-_from_portal_2_original.glb', (gltf) => {
      const button = gltf.scene;
      
      // Position button on the ground between the text elements
      button.position.set(0, 0.5, -20); // Moved forward with solar system
      
      // Scale the button to appropriate size
      button.scale.setScalar(5); // Adjust scale as needed
      
      // Rotate the button to face forward
      button.rotation.y = Math.PI; // 180 degrees to face forward
      
      // Enable shadows
      button.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add button functionality
      button.userData = { isButton: true };
      
      // Add to scene
      scene.add(button);
      
      // Debug: Log button creation
      console.log('Portal 2 button added to scene with userData:', button.userData);
      
      // Add physics to button (box shape for the Portal button)
      addRigidPhysics(button, { x: 4, y: 2, z: 4 });
      
      console.log('Portal 2 button model loaded successfully');
    }, (progress) => {
      console.log('Portal 2 button loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Portal 2 button model:', error);
      
      // Fallback to original button if model fails to load
      createFallbackButton();
    });
  }
  
  // Fallback button creation in case GLB model fails
  function createFallbackButton() {
    const buttonRadius = 2; // Small round button
    const buttonHeight = 0.5; // Thin button
    
    // Create button material with bright red emergency stop look
    const buttonMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Bright red color
      emissive: 0x660000, // Stronger red glow for emergency look
      emissiveIntensity: 0.5,
      metalness: 0.1,
      roughness: 0.3
    });
    
    // Create round button mesh (cylinder for round shape)
    const button = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(buttonRadius, buttonRadius, buttonHeight, 16),
      buttonMaterial
    );
    
    // Position button between the text elements
    button.position.set(0, buttonHeight / 2, -30); // Moved forward with solar system
    button.castShadow = true;
    button.receiveShadow = true;
    button.userData = { isButton: true };
    
    scene.add(button);
    
    // Add physics to button (cylinder shape)
    addRigidPhysics(button, { x: buttonRadius, y: buttonHeight, z: buttonRadius });
    
    return button;
  }

  //create link boxes
  function createBox(x, y, z, scaleX, scaleY, scaleZ, boxTexture, URLLink, color = 0x000000, transparent = true, rounded = false, radius = 0.2) {
    const boxScale = { x: scaleX, y: scaleY, z: scaleZ };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //load link logo
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load(boxTexture);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: transparent,
      color: 0xffffff,
    });

    var borderMaterial = new THREE.MeshBasicMaterial({
      color: color,
    });
    borderMaterial.color.convertSRGBToLinear();

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];

    // Create geometry - use rounded box if requested
    let geometry;
    if (rounded) {
      // Create rounded box geometry
      geometry = new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z, 8, 8, 8);
      // Apply rounded corners by modifying vertices
      const positions = geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        // Calculate distance from each corner
        const halfX = boxScale.x * 0.5;
        const halfY = boxScale.y * 0.5;
        const halfZ = boxScale.z * 0.5;
        
        // Check if vertex is near a corner and round it
        if (Math.abs(x) > halfX - radius && Math.abs(y) > halfY - radius) {
          const cornerX = Math.sign(x) * (halfX - radius);
          const cornerY = Math.sign(y) * (halfY - radius);
          const cornerZ = z;
          
          const dx = x - cornerX;
          const dy = y - cornerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const factor = Math.min(radius / distance, 1);
            positions[i] = cornerX + dx * factor;
            positions[i + 1] = cornerY + dy * factor;
          }
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    } else {
      geometry = new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z);
    }

    const linkBox = new THREE.Mesh(geometry, materials);
    linkBox.position.set(x, y, z);
    linkBox.renderOrder = 1;
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    linkBox.userData = { URL: URLLink, email: URLLink };
    scene.add(linkBox);
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);

    cursorHoverObjects.push(linkBox);
  }

  //create horizontal AKSHAYAN text parallel to X-axis with letters standing straight
  function createHorizontalAkshayanText() {
    var text_loader = new THREE.FontLoader();

    text_loader.load('./src/jsm/fonts/optimer_regular.typeface.json', function (font) {
      const text = 'AKSHAYAN MOHANDAS';
      const x = 2.5; // Center X position
      const y = 2.75; // Height above ground
      const z = 45; // Center Z position

      // Create the entire text as one geometry for proper spacing
      var geometry = new THREE.TextGeometry(text, {
        font: font,
        size: 5.0, // Much larger, bolder size
        height: 1.2, // Increased depth for bold 3D effect
        curveSegments: 8, // Cleaner, less rounded edges
        bevelEnabled: true,
        bevelThickness: 0.3, // Thicker bevel for bold look
        bevelSize: 0.15, // Larger bevel for bold appearance
        bevelOffset: 0,
        bevelSegments: 3, // More bevel segments for bold edges
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      // Center the text properly
      const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
      const yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
      geometry.translate(xMid, yMid, 0);

      var color = 0xffffff; // Clean white like the image
      var emissiveColor = 0x000000; // No emissive glow for clean look

      var textMaterials = [
        new THREE.MeshPhongMaterial({ 
          color: color,
          emissive: emissiveColor,
          emissiveIntensity: 0,
          shininess: 100,
          specular: 0x222222
        }), // front
        new THREE.MeshPhongMaterial({ 
          color: color,
          emissive: emissiveColor,
          emissiveIntensity: 0,
          shininess: 100,
          specular: 0x222222
        }), // side
      ];

      var textMesh = new THREE.Mesh(geometry, textMaterials);
      textMesh.position.set(x, y, z);
      textMesh.receiveShadow = true;
      textMesh.castShadow = true;

      scene.add(textMesh);
    });
  }

  // Create 3D section titles
  function create3DSectionTitle(text, x, y, z, fontSize = 2.5, letterSpacing = 0.1) {
    var text_loader = new THREE.FontLoader();

    text_loader.load('./src/jsm/fonts/optimer_regular.typeface.json', function (font) {
      // Create the entire text as one geometry for proper spacing
      var geometry = new THREE.TextGeometry(text, {
        font: font,
        size: fontSize,
        height: fontSize * 0.3, // Proportional depth for 3D effect
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: fontSize * 0.07, // Proportional bevel thickness
        bevelSize: fontSize * 0.03, // Proportional bevel size
        bevelOffset: 0,
        bevelSegments: 3,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      // Center the text properly
      const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
      const yMid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
      geometry.translate(xMid, yMid, 0);

      var color = 0xffffff; // Clean white like the image
      var emissiveColor = 0x000000; // No emissive glow for clean look

      var textMaterials = [
        new THREE.MeshPhongMaterial({ 
          color: color,
          emissive: emissiveColor,
          emissiveIntensity: 0,
          shininess: 100,
          specular: 0x222222
        }), // front
        new THREE.MeshPhongMaterial({ 
          color: color,
          emissive: emissiveColor,
          emissiveIntensity: 0,
          shininess: 100,
          specular: 0x222222
        }), // side
      ];

      var textMesh = new THREE.Mesh(geometry, textMaterials);
      textMesh.position.set(x, y, z);
      textMesh.receiveShadow = true;
      textMesh.castShadow = true;

      scene.add(textMesh);
    });
  }

  //create projector screen
  function createProjectorScreen(x, y, z, urlLink, rotation = 0) {
    const screenScale = { x: 20, y: 12, z: 0.5 };
    const frameScale = { x: 22, y: 14, z: 1 };
    
    const loader = new THREE.TextureLoader(manager);
    
    // Create frame material
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    
    // Create the frame
    const frame = new THREE.Mesh(
      new THREE.BoxBufferGeometry(frameScale.x, frameScale.y, frameScale.z),
      frameMaterial
    );
    
    // Create screen material that will be updated with slideshow
    const screenMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: false
    });
    
    // Create the screen
    const screen = new THREE.Mesh(
      new THREE.BoxBufferGeometry(screenScale.x, screenScale.y, screenScale.z),
      screenMaterial
    );
    
    // Position the screen
    screen.position.x = x;
    screen.position.y = y;
    screen.position.z = z;
    
    // Position the frame slightly behind the screen
    frame.position.x = x;
    frame.position.y = y;
    frame.position.z = z - 0.3;
    
    // Rotate both screen and frame
    screen.rotation.y = rotation;
    frame.rotation.y = rotation;
    
    // Enable shadows
    screen.castShadow = true;
    screen.receiveShadow = true;
    frame.castShadow = true;
    frame.receiveShadow = true;
    
    // Add URL data for clicking - removed to make projector non-clickable
    // screen.userData = { URL: urlLink };
    
    // Add to scene
    scene.add(screen);
    scene.add(frame);
    
    // Add physics
    addRigidPhysics(screen, screenScale);
    addRigidPhysics(frame, frameScale);
    
    // Create slideshow functionality
    let currentImageIndex = 0;
    const imagePaths = [
      '/src/jsm/Big Data Images/IMG_1980.jpg',
      '/src/jsm/Big Data Images/IMG_1992.jpg',
      '/src/jsm/Big Data Images/IMG_1996.jpg',
      '/src/jsm/Big Data Images/IMG_2003.jpg',
      '/src/jsm/Big Data Images/IMG_2027.jpg',
      '/src/jsm/Big Data Images/IMG_2036.jpg',
      '/src/jsm/Big Data Images/IMG_2040.jpg',
      '/src/jsm/Big Data Images/IMG_2045.jpg',
      '/src/jsm/Big Data Images/IMG_2083 2.jpg',
      '/src/jsm/Big Data Images/IMG_2084.jpg',
      '/src/jsm/Big Data Images/IMG_2085.jpg'
    ];
    
    // Load first image with high quality settings
    loader.load(imagePaths[0], (texture) => {
      // Set high quality texture filtering
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.flipY = true;
      
      screenMaterial.map = texture;
      screenMaterial.needsUpdate = true;
    });
    
    // Slideshow timer - change image every 3 seconds
    setInterval(() => {
      currentImageIndex = (currentImageIndex + 1) % imagePaths.length;
      loader.load(imagePaths[currentImageIndex], (texture) => {
        // Set high quality texture filtering for each image
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.flipY = true;
        
        screenMaterial.map = texture;
        screenMaterial.needsUpdate = true;
      });
    }, 3000);
    
    // Don't add to hover objects to prevent cursor interaction
    // cursorHoverObjects.push(screen);
  }

  //create X axis wall around entire plane
  function createWallX(x, y, z) {
    const wallScale = { x: 0.125, y: 4, z: 250 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
  }

  //create Z axis wall around entire plane
  function createWallZ(x, y, z) {
    const wallScale = { x: 250, y: 4, z: 0.125 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
  }



  function createTriangle(x, z) {
    var geom = new THREE.Geometry();
    var v1 = new THREE.Vector3(4, 0, 0);
    var v2 = new THREE.Vector3(5, 0, 0);
    var v3 = new THREE.Vector3(4.5, 1, 0);

    geom.vertices.push(v1);
    geom.vertices.push(v2);
    geom.vertices.push(v3);

    geom.faces.push(new THREE.Face3(0, 1, 2));
    geom.computeFaceNormals();

    var mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mesh.rotation.x = -Math.PI * 0.5;
    //mesh.rotation.z = -90;
    mesh.position.y = 0.01;
    mesh.position.x = x;
    mesh.position.z = z;
    scene.add(mesh);
  }


  // Load and create the animated astronaut model
  function createSciFiWorker(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/animated_astronaut_character_in_space_suit_loop.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to stand upright (rotate around X-axis)
      model.rotation.x = 0;
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics if needed (optional - comment out if not needed)
      // addRigidPhysics(model, { x: 2, y: 4, z: 2 });
      
      console.log('Animated astronaut GLB model loaded successfully');
    }, (progress) => {
      console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading animated astronaut GLB model:', error);
    });
  }

  // Load and create the manta spaceship model
  function createMantaSpaceship(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/manta_spaceship.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // -90 degrees to lay flat on ground
      model.rotation.y = (60 * Math.PI) / 180; // 180 degrees to face forward
      model.rotation.z = 0; // 135 degrees rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the spaceship (static object)
      addRigidPhysics(model, { x: 8, y: 3, z: 12 });
      
      console.log('Manta spaceship GLB model loaded successfully');
    }, (progress) => {
      console.log('Manta spaceship loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading manta spaceship GLB model:', error);
    });
  }

  // Load and create the DSS Harbinger Battle Cruiser model
  function createDSSHarbinger(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/cargo_spaceship.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground and face the correct direction
      model.rotation.x = 0; // -90 degrees to lay flat on ground
      model.rotation.y = -(120 * Math.PI) / 180; // Face forward (no rotation around Y-axis)
      model.rotation.z = 0;  // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the battle cruiser (static object)
      addRigidPhysics(model, { x: 10, y: 4, z: 15 });
      
      console.log('DSS Harbinger Battle Cruiser GLB model loaded successfully');
    }, (progress) => {
      console.log('DSS Harbinger loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading DSS Harbinger Battle Cruiser GLB model:', error);
    });
  }

  // Load and create the sci-fi personal space pod model
  function createSciFiPersonalSpacePod(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/sci-fi_personal_space_pod_shipweekly_challenge.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = -Math.PI / 2; // -90 degrees to lay flat on ground
      model.rotation.y = 0 // Face forward
      model.rotation.z = (150 * Math.PI) / 180;; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the space pod (static object)
      addRigidPhysics(model, { x: 3, y: 2, z: 4 });
      
      console.log('Sci-fi Personal Space Pod GLB model loaded successfully');
    }, (progress) => {
      console.log('Sci-fi Personal Space Pod loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Sci-fi Personal Space Pod GLB model:', error);
    });
  }

  // Load and create the UFO model
  function createUFO(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/ufov2.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // -90 degrees to lay flat on ground
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the UFO (static object)
      addRigidPhysics(model, { x: 2, y: 1, z: 2 });
      
      console.log('UFO GLB model loaded successfully');
    }, (progress) => {
      console.log('UFO loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading UFO GLB model:', error);
    });
  }

  // Load and create the Jedi Star Fighter model
  function createJediStarFighter(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/jedi_star_fighter.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = Math.PI; // -90 degrees to lay flat on ground
      model.rotation.y = (120 * Math.PI) / 180; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the star fighter (static object)
      addRigidPhysics(model, { x: 3, y: 1.5, z: 4 });
      
      console.log('Jedi Star Fighter GLB model loaded successfully');
    }, (progress) => {
      console.log('Jedi Star Fighter loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Jedi Star Fighter GLB model:', error);
    });
  }

  // Load and create the light fighter spaceship model
  function createLightFighterSpaceship(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/light_fighter_spaceship_-_free_-.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = Math.PI; // -90 degrees to lay flat on ground
      model.rotation.y = (120 * Math.PI) / 180; // Face forward
      model.rotation.z = Math.PI; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the light fighter (static object)
      addRigidPhysics(model, { x: 4, y: 2, z: 6 });
      
      console.log('Light Fighter Spaceship GLB model loaded successfully');
    }, (progress) => {
      console.log('Light Fighter Spaceship loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Light Fighter Spaceship GLB model:', error);
    });
  }

  // Load and create the blackhole model
  function createBlackhole(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/blackhole.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to face forward
      model.rotation.y = Math.PI; // 180 degrees to face forward
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the blackhole (static object)
      addRigidPhysics(model, { x: 15, y: 15, z: 15 });
      
      console.log('Blackhole GLB model loaded successfully');
    }, (progress) => {
      console.log('Blackhole loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading blackhole GLB model:', error);
    });
  }

  function createBigBlackhole(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/blackhole.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to face forward
      model.rotation.y = Math.PI; // 180 degrees to face forward
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the blackhole (static object)
      addRigidPhysics(model, { x: 15, y: 15, z: 15 });
      
      console.log('Blackhole GLB model loaded successfully');
    }, (progress) => {
      console.log('Blackhole loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading blackhole GLB model:', error);
    });
  }

  // Create a 3D waving flag on a pole with custom texture
  function createWavingFlag(x, y, z, flagWidth = 8, flagHeight = 5, poleHeight = 12, texturePath = null, institutionName = '') {
    // Create flag pole
    const poleGeometry = new THREE.CylinderBufferGeometry(0.1, 0.1, poleHeight, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xC0C0C0, // Silver/gray color
      metalness: 0.8,
      roughness: 0.2
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + poleHeight / 2, z);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);

    // Add physics to pole
    addRigidPhysics(pole, { x: 0.2, y: poleHeight, z: 0.2 });

    // Create flag geometry with wave effect
    const flagSegments = 20; // Number of segments for wave effect
    const flagGeometry = new THREE.PlaneBufferGeometry(flagWidth, flagHeight, flagSegments, 1);
    
    // Create flag material
    const flagMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      metalness: 0.1,
      roughness: 0.3
    });

    // Load custom texture if provided
    if (texturePath) {
      const loader = new THREE.TextureLoader(manager);
      const flagTexture = loader.load(texturePath);
      flagTexture.wrapS = THREE.ClampToEdgeWrapping;
      flagTexture.wrapT = THREE.ClampToEdgeWrapping;
      flagTexture.minFilter = THREE.LinearFilter;
      flagTexture.magFilter = THREE.LinearFilter;
      flagMaterial.map = flagTexture;
    } else {
      // Default pattern if no texture provided
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      // Create a simple pattern
      ctx.fillStyle = '#1E90FF';
      ctx.fillRect(0, 0, 256, 128);
      
      // Add some stars or pattern
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★', 64, 40);
      ctx.fillText('★', 192, 40);
      ctx.fillText('★', 128, 80);
      
      const flagTexture = new THREE.CanvasTexture(canvas);
      flagMaterial.map = flagTexture;
    }
    
    flagMaterial.needsUpdate = true;

    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(x + flagWidth / 2, y + poleHeight - 1, z + 0.5); // Moved flag 2 units forward
    flag.castShadow = true;
    flag.receiveShadow = true;
    
    // Store original vertices for wave animation
    flag.userData.originalVertices = flagGeometry.attributes.position.array.slice();
    flag.userData.waveTime = 0;
    flag.userData.waveSpeed = 0.03; // Reduced speed for gentler movement
    flag.userData.waveAmplitude = 0.3; // Reduced amplitude for less waviness
    flag.userData.institutionName = institutionName;
    
    scene.add(flag);

    // Add physics to flag (smaller collision box)
    addRigidPhysics(flag, { x: flagWidth, y: flagHeight, z: 0.1 });

    return { pole, flag };
  }

  // Animate the waving flag
  function animateWavingFlag(flag) {
    if (!flag.userData.originalVertices) return;
    
    const vertices = flag.geometry.attributes.position.array;
    const originalVertices = flag.userData.originalVertices;
    const time = flag.userData.waveTime;
    const amplitude = flag.userData.waveAmplitude;
    const speed = flag.userData.waveSpeed;
    
    // Update wave time
    flag.userData.waveTime += speed;
    
    // Apply wave effect to vertices
    for (let i = 0; i < vertices.length; i += 3) {
      const x = originalVertices[i];
      const y = originalVertices[i + 1];
      const z = originalVertices[i + 2];
      
      // Create wave effect based on x position and time
      const waveOffset = Math.sin(x * 0.5 + time) * amplitude;
      
      vertices[i] = x; // Keep original x
      vertices[i + 1] = y; // Keep original y
      vertices[i + 2] = z + waveOffset; // Apply wave to z
    }
    
    flag.geometry.attributes.position.needsUpdate = true;
    flag.geometry.computeVertexNormals();
  }

  // Load and create the time machine model
  function createTimeMachine(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/time_portal_-_steampunk.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the time machine (static object)
      addRigidPhysics(model, { x: 3, y: 2, z: 3 });
      
      console.log('Time Machine GLB model loaded successfully');
    }, (progress) => {
      console.log('Time Machine loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Time Machine GLB model:', error);
    });
  }

  // Load and create the badminton model
  function createBadminton(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/badminton.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the badminton (static object)
      addRigidPhysics(model, { x: 2, y: 1, z: 2 });
      
      console.log('Badminton GLB model loaded successfully');
    }, (progress) => {
      console.log('Badminton loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Badminton GLB model:', error);
    });
  }

  // Load and create the Cristiano Ronaldo model
  function createCristianoRonaldo(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/cristiano_ronaldo_of_the_portugalia.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the Cristiano Ronaldo model (static object)
      addRigidPhysics(model, { x: 2, y: 3, z: 2 });
      
      console.log('Cristiano Ronaldo GLB model loaded successfully');
    }, (progress) => {
      console.log('Cristiano Ronaldo loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Cristiano Ronaldo GLB model:', error);
    });
  }

  // Load and create the Yamaha Keyboard model
  function createYamahaKeyboard(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/yamaha_keyboard.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = -(Math.PI * 45) / 180; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the keyboard (static object)
      addRigidPhysics(model, { x: 3, y: 1, z: 1 });
      
      console.log('Yamaha Keyboard GLB model loaded successfully');
    }, (progress) => {
      console.log('Yamaha Keyboard loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Yamaha Keyboard GLB model:', error);
    });
  }

  // Load and create the Bowling Ball and Pin model
  function createBowlingBallAndPin(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/bowling_ball_and_pin.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the bowling set (static object)
      addRigidPhysics(model, { x: 2, y: 2, z: 2 });
      
      console.log('Bowling Ball and Pin GLB model loaded successfully');
    }, (progress) => {
      console.log('Bowling Ball and Pin loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Bowling Ball and Pin GLB model:', error);
    });
  }

  // Load and create the Gym Weights model
  function createGymWeights(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/gym_weights_-_game_asset.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the gym weights (static object)
      addRigidPhysics(model, { x: 2, y: 1, z: 2 });
      
      console.log('Gym Weights GLB model loaded successfully');
    }, (progress) => {
      console.log('Gym Weights loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Gym Weights GLB model:', error);
    });
  }

  // Load and create the Cricket Set model
  function createCricketSet(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/cricket_set.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the cricket set (static object)
      addRigidPhysics(model, { x: 4, y: 2, z: 4 });
      
      console.log('Cricket Set GLB model loaded successfully');
    }, (progress) => {
      console.log('Cricket Set loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Cricket Set GLB model:', error);
    });
  }

  // Load and create the PlayStation 5 Set model
  function createPlayStation5Set(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/playstation_5_set.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the PlayStation 5 set (static object)
      addRigidPhysics(model, { x: 2, y: 1, z: 2 });
      
      console.log('PlayStation 5 Set GLB model loaded successfully');
    }, (progress) => {
      console.log('PlayStation 5 Set loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading PlayStation 5 Set GLB model:', error);
    });
  }

  // Load and create the Iron Man model
  function createIronMan(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/iron_man.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the Iron Man model (static object)
      addRigidPhysics(model, { x: 2, y: 3, z: 2 });
      
      console.log('Iron Man GLB model loaded successfully');
    }, (progress) => {
      console.log('Iron Man loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Iron Man GLB model:', error);
    });
  }

  // Load and create the Amazing Spider-Man 2 model
  function createAmazingSpiderMan2(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/the_amazing_spider_man_2_rigged_model.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = (Math.PI * 45) / 180; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the Spider-Man model (static object)
      addRigidPhysics(model, { x: 2, y: 3, z: 2 });
      
      console.log('Amazing Spider-Man 2 GLB model loaded successfully');
    }, (progress) => {
      console.log('Amazing Spider-Man 2 loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Amazing Spider-Man 2 GLB model:', error);
    });
  }

  // Load and create the Nissan Skyline GTR R35 model
  function createNissanSkylineGTR(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/nissan_gtr_legendary_nfs__www.vecarz.com.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = Math.PI * 45 / 180; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the Nissan Skyline (static object)
      addRigidPhysics(model, { x: 4, y: 2, z: 8 });
      
      console.log('Nissan Skyline GTR R35 GLB model loaded successfully');
    }, (progress) => {
      console.log('Nissan Skyline GTR R35 loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Nissan Skyline GTR R35 GLB model:', error);
    });
  }

  // Load and create the Oracle Red Bull F1 Car RB19 2023 model
  function createOracleRedBullF1RB19(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/oracle_red_bull_f1_car_rb19_2023.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = -(Math.PI * 45) / 180; // Face forward position
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the F1 car (static object)
      addRigidPhysics(model, { x: 3, y: 1, z: 6 });
      
      console.log('Oracle Red Bull F1 Car RB19 2023 GLB model loaded successfully');
    }, (progress) => {
      console.log('Oracle Red Bull F1 Car RB19 2023 loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Oracle Red Bull F1 Car RB19 2023 GLB model:', error);
    });
  }

  // Load and create the Classic Ganesh DDO Painted model
  function createClassicGaneshDDO(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/classic_ganesh_ddo_painted.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the Ganesh model (static object)
      addRigidPhysics(model, { x: 2, y: 3, z: 2 });
      
      console.log('Classic Ganesh DDO Painted GLB model loaded successfully');
    }, (progress) => {
      console.log('Classic Ganesh DDO Painted loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Classic Ganesh DDO Painted GLB model:', error);
    });
  }

  // Load and create the Football model
  function createFootball(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/football.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the football (static object)
      addRigidPhysics(model, { x: 1, y: 1, z: 1 });
      
      console.log('Football GLB model loaded successfully');
    }, (progress) => {
      console.log('Football loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Football GLB model:', error);
    });
  }

  // Load and create the Thing Hand from Wednesday Addams model
  function createThingHandWednesday(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/thing_hand_from_serial_wednesdays_addams.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the Thing hand (static object)
      addRigidPhysics(model, { x: 1, y: 1, z: 1 });
      
      console.log('Thing Hand from Wednesday Addams GLB model loaded successfully');
    }, (progress) => {
      console.log('Thing Hand from Wednesday Addams loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Thing Hand from Wednesday Addams GLB model:', error);
    });
  }

  // Load and create the Karom model
  function createKarom(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/karom.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the karom (static object)
      addRigidPhysics(model, { x: 2, y: 1, z: 2 });
      
      console.log('Karom GLB model loaded successfully');
    }, (progress) => {
      console.log('Karom loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Karom GLB model:', error);
    });
  }

  // Load and create the Earth model
  function createEarth(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/earth.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model on the ground
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add continuous rotation animation
      model.userData.rotationSpeed = 0.005; // Rotation speed around Y-axis
      
      // Add physics for the earth (static object)
      addRigidPhysics(model, { x: 3, y: 3, z: 3 });
      
      console.log('Earth GLB model loaded successfully');
    }, (progress) => {
      console.log('Earth loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Earth GLB model:', error);
    });
  }

  // Load and create the Dancing Alien model
  function createDancingAlien(x, y, z, scale = 1) {
    const loader = new GLTFLoader();
    
    loader.load('./src/models/dancing_alien.glb', (gltf) => {
      const model = gltf.scene;
      
      // Position the model on the ground
      model.position.set(x, y, z);
      model.scale.setScalar(scale);
      
      // Rotate the model to be flat on the ground
      model.rotation.x = 0; // No rotation around X-axis
      model.rotation.y = 0; // Face forward
      model.rotation.z = 0; // No rotation around Z-axis
      
      // Enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Add to scene
      scene.add(model);
      
      // Handle animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Store mixer for animation updates
        model.userData.mixer = mixer;
      }
      
      // Add physics for the dancing alien (static object)
      addRigidPhysics(model, { x: 2, y: 3, z: 2 });
      
      console.log('Dancing Alien GLB model loaded successfully');
    }, (progress) => {
      console.log('Dancing Alien loading progress:', (progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('Error loading Dancing Alien GLB model:', error);
    });
  }

  // Create a simple image plane without a box
  function createImagePlane(x, y, z, textureImage, urlLink, width = 4, height = 4, rotation = 0) {
    const loader = new THREE.TextureLoader(manager);
    
    // Load the texture
    const texture = loader.load(textureImage);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    
    // Create material for the image
    const imageMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create plane geometry
    const planeGeometry = new THREE.PlaneGeometry(width, height);
    
    // Create the image plane mesh
    const imagePlane = new THREE.Mesh(planeGeometry, imageMaterial);
    
    // Position the image
    imagePlane.position.set(x, y, z);
    imagePlane.rotation.y = rotation;
    
    // Enable shadows
    imagePlane.castShadow = true;
    imagePlane.receiveShadow = true;
    
    // Add URL data for clicking
    imagePlane.userData = { URL: urlLink };
    
    // Add to scene
    scene.add(imagePlane);
    
    // Add to hover objects for cursor interaction
    cursorHoverObjects.push(imagePlane);
    
    console.log('Image plane created successfully');
  }

  // Global carousel variables
  let toolCarousel = {
    currentIndex: 0,
    images: [],
    imagePlane: null,
    leftArrow: null,
    rightArrow: null
  };

  // Create interactive tool carousel
  function createToolCarousel(x, y, z, width = 4, height = 4) {
    // Define the tool images array with individual sizes
    const toolImages = [
      { texture: toolTexture.Java, name: 'Java', width: 4, height: 4 },
      { texture: toolTexture.Python, name: 'Python', width: 5, height: 5 },
      { texture: toolTexture.Javascript, name: 'JavaScript', width: 4, height: 4 },
      { texture: toolTexture.React, name: 'React', width: 4, height: 4 },
      { texture: toolTexture.Html, name: 'HTML', width: 4, height: 4 },
      { texture: toolTexture.Css, name: 'CSS', width: 4, height: 4 },
      { texture: toolTexture.Flutter, name: 'Flutter', width: 4, height: 4 },
      { texture: toolTexture.Firebase, name: 'Firebase', width: 5.5, height: 5.5 },
      { texture: toolTexture.Figma, name: 'Figma', width: 4, height: 4 },
      { texture: toolTexture.Swift, name: 'Swift', width: 4, height: 4 },
      { texture: toolTexture.Git, name: 'Git', width: 4, height: 4 },
      { texture: toolTexture.Photoshop, name: 'Photoshop', width: 4, height: 4 },

    ];

    toolCarousel.images = toolImages;

    // Create the main image plane with initial size
    const loader = new THREE.TextureLoader(manager);
    const initialTexture = loader.load(toolImages[0].texture);
    initialTexture.magFilter = THREE.LinearFilter;
    initialTexture.minFilter = THREE.LinearFilter;
    initialTexture.encoding = THREE.sRGBEncoding;

    const imageMaterial = new THREE.MeshBasicMaterial({
      map: initialTexture,
      transparent: true,
      side: THREE.DoubleSide
    });

    // Use the first image's individual size
    const initialImage = toolImages[0];
    const planeGeometry = new THREE.PlaneGeometry(initialImage.width, initialImage.height);
    toolCarousel.imagePlane = new THREE.Mesh(planeGeometry, imageMaterial);
    toolCarousel.imagePlane.position.set(x, y, z);
    toolCarousel.imagePlane.castShadow = true;
    toolCarousel.imagePlane.receiveShadow = true;
    toolCarousel.imagePlane.userData = { 
      URL: URL.behance,
      noAnimation: true  // Disable hover animations
    };

    scene.add(toolCarousel.imagePlane);
    cursorHoverObjects.push(toolCarousel.imagePlane);

    // Create 3D left arrow button (dark gray color)
    create3DArrow(x - 4, y, z + 4, 'left', 1.5, 0xffffff);
    
    // Create 3D right arrow button (dark gray color)
    create3DArrow(x + 4, y, z + 4, 'right', 1.5, 0xffffff);

    console.log('Tool carousel created successfully');
  }

  // Create 3D arrow button
  function create3DArrow(x, y, z, direction, scale = 1, color = 0x00ff00) {
    // Create triangular prism using ExtrudeGeometry with beveled edges
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, 0.5);      // Top point
    triangleShape.lineTo(-0.5, -0.5);  // Bottom left
    triangleShape.lineTo(0.5, -0.5);   // Bottom right
    triangleShape.lineTo(0, 0.5);      // Back to top
    
    const extrudeSettings = {
      depth: 0.3,        // Thickness of the triangle
      bevelEnabled: true,
      bevelThickness: 0.05,  // Bevel thickness for 3D effect
      bevelSize: 0.02,       // Bevel size for clean edges
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 8
    };
    
    const arrowGeometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);
    
    // Use MeshPhongMaterial to match the 3D section title style
    const arrowMaterials = [
      new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: 0x000000,
        emissiveIntensity: 0,
        shininess: 100,
        specular: 0x222222
      }), // front
      new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: 0x000000,
        emissiveIntensity: 0,
        shininess: 100,
        specular: 0x222222
      }), // side
    ];

    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterials);
    arrow.position.set(x, y, z);
    arrow.scale.setScalar(scale);
    
    // Rotate arrow based on direction
    if (direction === 'left') {
      arrow.rotation.z = Math.PI / 2; // Point left
    } else if (direction === 'right') {
      arrow.rotation.z = -Math.PI / 2; // Point right
    }

    arrow.castShadow = true;
    arrow.receiveShadow = true;
    arrow.userData = { 
      isArrow: true, 
      direction: direction,
      clickable: true,
      noAnimation: true  // Disable hover animations
    };

    scene.add(arrow);
    cursorHoverObjects.push(arrow);

    // Store arrow reference
    if (direction === 'left') {
      toolCarousel.leftArrow = arrow;
    } else {
      toolCarousel.rightArrow = arrow;
    }

    console.log(`${direction} arrow created successfully`);
  }

  // Update carousel image
  function updateCarouselImage() {
    if (!toolCarousel.imagePlane || !toolCarousel.images.length) return;

    const loader = new THREE.TextureLoader(manager);
    const currentImage = toolCarousel.images[toolCarousel.currentIndex];
    
    loader.load(currentImage.texture, (texture) => {
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;
      
      // Update the geometry to match the new image's size
      const newGeometry = new THREE.PlaneGeometry(currentImage.width, currentImage.height);
      toolCarousel.imagePlane.geometry.dispose(); // Dispose old geometry
      toolCarousel.imagePlane.geometry = newGeometry;
      
      // Update the material with new texture
      toolCarousel.imagePlane.material.map = texture;
      toolCarousel.imagePlane.material.needsUpdate = true;
      
      console.log(`Carousel updated to show: ${currentImage.name} (${currentImage.width}x${currentImage.height})`);
    });
  }

  // Navigate carousel
  function navigateCarousel(direction) {
    if (!toolCarousel.images.length) return;

    if (direction === 'left') {
      toolCarousel.currentIndex = (toolCarousel.currentIndex - 1 + toolCarousel.images.length) % toolCarousel.images.length;
    } else if (direction === 'right') {
      toolCarousel.currentIndex = (toolCarousel.currentIndex + 1) % toolCarousel.images.length;
    }

    updateCarouselImage();
  }

  //generic function to add physics to Mesh with scale
  function addRigidPhysics(item, itemScale) {
    let pos = { x: item.position.x, y: item.position.y, z: item.position.z };
    let scale = { x: itemScale.x, y: itemScale.y, z: itemScale.z };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

    var localInertia = new Ammo.btVector3(0, 0, 0);
    var motionState = new Ammo.btDefaultMotionState(transform);
    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);
    colShape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    body.setActivationState(STATE.DISABLE_DEACTIVATION);
    body.setCollisionFlags(2);
    physicsWorld.addRigidBody(body);
  }


  // Keyboard event handler for carousel navigation
  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      navigateCarousel('left');
    } else if (event.key === 'ArrowRight') {
      navigateCarousel('right');
    }
  }

  // Mouse drag functions for ball movement
  function handleMouseDown(event) {
    if (event.button === 0) { // Left mouse button
      isDragging = true;
      dragStartPosition = {
        x: event.clientX,
        y: event.clientY
      };
      document.body.style.cursor = 'grabbing';
    }
  }

  function handleMouseMove(event) {
    if (isDragging && ballObject) {
      const currentMousePos = {
        x: event.clientX,
        y: event.clientY
      };
      
      // Calculate mouse movement delta
      const deltaX = (currentMousePos.x - dragStartPosition.x) * 0.01;
      const deltaZ = (currentMousePos.y - dragStartPosition.y) * 0.01; // Fixed Y direction
      
      // Apply drag force to ball
      const dragForce = 4; // Reduced drag sensitivity for slower movement
      const physicsBody = ballObject.userData.physicsBody;
      
      if (physicsBody) {
        const currentVelocity = physicsBody.getLinearVelocity();
        const newVelocity = new Ammo.btVector3(
          deltaX * dragForce,
          currentVelocity.y(), // Keep Y velocity for gravity
          deltaZ * dragForce
        );
        physicsBody.setLinearVelocity(newVelocity);
      }
    }
  }

  function handleMouseUp(event) {
    if (event.button === 0) { // Left mouse button
      isDragging = false;
      dragStartPosition = null;
      document.body.style.cursor = 'default';
    }
  }

  function moveBall() {
    let scalingFactor = 40; // Increased from 30 to 50 for faster movement
    let moveX = moveDirection.right - moveDirection.left;
    let moveZ = moveDirection.back - moveDirection.forward;
    let moveY = 0;

    // Handle jumping
    if (shouldJump && ballObject.position.y < 2.01) {
      moveY = 15; // Jump force
    } else if (ballObject.position.y < 2.01) {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = 0;
    } else {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = -0.25;
    }

    // no movement
    if (moveX == 0 && moveY == 0 && moveZ == 0) return;

    let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ);
    resultantImpulse.op_mul(scalingFactor);
    let physicsBody = ballObject.userData.physicsBody;
    physicsBody.setLinearVelocity(resultantImpulse);
  }

  function renderFrame() {
    // FPS stats module
    stats.begin();

    const elapsedTime = galaxyClock.getElapsedTime() + 150;

    let deltaTime = clock.getDelta();
    if (!isTouchscreenDevice())
      if (document.hasFocus()) {
        moveBall();
      } else {
        moveDirection.forward = 0;
        moveDirection.back = 0;
        moveDirection.left = 0;
        moveDirection.right = 0;
      }
    else {
      moveBall();
    }

    updatePhysics(deltaTime);

    moveParticles();
    
    // Update planet orbits
    updatePlanetOrbits();
    
    // Update hover animations
    updateHoverAnimations();
    
    // Update sci-fi worker animations
    scene.traverse((object) => {
      if (object.userData.mixer) {
        object.userData.mixer.update(deltaTime);
      }
      
      // Rotate earth model continuously
      if (object.userData.rotationSpeed !== undefined) {
        object.rotation.y += object.userData.rotationSpeed;
      }
      
      // Animate waving flags
      if (object.userData.originalVertices && object.userData.waveTime !== undefined) {
        animateWavingFlag(object);
      }
    });

    renderer.render(scene, camera);
    stats.end();

    galaxyMaterial.uniforms.uTime.value = elapsedTime * 5;
    //galaxyPoints.position.set(-50, -50, 0);

    // tells browser theres animation, update before the next repaint
    requestAnimationFrame(renderFrame);
  }

  //loading page section
  function startButtonEventListener() {
    for (let i = 0; i < fadeOutDivs.length; i++) {
      fadeOutDivs[i].classList.add('fade-out');
    }
    setTimeout(() => {
      document.getElementById('preload-overlay').style.display = 'none';
    }, 750);

    startButton.removeEventListener('click', startButtonEventListener);
    document.addEventListener('click', launchClickPosition);
    createAllPlanets();
    createFallButton();

    // Expose functions globally for button interaction
    window.makePlanetsFall = makePlanetsFall;
    window.resetPlanets = resetPlanets;
    window.navigateCarousel = navigateCarousel;

    // Add mouse drag event listeners for ball movement
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add keyboard event listener for carousel navigation
    document.addEventListener('keydown', handleKeyDown);

    setTimeout(() => {
      document.addEventListener('mousemove', launchHover);
    }, 1000);
  }

  // (Removed) AKSHAYAN letter collision/reset logic

  function updatePhysics(deltaTime) {
    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // (Removed) ball-letter collisions

    // Update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
      let objThree = rigidBodies[i];
      let objAmmo = objThree.userData.physicsBody;
      let ms = objAmmo.getMotionState();
      if (ms) {
        ms.getWorldTransform(tmpTrans);
        let p = tmpTrans.getOrigin();
        let q = tmpTrans.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }

    //check to see if ball escaped the plane
    if (ballObject.position.y < -50) {
      scene.remove(ballObject);
      createBall();
      // (Removed) reset letters when ball respawns
    }

    //check to see if ball is on text to rotate camera
    rotateCamera(ballObject);
  }

  //document loading
  manager.onStart = function (item, loaded, total) {
    //console.log("Loading started");
  };

  manager.onLoad = function () {
    var readyStateCheckInterval = setInterval(function () {
      if (document.readyState === 'complete') {
        clearInterval(readyStateCheckInterval);
        
        // Add extra delay to ensure smooth performance
        setTimeout(() => {
          for (let i = 0; i < preloadDivs.length; i++) {
            preloadDivs[i].style.visibility = 'hidden'; // or
            preloadDivs[i].style.display = 'none';
          }
          for (let i = 0; i < postloadDivs.length; i++) {
            postloadDivs[i].style.visibility = 'visible'; // or
            postloadDivs[i].style.display = 'block';
          }
          
          // Mark scene as fully loaded
          window.sceneLoadingComplete = true;
          
          // Attach event listener after button becomes visible
          if (startButton) {
            startButton.addEventListener('click', startButtonEventListener);
          }
        }, 3000); // Increased delay for smoother loading
      }
    }); // Increased interval check time
    //console.log("Loading complete");
  };

  manager.onError = function (url) {
    //console.log("Error loading");
  };


  if (isTouchscreenDevice()) {
    document.getElementById('appDirections').innerHTML = '';
    createJoystick(document.getElementById('joystick-wrapper'));
    document.getElementById('joystick-wrapper').style.visibility = 'visible';
    document.getElementById('joystick').style.visibility = 'visible';
  }

  //initialize world and begin
  function start() {
    createWorld();
    createPhysicsWorld();

    createGridPlane();
    createBall();

    createWallX(125, 1.75, 0);
    createWallX(-125, 1.75, 0);
    createWallZ(0, 1.75, 125);
    createWallZ(0, 1.75, -125);

    // Add project texts in single straight column layout

    // Projects Section Title - 3D
    create3DSectionTitle('PROJECTS', -71.5, 2, -105, 3.0, 3.0);

    // Project 1
    leftAlignedText(-80, 1.5, -95, 'Cruise Ship Boarding System', 1.5);
    // Info icon for Cruise Ship Boarding System
    createInfoIcon(-76.5, 1.5, -95, 'proj_cruise');
    leftAlignedText(-80, 0.01, -95, 'Cruise Ship Boarding System', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -91, 'A Java console program that manages cabin assignments and passenger data for a cruise ship.', 0.8);
    leftAlignedText(-80, 0.01, -89, 'Includes features for adding, viewing, and sorting passengers using a circular queue.', 0.8);

    // Project 2
    leftAlignedText(-80, 1.5, -83, 'Skin Consultation Management System', 1.5);
    // Info icon for Skin Consultation Management System
    createInfoIcon(-76.5, 1.5, -83, 'proj_skin');
    leftAlignedText(-80, 0.01, -83, 'Skin Consultation Management System', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -79, 'A Java application with both console and GUI interfaces to manage doctors, patients, and', 0.8);
    leftAlignedText(-80, 0.01, -77, 'consultations in a dermatology clinic. Features file-based data persistence and encryption.', 0.8);

    // Project 3
    leftAlignedText(-80, 1.5, -71, 'Tripper – A Tourism Website', 1.5);
    // Info icon for Tripper website
    createInfoIcon(-76.5, 1.5, -71, 'proj_tripper');
    leftAlignedText(-80, 0.01, -71, 'Tripper – A Tourism Website', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -67, 'A dynamic web application created using HTML, CSS, and JavaScript that allows users to explore destinations and', 0.8);
    leftAlignedText(-80, 0.01, -65, 'purchase travel-related products. Features engaging UI design and modern front-end development practices.', 0.8);

    // Project 4
    leftAlignedText(-80, 1.5, -59, 'Old Asteroids Arcade Game (Formal Specification)', 1.5);
    // Info icon for Old Asteroids Arcade Game
    createInfoIcon(-76.5, 1.5, -59, 'proj_asteroids');
    leftAlignedText(-80, 0.01, -59, 'Old Asteroids Arcade Game (Formal Specification)', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -55, 'A formal specification project using the B-Method to model and verify a simplified version of the', 0.8);
    leftAlignedText(-80, 0.01, -53, 'classic Asteroids game. Verified using Atelier B and ProB tools.', 0.8);

    // Project 5
    leftAlignedText(-80, 1.5, -47, 'Sliding Puzzles – Graph Acyclicity Checker', 1.5);
    // Info icon for Sliding Puzzles – Graph Acyclicity Checker
    createInfoIcon(-76.5, 1.5, -47, 'proj_sliding');
    leftAlignedText(-80, 0.01, -47, 'Sliding Puzzles – Graph Acyclicity Checker', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -43, 'A Java-based algorithmic project implementing the sink elimination algorithm to determine', 0.8);
    leftAlignedText(-80, 0.01, -41, 'whether a directed graph is acyclic. Handles graph data using adjacency lists.', 0.8);

    // Project 6
    leftAlignedText(-80, 1.5, -35, 'Weather Explorer & Tourist Guide App (SwiftUI)', 1.5);
    // Info icon for Weather Explorer & Tourist Guide App
    createInfoIcon(-76.5, 1.5, -35, 'proj_weather');
    leftAlignedText(-80, 0.01, -35, 'Weather Explorer & Tourist Guide App (SwiftUI)', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -31, 'An iOS app developed with SwiftUI that provides real-time weather updates and interactive tourist', 0.8);
    leftAlignedText(-80, 0.01, -29, 'maps. Integrates OpenWeatherMap API, CoreLocation, and MapKit for dynamic city-based updates.', 0.8);

    // Project 7
    leftAlignedText(-80, 1.5, -23, 'Student Progression Outcome Prediction System', 1.5);
    // Info icon for Student Progression Outcome Prediction System
    createInfoIcon(-76.5, 1.5, -23, 'proj_progression');
    leftAlignedText(-80, 0.01, -23, 'Student Progression Outcome Prediction System', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -19, 'A Python program that determines student progression outcomes based on their module credits.', 0.8);
    leftAlignedText(-80, 0.01, -17, 'Validates user input and calculates results such as "Progress" or "Exclude" with statistical summaries.', 0.8);

    // Project 8
    leftAlignedText(-80, 1.5, -11, 'Concurrent Ticketing System', 1.5);
    // Info icon for Concurrent Ticketing System
    createInfoIcon(-76.5, 1.5, -11, 'proj_concurrent');
    leftAlignedText(-80, 0.01, -11, 'Concurrent Ticketing System', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, -7, 'A multithreaded Java application designed to simulate passengers and technicians interacting with a shared', 0.8);
    leftAlignedText(-80, 0.01, -5, 'ticket machine. Built using Finite State Processes (FSP) and verified through the LTSA tool.', 0.8);

    // Project 9
    leftAlignedText(-80, 1.5, 1, 'Cricozy - Cricket Coaching Platform', 1.5);
    // Info icon for Cricozy - Cricket Coaching Platform
    createInfoIcon(-76.5, 1.5, 1, 'proj_cricozy');
    leftAlignedText(-80, 0.01, 1, 'Cricozy - Cricket Coaching Platform', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, 5, 'A cross-platform app built with Flutter, Python, and Firebase that delivers smart, personalized cricket', 0.8);
    leftAlignedText(-80, 0.01, 7, 'coaching. Uses machine learning to analyze player performance and enhance training.', 0.8);

    // Project 10
    leftAlignedText(-80, 1.5, 13, 'EpiDerm – Skin Disease Detection System', 1.5);
    // Info icon for EpiDerm – Skin Disease Detection System
    createInfoIcon(-76.5, 1.5, 13, 'proj_epiderm');
    leftAlignedText(-80, 0.01, 13, 'EpiDerm – Skin Disease Detection System', 1.5, 0x1a1a1a);
    leftAlignedText(-80, 0.01, 17, 'AI-powered mobile app that detects skin diseases from images.', 0.8);
    leftAlignedText(-80, 0.01, 19, 'Built with React, Firebase, and machine learning for fast, accurate results.', 0.8);

    // Work Experience Section - Right Side - 3D
    create3DSectionTitle('WORK EXPERIENCE', 72, 2, -50, 3.0, 3.0);
    
    // Experience 1 - Technical Lead at Mana Medical
    leftAlignedText(55, 1.5, -40, 'Technical Lead — Mana Medical', 1.2);
    // Info icon for Technical Lead — Mana Medical
    createInfoIcon(58.5, 1.5, -40, 'exp_mana');
    leftAlignedText(55, 0.01, -40, 'Technical Lead — Mana Medical', 1.2, 0x1a1a1a);
    leftAlignedText(55, 0.01, -37, 'Jan 2025 – Present | London, UK (Hybrid)', 1.0);
    leftAlignedText(55, 0.01, -34, 'Leading mobile application development using React Native and full-stack technologies.', 0.8);
    leftAlignedText(55, 0.01, -31, 'Overseeing technical architecture, code quality, and team coordination.', 0.8);

    // Experience 2 - Full-stack Developer at University of Westminster
    leftAlignedText(55, 1.5, -25, 'Full-stack Developer — University of Westminster', 1.2);
    // Info icon for Full-stack Developer — University of Westminster
    createInfoIcon(58.5, 1.5, -25, 'exp_westminster_dev');
    leftAlignedText(55, 0.01, -25, 'Full-stack Developer — University of Westminster', 1.2, 0x1a1a1a);
    leftAlignedText(55, 0.01, -22, 'Feb 2024 – May 2024 | London, UK (Hybrid)', 1.0);
    leftAlignedText(55, 0.01, -19, 'Developed and maintained Django-based web applications. Improved RoomView\'s front-end', 0.8);
    leftAlignedText(55, 0.01, -16, 'using HTML, CSS, and JavaScript, and documented system processes for the LIDE team.', 0.8);

    // Experience 3 - Software Quality Assurance Engineer at Dataintics
    leftAlignedText(55, 1.5, -10, 'Software Quality Assurance Engineer (Intern) — Dataintics', 1.2);
    // Info icon for Software QA Engineer — Dataintics
    createInfoIcon(58.5, 1.5, -10, 'exp_dataintics');
    leftAlignedText(55, 0.01, -10, 'Software Quality Assurance Engineer (Intern) — Dataintics', 1.2, 0x1a1a1a);
    leftAlignedText(55, 0.01, -7, 'May 2023 – Jul 2023 | Colombo, Sri Lanka (On-site)', 1.0);
    leftAlignedText(55, 0.01, -4, 'Performed quality assurance testing for the KoverUI insurance platform, ensuring', 0.8);
    leftAlignedText(55, 0.01, -1, 'software reliability and functionality.', 0.8);

    // Experience 4 - Editor at Students' Union
    leftAlignedText(55, 1.5, 5, 'Editor – Students\' Union 2022/23 — IIT', 1.2);
    // Info icon for Editor — Students' Union
    createInfoIcon(58.5, 1.5, 5, 'exp_editor_su');
    leftAlignedText(55, 0.01, 5, 'Editor – Students\' Union 2022/23 — IIT', 1.2, 0x1a1a1a);
    leftAlignedText(55, 0.01, 8, 'Oct 2022 – Sep 2023 | Colombo, Sri Lanka (On-site)', 1.0);
    leftAlignedText(55, 0.01, 11, 'Created and edited promotional materials for student events. Collaborated on marketing', 0.8);
    leftAlignedText(55, 0.01, 14, 'content and managed multiple design projects under tight deadlines.', 0.8);

    // Experience 5 - Director of Members at IEEE
    leftAlignedText(55, 1.5, 20, 'Director of Members — IEEE Student Branch, IIT', 1.2);
    // Info icon for Director of Members — IEEE
    createInfoIcon(58.5, 1.5, 20, 'exp_ieee_director');
    leftAlignedText(55, 0.01, 20, 'Director of Members — IEEE Student Branch, IIT', 1.2, 0x1a1a1a);
    leftAlignedText(55, 0.01, 23, 'Sep 2022 – Aug 2023 | Colombo, Sri Lanka (On-site)', 1.0);
    leftAlignedText(55, 0.01, 26, 'Led membership drives, improved volunteer engagement, and promoted IEEE initiatives', 0.8);
    leftAlignedText(55, 0.01, 29, 'through effective communication and leadership.', 0.8);

    // Work Experience Logos - 3D boxes positioned at the start of each title
    // Mana Medical logo at start of Technical Lead title
    createBox(52, 2, -40, 4, 4, 1, boxTexture.mana, '', 0xC4F5E8, true, true, 0.8); 
    
    // University of Westminster logo at start of Full-stack Developer title  
    createBox(52, 2, -25, 4, 4, 1, boxTexture.westminster, '', 0x000000, true, true, 0.8);
    
    // Dataintics logo at start of Software QA Engineer title
    createBox(52, 2, -10, 4, 4, 1, boxTexture.dataintics, '', 0xFFFFFF, true, true, 0.8);
    
    // Students Union logo at start of Editor title
    createBox(52, 2, 5, 4, 4, 1, boxTexture.studentUnion, '', 0xFFFFFF, true, true, 0.8);
    
    // IEEE logo at start of Director of Members title
    createBox(52, 2, 20, 4, 4, 1, boxTexture.ieee, '', 0xFFFFFF, true, true, 0.8);

    // Education Section - Right Side - 3D
    create3DSectionTitle('EDUCATION', -0.7, 2, -113, 3.0, 3.0);
    
    // Education 1 - University of Westminster
    leftAlignedText(-11.5, 1.0, -105, 'University of Westminster', 1.2);
    leftAlignedText(-11.5, 0.01, -105, 'University of Westminster', 1.2, 0x1a1a1a);
    // Add info icon for University of Westminster
    createInfoIcon(10, 1.0, -105, 'westminster');
    leftAlignedText(-11.5, 0.01, -102, 'BEng (Hons) Software Engineering', 1.0);
    leftAlignedText(-11.5, 0.01, -99, 'Sep 2021 – Jun 2024 | London, United Kingdom', 0.8);
    leftAlignedText(-11.5, 0.01, -96, 'Graduated with First Class Honours.', 0.8);
    leftAlignedText(-11.5, 0.01, -93, '', 0.8, 0x1a1a1a);

    // Education 2 - Informatics Institute of Technology
    leftAlignedText(-11.5, 1.0, -90, 'Informatics Institute of Technology (IIT Campus)', 1.2);
    leftAlignedText(-11.5, 0.01, -90, 'Informatics Institute of Technology (IIT Campus)', 1.2, 0x1a1a1a);
    // Add info icon for Informatics Institute of Technology
    createInfoIcon(25, 1.0, -90, 'iit');
    leftAlignedText(-11.5, 0.01, -87, 'BEng (Hons) Software Engineering (Affiliated with University of Westminster)', 1.0);
    leftAlignedText(-11.5, 0.01, -84, 'Sep 2021 – Aug 2023 | Colombo, Sri Lanka', 0.8);
    leftAlignedText(-11.5, 0.01, -81, 'Achieved First Class Honours.', 0.8);
    leftAlignedText(-11.5, 0.01, -78, '', 0.8);

    // Education 3 - S. Thomas' College
    leftAlignedText(-11.5, 1.0, -75, 'S. Thomas\' College, Mount Lavinia', 1.2);
    leftAlignedText(-11.5, 0.01, -75, 'S. Thomas\' College, Mount Lavinia', 1.2, 0x1a1a1a);
    // Add info icon for S. Thomas' College
    createInfoIcon(15, 1.0, -75, 'stc');
    leftAlignedText(-11.5, 0.01, -72, 'GCE Advanced Level – Physical Science Stream (A/L) | Jan 2018 – Aug 2020 | Grades: A, 2C', 1.0);
    leftAlignedText(-11.5, 0.01, -69, 'GCE Ordinary Level (O/L) | Jan 2007 – Dec 2017 | Grades: 8A, 1B', 1.0);

    const instagramGradient = 0xE1306C;
    
    createBox(70, 2, -90, 4, 4, 1, boxTexture.instagram, URL.instagram, instagramGradient, true, true, 0.8);

    createBox(78, 2, -80, 4, 4, 1, boxTexture.tiktok, URL.tiktok, 0x000000, true, true, 0.8);

    createBox(86, 2, -70, 4, 4, 1, boxTexture.linkedin, URL.linkedin, 0x0077b5, true, true, 0.8);
    
    createBox(94, 2, -70, 4, 4, 1, boxTexture.Github, URL.gitHub, 0x000000, true, true, 0.8);
    
    createBox(102, 2, -80, 4, 4, 1, boxTexture.mail, URL.email, 0x4285F4, true, true, 0.8);

    createBox(110, 2, -90, 4, 4, 1, boxTexture.behance, URL.behance, 0x1769FF, true, true, 0.8);

    //lensflare
    createLensFlare(500, 50, -1000, 250, 250, boxTexture.lensFlareMain);

    // Add blackhole model to the back of the area
    createBigBlackhole(-150, -50, -900, 100); // Position at the back of the area with scale 0.1

    // Create horizontal AKSHAYAN text
    createHorizontalAkshayanText();

    let touchText, instructionsText;
    if (isTouchscreenDevice()) {
      touchText = '';
      instructionsText = '';
    } else {
      touchText = '';
      instructionsText = '';
    }

    // simpleText(9, 0.01, 5, instructionsText, 1.25);
    // simpleText(9, 0.01, 2, 'Press R to reset the AKSHAYAN letters!', 1.0);
    simpleText(0, 0.01, -13, 'Click the RED BUTTON below the solar system!', 1.0);
    simpleText(0, 0.01, -28, 'SOLAR SYSTEM', 2.0);

    simpleText(23, 0.01, -60, touchText, 1.5);
    // simpleText(-50, 0.01, -5, 'SKILLS', 3);
    // simpleText(61, 0.01, -15, 'TIMELINE', 3);

    
    // Add sci-fi worker model to the ground area near social media logos
    createSciFiWorker(0, 0, 40, 7); // Position at (0, 0, 80) with much smaller scale 1.5
    
    // Add manta spaceship model to the ground area
    createMantaSpaceship(-100, 6, -100, 2); // Position at (30, 5, 30) with scale 0.01 - elevated 5 units above ground
    
    // Add DSS Harbinger Battle Cruiser model to the ground area
    createDSSHarbinger(-84, 10, -56, 0.002); // Position at (100, 0, -100) with scale 0.02 - on the ground
    
    // Add sci-fi personal space pod model to the ground area
    createSciFiPersonalSpacePod(-85, 5, -48, 13); // Position at (-100, 0, -15) with scale 5 - on the ground
    
    // Add Jedi Star Fighter model to the ground area
    createJediStarFighter(-95, 8, -15, 0.05); // Position at (-100, 0, -15) with scale 1 - on the ground
    
    // Add light fighter spaceship model to the ground area
    createLightFighterSpaceship(-93, 5, 12, 2); // Position at (-100, 0, 10) with scale 10 - on the ground
    
    // Add UFO model to the ground area
    // createUFO(90, 20, -90, 0.07); // Position at (90, 10, -90) with scale 0.07

    // // Add badminton and Cristiano Ronaldo models close to each other on the ground
    // createBadminton(87, 0, 70, 7); // Position badminton model
    // createCristianoRonaldo(73, 6.5, 70, 6.5); // Position Cristiano Ronaldo model close to badminton
    // createYamahaKeyboard(95, 0, 73, 8); // Yamaha Keyboard
    // createBowlingBallAndPin(93, 0, 77, 0.01); // Bowling Ball and Pin
    // createGymWeights(77, 0, 77, 0.05); // Gym Weights
    // createCricketSet(90, 0.2, 80, 0.07); // Cricket Set
    // createPlayStation5Set(85, 0, 75, 0.5); // PlayStation 5 Set
    // createKarom(82, 0, 82, 20); // Karom
    // createIronMan(80, 0, 62, 5.5); // Iron Man
    // createAmazingSpiderMan2(68, 0, 78, 5); // Amazing Spider-Man 2
    // createNissanSkylineGTR(97, 1, 55, 2); // Nissan Skyline GTR R35
    // createOracleRedBullF1RB19(68, 0, 55, 9); // Oracle Red Bull F1 Car RB19 2023
    // createClassicGaneshDDO(80, 0, 70, 0.3); // Classic Ganesh DDO Painted
    // createFootball(90.5, 1.03, 75, 0.02); // Football
    // createThingHandWednesday(77, -0.7, 80, 5); // Thing Hand from Wednesday Addams
    // create3DSectionTitle('MY WORLD', 79, 2, 95, 3.0, 3.0);

    // Tools Section
    create3DSectionTitle('SKILLS & TECHNOLOGIES', -68, 2, 75, 3.0, 3.0);

    simpleText(-70, 0.01, 80, 'Click the arrows to navigate through the carousel!', 1.0);
    
    // Add time machine model to the ground area in the specified area (-90, 1, 90, 5)
    createTimeMachine(-70, 0, 60, 2); // Position at (-90, 1, 90) with scale 5

    // Add earth model to the ground
    createEarth(90, 12, -85, 10); // Position earth model on the ground near the time machine

    // Add dancing alien model to the ground
    createDancingAlien(13, 0, -113, 8); // Position dancing alien model on the ground

    // Create interactive tool carousel instead of multiple overlapping images
    createToolCarousel(-70, 9, 60, 4, 4);
    
    // Add blackhole model to the back of the area
    // createBlackhole(90, 1, -90, 10); // Position at the back of the area with scale 0.1

    // Add waving flags for each educational institution
    // University of Westminster flag - positioned at x=54 to align with text
    createWavingFlag(-11.9, 0, -105, 6, 4, 10, './src/jsm/flags/University of Westminster.png', 'University of Westminster');
    
    // Informatics Institute of Technology flag - positioned at x=54 to align with text
    createWavingFlag(-11.9, 0, -90, 6, 4, 10, './src/jsm/flags/Informatics Institute of Technology.png', 'Informatics Institute of Technology');
    
    // S. Thomas' College flag - positioned at x=54 to align with text
    createWavingFlag(-11.9, 0, -75, 6, 4, 10, './src/jsm/flags/S.Thomas College.png', 'S. Thomas\' College');

    addParticles();
    glowingParticles();
    generateGalaxy();

    setupEventHandlers();
    // window.addEventListener('mousemove', onDocumentMouseMove, false);
    
    // Make openModal function globally available
    window.openModal = openModal;
    
    renderFrame();
  }

  //check if user's browser has WebGL capabilities
  if (WEBGL.isWebGLAvailable()) {
    start();
  } else {
    noWebGL();
  }
});
