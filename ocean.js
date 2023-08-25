// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ocean geometry
const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);

// Pulsing vertex shader
const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * sin(0.1 * position.y + time), 1.0);
  }
`;

// Fragment shader for shimmering effect
const fragmentShader = `
  varying vec3 vNormal;
  void main() {
    float shimmer = 0.5 + 0.5 * sin(dot(vNormal, vec3(0.0, 1.0, 0.0)) + time);
    gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0) * shimmer;
  }
`;

// Material with shaders
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    time: { value: 0.0 },
  },
});

// Mesh and scene setup
const ocean = new THREE.Mesh(geometry, material);
ocean.rotation.x = -Math.PI / 2;
scene.add(ocean);

camera.position.y = 10;
camera.position.z = 10;
camera.lookAt(0, 0, 0);

// Render loop
const animate = function () {
  requestAnimationFrame(animate);

  // Update time uniform for pulsing effect
  material.uniforms.time.value = 0.5 * Date.now() / 1000;

  renderer.render(scene, camera);
};

animate();
