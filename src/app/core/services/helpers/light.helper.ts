import * as THREE from 'three';

export function addAmbientLight (scene) {
  scene.add( new THREE.AmbientLight( 0x666666 ) )
}

export function addDirectionalLight (scene) {
  const light = new THREE.DirectionalLight( 0xdfebff, 1 )
  light.position.set( 50, 200, 100 )
  light.castShadow = true
  scene.add( light )
}
