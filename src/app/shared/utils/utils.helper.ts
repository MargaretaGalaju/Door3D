import * as THREE from 'three';
import { Vector3 } from 'three';

export function dumpObject(obj, lines = [], isLast = true, prefix = '') {
  const localPrefix = isLast ? '└─' : '├─';
  lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
  const newPrefix = prefix + (isLast ? '  ' : '│ ');
  const lastNdx = obj.children.length - 1;
  obj.children.forEach((child, ndx) => {
    const isLast = ndx === lastNdx;
    dumpObject(child, lines, isLast, newPrefix);
  });
  return lines;
}

export function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera, cameraFrustrum, frontView) {
  const halfSizeToFitOnScreen = sizeToFitOnScreen;
  const halfFovY = THREE.MathUtils.degToRad(cameraFrustrum * .5);
  const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

  const initCameraPosition = camera.position.z.toFixed(0);
  // compute a unit vector that points in the direction the camera is now
  // in the xz plane from the center of the box
  // console.log(camera.position, frontView);
  
  const direction = (new THREE.Vector3())
      .subVectors(camera.position, boxCenter)
      .multiply(new THREE.Vector3(0, 0, frontView ? -1: 1))
      .normalize();
      
  // move the camera to a position distance units way from the center
  // in whatever direction the camera was from the center already
  const position = direction.multiplyScalar(distance).add(boxCenter);
  camera.position.copy(position);

  if (initCameraPosition === camera.position.z.toFixed(0)) {
    console.log('equal');
    
    const direction = (new THREE.Vector3())
      .subVectors(camera.position, boxCenter)
      .multiply(new THREE.Vector3(0, 0, frontView ? 1: -1))
      .normalize();
      
  // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    const position = direction.multiplyScalar(distance).add(boxCenter);
    camera.position.copy(position);
  }
  
  // pick some near and far values for the frustum that
  // will contain the box.
  camera.near = boxSize / 100;
  camera.far = boxSize * 100;

  camera.updateProjectionMatrix();

  // point the camera to look at the center of the box
  camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
}