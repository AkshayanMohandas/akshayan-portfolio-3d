//start link events
import * as THREE from 'three';
import { camera, renderer, scene } from './world';
import { cursorHoverObjects } from '../app';

export const pickPosition = { x: 0, y: 0 };

export function rotateCamera(ballPosition) {
  // current camera position
  var camPos = new THREE.Vector3(
    camera.position.x,
    camera.position.y,
    camera.position.z
  );

  // target camera position
  var targetPos;

  // Project area - top view for better project visibility
  if (
    ballPosition.position.x > -80 &&
    ballPosition.position.x < -60 &&
    ballPosition.position.z > -100 &&
    ballPosition.position.z < 70
  ) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 60,
      ballPosition.position.z + 40
    );
  }

  //1
  else if (
    (ballPosition.position.x < 77 &&
      ballPosition.position.x > 42 &&
      ballPosition.position.z > -20 &&
      ballPosition.position.z < 40) ||
    (ballPosition.position.x < -2 && ballPosition.position.z < -28) ||
    (ballPosition.position.x < -25 &&
      ballPosition.position.x > -70 &&
      ballPosition.position.z > -10 &&
      ballPosition.position.z < 40)
  ) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 50,
      ballPosition.position.z + 40
    );
  }

  //2
  else if (
    ballPosition.position.x > -3 &&
    ballPosition.position.x < 22 &&
    ballPosition.position.z > 31 &&
    ballPosition.position.z < 58
  ) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 50,
      ballPosition.position.z + 40
    );
  }

  //3
  else if (ballPosition.position.z > 50) {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 10,
      ballPosition.position.z + 40
    );
  }

  // revert back to original angle
  else {
    targetPos = new THREE.Vector3(
      ballPosition.position.x,
      ballPosition.position.y + 30,
      ballPosition.position.z + 60
    );
  }

  camPos.lerp(targetPos, 0.033);
  camera.position.copy(camPos);
  camera.lookAt(ballPosition.position);
}

export function getCanvasRelativePosition(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * renderer.domElement.width) / rect.width,
    y: ((event.clientY - rect.top) * renderer.domElement.height) / rect.height,
  };
}

export function launchClickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / renderer.domElement.width) * 2 - 1;
  pickPosition.y = (pos.y / renderer.domElement.height) * -2 + 1; // note we flip Y

  // cast a ray through the frustum
  const myRaycaster = new THREE.Raycaster();
  myRaycaster.setFromCamera(pickPosition, camera);
  // get the list of objects the ray intersected - traverse all children recursively
  const intersectedObjects = myRaycaster.intersectObjects(scene.children, true);
  if (intersectedObjects.length) {
    // pick the first object. It's the closest one
    const pickedObject = intersectedObjects[0].object;
    
    // Check if it's the fall button (check the object itself and its parent)
    let buttonObject = pickedObject;
    while (buttonObject && !buttonObject.userData.isButton) {
      buttonObject = buttonObject.parent;
    }
    
    if (buttonObject && buttonObject.userData.isButton) {
      console.log('Portal 2 button clicked! Triggering planet fall...');
      // Import the function from app.js
      if (window.makePlanetsFall) {
        window.makePlanetsFall();
      }
      return;
    }
    
    // Check if it's an arrow button for carousel navigation
    if (pickedObject.userData.isArrow && pickedObject.userData.clickable) {
      console.log(`Arrow clicked: ${pickedObject.userData.direction}`);
      if (window.navigateCarousel) {
        window.navigateCarousel(pickedObject.userData.direction);
      }
      return;
    }
    
    // Check for info icon clicks
    if (pickedObject.userData.type === 'infoIcon' && pickedObject.userData.infoKey) {
      console.log(`Info icon clicked: ${pickedObject.userData.infoKey}`);
      if (window.openModal) {
        window.openModal(pickedObject.userData.infoKey);
      }
      return;
    }
    
    // Check for URL links
    if (intersectedObjects[0].object.userData.URL)
      window.open(intersectedObjects[0].object.userData.URL);
    else {
      return;
    }
  }
}

// Global variables for hover animations
let hoveredObjects = new Set();
let animationData = new Map();

export function launchHover(event) {
  event.preventDefault();
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(cursorHoverObjects);

  if (intersects.length > 0) {
    document.getElementById('document-body').style.cursor = 'pointer';
    
    // Start hover animation for the first intersected object (if not disabled)
    const hoveredObject = intersects[0].object;
    if (!hoveredObject.userData.noAnimation) {
      startHoverAnimation(hoveredObject);
    }
  } else {
    document.getElementById('document-body').style.cursor = 'default';
    
    // Stop all hover animations
    stopAllHoverAnimations();
  }
}

function startHoverAnimation(object) {
  if (!hoveredObjects.has(object.uuid)) {
    hoveredObjects.add(object.uuid);
    
    // Store original properties
    const originalPosition = object.position.clone();
    const originalScale = object.scale.clone();
    const originalRotation = object.rotation.clone();
    
    animationData.set(object.uuid, {
      originalPosition: originalPosition,
      originalScale: originalScale,
      originalRotation: originalRotation,
      startTime: Date.now(),
      isAnimating: true
    });
  }
}

function stopAllHoverAnimations() {
  animationData.forEach((data, uuid) => {
    const object = scene.getObjectByProperty('uuid', uuid);
    if (object) {
      // Smoothly return to original state
      object.position.copy(data.originalPosition);
      object.scale.copy(data.originalScale);
      object.rotation.copy(data.originalRotation);
    }
  });
  
  hoveredObjects.clear();
  animationData.clear();
}

export function updateHoverAnimations() {
  const currentTime = Date.now();
  
  animationData.forEach((data, uuid) => {
    if (data.isAnimating) {
      const object = scene.getObjectByProperty('uuid', uuid);
      if (object) {
        const elapsed = (currentTime - data.startTime) / 2000; // Convert to seconds
        
        // Create floating animation - ensure logos never go below original position
        const floatHeight = Math.abs(Math.sin(elapsed * 4)) * 0.7; // Only move up, never down
        const floatRotation = Math.sin(elapsed * 3) * 0.05; // Gentle rotation
        const scaleEffect = 1 + Math.sin(elapsed * 5) * 0.1; // Gentle scale pulsing
        
        // Apply animations
        object.position.y = data.originalPosition.y + floatHeight;
        object.rotation.y = data.originalRotation.y + floatRotation;
        object.scale.setScalar(scaleEffect);
      }
    }
  });
}

//deprecated camera function
/*
function rotateCamera(ballPosition) {
  //1
  if (
    (ballPosition.position.x < 77 &&
      ballPosition.position.x > 42 &&
      ballPosition.position.z > -20 &&
      ballPosition.position.z < 40) ||
    (ballPosition.position.x < -2 && ballPosition.position.z < -28) ||
    (ballPosition.position.x < -25 &&
      ballPosition.position.x > -70 &&
      ballPosition.position.z > -10 &&
      ballPosition.position.z < 40)
  ) {
    camera.position.x = ballPosition.position.x;
    camera.position.y = ballPosition.position.y + 50;
    camera.position.z = ballPosition.position.z + 40;
    camera.lookAt(ballPosition.position);

    //2
  } else if (
    ballPosition.position.x > -3 &&
    ballPosition.position.x < 22 &&
    ballPosition.position.z > 31 &&
    ballPosition.position.z < 58
  ) {
    camera.position.x = ballPosition.position.x;
    camera.position.y = ballPosition.position.y + 50;
    camera.position.z = ballPosition.position.z + 40;
    camera.lookAt(ballPosition.position);

    //3
  } else if (ballPosition.position.z > 50) {
    camera.position.x = ballPosition.position.x;
    camera.position.y = ballPosition.position.y + 10;
    camera.position.z = ballPosition.position.z + 40;
    camera.lookAt(ballPosition.position);

    //no change
  } else {
    camera.position.x = ballPosition.position.x;
    camera.position.y = ballPosition.position.y + 30;
    camera.position.z = ballPosition.position.z + 60;
    camera.lookAt(ballPosition.position);
  }
}
*/
