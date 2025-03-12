import * as THREE from "../threeJS/build/three.module.js";
import { OrbitControls } from "../threeJS/examples/jsm/controls/OrbitControls.js";

class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Position camera
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // Set up orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createScene() {
        // Clear existing scene
        while(this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateScene() {
        requestAnimationFrame(() => this.updateScene());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export default SceneManager;