import * as THREE from "../threeJS/build/three.module.js";

class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }

    createScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });

        // Clear any existing canvas
        const existingCanvas = document.querySelector('canvas[data-engine]');
        if (existingCanvas)
            existingCanvas.remove();

        // Add new renderer to document
        document.body.appendChild(this.renderer.domElement);
    }
}

export default SceneManager;