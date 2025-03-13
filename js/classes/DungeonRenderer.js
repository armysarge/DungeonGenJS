import Chest from './Chest.js';
import * as THREE from '../threeJS/Three.js';
import { OrbitControls } from "../threeJS/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "../threeJS/examples/jsm/controls/PointerLockControls.js";
import { EXRLoader } from '../threeJS/examples/jsm/loaders/EXRLoader.js';

/**
 * A class responsible for rendering the dungeon and managing UI elements.
 * Handles both 2D and 3D rendering of the dungeon, as well as interactive UI elements
 * such as hover information and debug visualization.
 *
 * @class
 * @property {SceneManager} sceneManager - Manager for handling scene-related operations
 * @property {Dungeon} dungeon - The dungeon instance to be rendered
 *
 * @example
 * const dungeonRenderer = new DungeonRenderer(sceneManager, dungeon);
 * dungeonRenderer.render('2D'); // Renders dungeon in 2D
 *
 * @example
 * // Creating and rendering with debug mode
 * const dungeonRenderer = new DungeonRenderer(sceneManager, dungeon);
 * dungeon.debug = true;
 * dungeonRenderer.render('2D'); // Renders dungeon in 2D with debug information
 * dungeonRenderer.render('3D'); // Renders dungeon in 3D using ThreeJS with debug information
 */
class DungeonRenderer{
    // render it out to HTML or Canvas
    constructor(sceneManager, dungeon) {
        this.sceneManager = sceneManager;
        this.dungeon = dungeon;
        this.movePlayer = null;
        this.offsetX = -this.dungeon.width / 2;  // Add this line
        this.offsetZ = -this.dungeon.height / 2;  // Add this line
        this.createUIElements();
    }

    /**
     * Creates and appends UI elements to display cell information.
     * Sets up a semi-transparent panel in the top-right corner of the screen
     * containing position coordinates, cell type, room number, and additional
     * cell information.
     *
     * The panel includes:
     * - Position display (x,y coordinates)
     * - Cell type indicator
     * - Room number display
     * - Extra information section
     *
     * @method createUIElements
     * @memberof DungeonRenderer
     */
    createUIElements() {
        // Create the cell info panel
        const infoPanel = document.createElement('div');
        infoPanel.id = 'cell-info-panel';
        infoPanel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 100;
            min-width: 150px;
        `;

        // Create position info
        const positionDiv = document.createElement('div');
        positionDiv.innerHTML = 'Position: <span id="cell-position">-,-</span>';

        // Create type info
        const typeDiv = document.createElement('div');
        typeDiv.innerHTML = 'Type: <span id="cell-type">-</span>';

        // Create room info
        const roomDiv = document.createElement('div');
        roomDiv.innerHTML = 'Room: <span id="cell-room">-</span>';

        const extraDiv = document.createElement('div');
        extraDiv.innerHTML = '<span id="cell-extra-info"></span>';

        // Add to panel
        infoPanel.appendChild(positionDiv);
        infoPanel.appendChild(typeDiv);
        infoPanel.appendChild(roomDiv);
        infoPanel.appendChild(extraDiv);

        // Add to document
        document.body.appendChild(infoPanel);
    }

    /**
     * Renders the dungeon in 2D on an HTML canvas element.
     * @param {boolean} [preserveCanvas=false] - If true, skips redrawing the canvas and returns current context
     * @returns {Object} Object containing the canvas context and tile size
     * @returns {CanvasRenderingContext2D} returns.ctx - The 2D rendering context
     * @returns {number} returns.tileSize - The size of each tile in pixels
     *
     * @description
     * This method handles the 2D rendering of the dungeon including:
     * - Basic tiles (walls, floors)
     * - Doors (with locked/trapped states)
     * - Chests (with quality colors and locked states)
     * - Creatures (with sleep states)
     * - Stairs
     * - Keys and other items
     * - Player starting position
     *
     * In debug mode, it also renders:
     * - Room borders (green for connected, red for unconnected)
     * - Grid overlay
     * - Trap markers on doors
     *
     * The rendering is done in multiple passes to ensure proper layering of elements.
     */
    render2D(preserveCanvas = false) {
        //render 2D on canvas
        if(document.querySelector('#minimap'))
            document.querySelector('#minimap').remove(); // Remove minimap if it exists
        if(document.querySelector('canvas[data-engine]'))
        document.querySelector('canvas[data-engine]').style = "display: none;";
        const canvas = document.getElementById("dungeon-container-2d");
        const ctx = canvas.getContext('2d');
        const tileSize = 10;
        canvas.style = "display: block;";

        // If preserveCanvas is true, we'll skip the redraw
        if (preserveCanvas) {
            return { ctx, tileSize };
        }

        // Handle high DPI displays for sharper rendering
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Get the CSS size of the canvas
        const displayWidth = this.dungeon.width * tileSize;
        const displayHeight = this.dungeon.height * tileSize;

        // Set the canvas size in CSS pixels
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Increase canvas resolution based on device pixel ratio
        canvas.width = Math.floor(displayWidth * devicePixelRatio);
        canvas.height = Math.floor(displayHeight * devicePixelRatio);

        // Scale the context to ensure correct drawing
        ctx.scale(devicePixelRatio, devicePixelRatio);

        // Enable image smoothing options for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // First pass: draw all tiles
        for (let i = 0; i < this.dungeon.width; i++) {
            for (let j = 0; j < this.dungeon.height; j++) {
                const tile = this.dungeon.tiles[i][j];

                // Change border wall color to visually distinguish them
                if (i < this.dungeon.borderSize ||
                    i >= this.dungeon.width - this.dungeon.borderSize ||
                    j < this.dungeon.borderSize ||
                    j >= this.dungeon.height - this.dungeon.borderSize) {
                    // Border walls
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                } else {
                    // Other tiles
                    ctx.fillStyle = tile.obj.color;
                }

                ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);

                // Add door symbol if it's a door
                if (tile.type === "door") {
                    ctx.fillStyle = 'white';
                    ctx.font = `${tileSize * 0.8}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Draw door symbol based on facing direction
                    if (tile.obj.facing === "north" || tile.obj.facing === "south") {
                        ctx.fillRect(
                            i * tileSize,
                            (tile.obj.facing === "south")?j * tileSize - tileSize + tileSize / 2:j * tileSize + tileSize / 2 - 1,
                            tileSize,
                            tileSize
                        );
                        // Horizontal door
                        if (tile.obj.locked){
                            ctx.fillStyle = 'red';
                            ctx.fillRect(
                                i * tileSize + tileSize / 4,
                                j * tileSize + tileSize / 4,
                                tileSize / 2,
                                tileSize / 2
                            );
                        }

                    } else {
                        // Vertical door
                        ctx.fillRect(
                            (tile.obj.facing === "east")?i * tileSize - tileSize + tileSize / 2:i * tileSize + tileSize / 2 - 1,
                            j * tileSize,
                            tileSize,
                            tileSize
                        );
                        if (tile.obj.locked){
                            ctx.fillStyle = 'red';
                            ctx.fillRect(
                                i * tileSize + tileSize / 4,
                                j * tileSize + tileSize / 4,
                                tileSize / 2,
                                tileSize / 2
                            );
                        }
                    }

                    // Add a small marker for trapped doors if in debug mode
                    if (this.dungeon.debug && tile.obj.trapped) {
                        ctx.fillStyle = 'red';
                        ctx.beginPath();
                        ctx.arc(
                            i * tileSize + tileSize / 2,
                            j * tileSize + tileSize / 2,
                            tileSize / 6,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                }

                // If this floor tile has a chest, draw it
                if (tile.type === "floor" && tile.obj.item && tile.obj.item instanceof Chest) {
                    const chest = tile.obj.item;

                    // Draw chest with color based on quality
                    let chestColor = chest.getChestColor()

                    // Draw the chest
                    ctx.fillStyle = chestColor;
                    const padding = 2;
                    ctx.fillRect(
                        i * tileSize + padding,
                        j * tileSize + padding,
                        tileSize - padding * 2,
                        tileSize - padding * 2
                    );

                    // Add a small lock symbol if chest is locked
                    if (chest.locked) {
                        ctx.fillStyle = "#333";
                        ctx.fillRect(
                            i * tileSize + tileSize/2 - 1,
                            j * tileSize + tileSize/3 - 1,
                            2,
                            3
                        );
                        ctx.fillRect(
                            i * tileSize + tileSize/3,
                            j * tileSize + tileSize/3,
                            tileSize/3,
                            2
                        );
                    }
                }

                // If this floor tile has a creature, draw it
                if (tile.type === "floor" && tile.obj.creature) {
                    const creature = tile.obj.creature;

                    // Draw creature with color based on type
                    let creatureColor = creature.getCreatureColor();

                    // Draw the creature body
                    ctx.fillStyle = creatureColor;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Solid black for creature outline
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2,
                        tileSize / 2 - 1,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    // Draw a sleep indicator if the creature is asleep
                    if (creature.asleep) {
                        ctx.fillStyle = "#FFFFFF";
                        ctx.font = `${tileSize/2}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            "z",
                            i * tileSize + tileSize / 2,
                            j * tileSize + tileSize / 2
                        );
                    }
                }

                if (tile.type === "stairs") {
                    ctx.fillStyle = tile.obj.color;
                    ctx.fillRect(i * tileSize, j * tileSize, tileSize, tileSize);

                    // Draw stairs symbol
                    ctx.fillStyle = 'white';
                    ctx.font = `${tileSize * 0.8}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        "▼",
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2
                    );
                }

                // Draw keys thats on the ground
                if (tile.type === "floor" && tile.obj.item && tile.obj.item.type === "key") {
                    const key = tile.obj.item;

                    // Draw the key
                    ctx.fillStyle = key.getItemColor();
                    ctx.beginPath();
                    ctx.arc(
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2,
                        tileSize / 3,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    // Draw symbol based on key type
                    ctx.fillStyle = 'gold';
                    ctx.font = `${tileSize * 0.5}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        "K",
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2
                    );
                }

                // Draw item on floor (like keys)
                if (tile.type === "floor" && tile.obj.item && !(tile.obj.item instanceof Chest)) {
                    const item = tile.obj.item;

                    // Draw the item
                    ctx.fillStyle = item.getItemColor();
                    ctx.beginPath();
                    ctx.arc(
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2,
                        tileSize / 3,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    // Draw symbol based on item type
                    if (item.type === "doorKey" || item.type === "chestKey") {
                        ctx.fillStyle = 'black';
                        ctx.font = `${tileSize * 0.5}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            "K",
                            i * tileSize + tileSize / 2,
                            j * tileSize + tileSize / 2
                        );
                    }
                }

                // Draw player starting position
                if (this.dungeon.playerStart &&
                    i === this.dungeon.playerStart.x &&
                    j === this.dungeon.playerStart.y) {

                    ctx.fillStyle = '#435BA8FF'; // Green
                    ctx.beginPath();
                    ctx.arc(
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2,
                        tileSize / 2 - 1,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();

                    // Add a player symbol
                    ctx.fillStyle = 'white';
                    ctx.font = `${tileSize * 0.7}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        "▲",
                        i * tileSize + tileSize / 2,
                        j * tileSize + tileSize / 2
                    );
                }
            }
        }

        // Second pass: highlight room borders for debugging
        if (this.dungeon.debug) {
            for (const room of this.dungeon.rooms) {
                ctx.strokeStyle = room.connected ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
                ctx.strokeRect(
                    room.x * tileSize,
                    room.y * tileSize,
                    room.width * tileSize,
                    room.height * tileSize
                );
            }

            // Add a subtle grid overlay in debug mode
            ctx.strokeStyle = 'rgba(50, 50, 50, 0.2)'; // Very light gray, subtle
            ctx.lineWidth = 0.5;

            // Draw vertical grid lines
            for (let i = 0; i <= this.dungeon.width; i++) {
                ctx.beginPath();
                ctx.moveTo(i * tileSize, 0);
                ctx.lineTo(i * tileSize, this.dungeon.height * tileSize);
                ctx.stroke();
            }

            // Draw horizontal grid lines
            for (let j = 0; j <= this.dungeon.height; j++) {
                ctx.beginPath();
                ctx.moveTo(0, j * tileSize);
                ctx.lineTo(this.dungeon.width * tileSize, j * tileSize);
                ctx.stroke();
            }
        }

        // Add hover functionality to canvas
        this.addHoverFunctionality(canvas, tileSize);

        return { ctx, tileSize };
    }

    render3DDemoTest() {
        // Clear and set up the scene
        this.sceneManager.createScene();

        // Set scene background color
        this.sceneManager.scene.background = new THREE.Color(0x333333);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.sceneManager.scene.add(ambientLight);
        this.sceneManager.scene.add(directionalLight);

        // Create a cube with standard material for better lighting
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            metalness: 0.1,
            roughness: 0.5
        });
        const cube = new THREE.Mesh(geometry, material);

        // Enable shadows
        cube.castShadow = true;
        cube.receiveShadow = true;
        directionalLight.castShadow = true;

        // Position the cube
        cube.position.set(0, 0, 0);
        this.sceneManager.scene.add(cube);

        // Position camera
        this.sceneManager.camera.position.set(3, 2, 5);
        this.sceneManager.camera.lookAt(0, 0, 0);

        // Configure renderer
        this.sceneManager.renderer.shadowMap.enabled = true;
        this.sceneManager.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.sceneManager.renderer.setSize(window.innerWidth, window.innerHeight);
        this.sceneManager.renderer.setPixelRatio(window.devicePixelRatio);

        // Add orbit controls
        const controls = new OrbitControls(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 3;
        controls.maxDistance = 10;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            controls.update();
            this.sceneManager.renderer.render(
                this.sceneManager.scene,
                this.sceneManager.camera
            );
        };
        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.sceneManager.camera.aspect = window.innerWidth / window.innerHeight;
            this.sceneManager.camera.updateProjectionMatrix();
            this.sceneManager.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render3D(worldType = 'underdark', controlType = 'debug') {
        return new Promise((resolve) => {
            document.getElementById("dungeon-container-2d").style = "display: none;";
            this.sceneManager.createScene();

            this.sceneManager.renderer.setSize(window.innerWidth, window.innerHeight);
            this.sceneManager.renderer.domElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            `;

            // Add window resize handler
            const onWindowResize = () => {
                this.sceneManager.camera.aspect = window.innerWidth / window.innerHeight;
                this.sceneManager.camera.updateProjectionMatrix();
                this.sceneManager.renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', onWindowResize);

            // Add immediate lighting for visibility
            const defaultLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.sceneManager.scene.add(defaultLight);

            // Create materials with improved lighting
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: worldType === 'underdark' ? 0x404040 : 0x808080,
                roughness: 0.9,
                metalness: 0.1
            });

            const floorMaterial = new THREE.MeshStandardMaterial({
                color: worldType === 'underdark' ? 0x2a2a2a : 0x505050,
                roughness: 0.8,
                metalness: 0.1
            });

            const roofMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.9,
                metalness: 0.1
            });

            // Center the dungeon
            const offsetX = -this.dungeon.width / 2;
            const offsetZ = -this.dungeon.height / 2;

            // Setup camera and controls based on controlType
            const cameraDistance = Math.max(this.dungeon.width, this.dungeon.height) * 1.5;
            let controls;

            switch(controlType) {
                case 'firstperson':
                    // Set initial camera position to player start
                    this.sceneManager.camera.position.set(
                        this.dungeon.playerStart.x + this.offsetX,
                        1.2, // Height of the player
                        this.dungeon.playerStart.y + this.offsetZ
                    );
                    controls = new PointerLockControls(this.sceneManager.camera, document.body);

                    // Add click handler for pointer lock
                    document.addEventListener('click', () => {
                        if (!controls.isLocked) {
                            controls.lock();
                        }
                    });

                    // Add point light that follows the camera
                    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
                    pointLight.position.copy(this.sceneManager.camera.position);
                    this.sceneManager.scene.add(pointLight);
                    this.updateLight = () => pointLight.position.copy(this.sceneManager.camera.position);

                    // Setup movement
                    const keys = { w: false, a: false, s: false, d: false };
                    document.addEventListener('keydown', (e) => {
                        if (keys.hasOwnProperty(e.key.toLowerCase())) {
                            keys[e.key.toLowerCase()] = true;
                        }
                    });
                    document.addEventListener('keyup', (e) => {
                        if (keys.hasOwnProperty(e.key.toLowerCase())) {
                            keys[e.key.toLowerCase()] = false;
                        }
                    });

                    this.movePlayer = () => {
                        if (controls.isLocked) {
                            const moveSpeed = 0.1;
                            const newPosition = new THREE.Vector3();
                            newPosition.copy(this.sceneManager.camera.position);

                            if (keys.w) {
                                controls.moveForward(moveSpeed);
                                if(this.checkWallCollision(this.sceneManager.camera.position)) {
                                    controls.moveForward(-moveSpeed);
                                }
                            }
                            if (keys.s) {
                                controls.moveForward(-moveSpeed);
                                if(this.checkWallCollision(this.sceneManager.camera.position)) {
                                    controls.moveForward(moveSpeed);
                                }
                            }
                            if (keys.a) {
                                controls.moveRight(-moveSpeed);
                                if(this.checkWallCollision(this.sceneManager.camera.position)) {
                                    controls.moveRight(moveSpeed);
                                }
                            }
                            if (keys.d) {
                                controls.moveRight(moveSpeed);
                                if(this.checkWallCollision(this.sceneManager.camera.position)) {
                                    controls.moveRight(-moveSpeed);
                                }
                            }
                        }
                    };
                    break;

                case 'thirdperson':
                    // Initialize OrbitControls first
                    controls = new OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);

                    // Then set camera position
                    this.sceneManager.camera.position.set(
                        this.dungeon.playerStart.x + this.offsetX,
                        10,
                        this.dungeon.playerStart.y + this.offsetZ + 10
                    );

                    // Now we can safely set the target
                    controls.target.set(
                        this.dungeon.playerStart.x + this.offsetX,
                        0,
                        this.dungeon.playerStart.y + this.offsetZ
                    );

                    // Additional controls setup
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.05;
                    controls.minDistance = 5;
                    controls.maxDistance = 20;
                    break;

                default: // debug mode
                    this.sceneManager.camera.position.set(
                        cameraDistance,
                        cameraDistance * 0.8,
                        cameraDistance
                    );
                    controls = new OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
                    controls.target.set(0, 0, 0);
            }

            // Render dungeon tiles
            for (let x = 0; x < this.dungeon.width; x++) {
                for (let z = 0; z < this.dungeon.height; z++) {
                    const tile = this.dungeon.tiles[x][z];
                    const posX = x + this.offsetX;
                    const posZ = z + this.offsetZ;

                    if (tile.type === 'wall') {
                        const wall = new THREE.Mesh(
                            new THREE.BoxGeometry(1.4, 1, 1.4), // Make walls slightly wider
                            wallMaterial
                        );
                        wall.position.set(posX, 1, posZ);
                        this.sceneManager.scene.add(wall);
                    } else {
                        // For corridors, make the floor slightly wider too
                        const floor = new THREE.Mesh(
                            new THREE.BoxGeometry(1.2, 0.1, 1.2), // Make floor slightly wider
                            floorMaterial
                        );
                        floor.position.set(posX, 1, posZ);
                        this.sceneManager.scene.add(floor);

                        if (controlType === 'firstperson') {
                            const roof = new THREE.Mesh(
                                new THREE.BoxGeometry(1.2, 0.1, 1.2), // Make roof match floor
                                roofMaterial
                            );
                            roof.position.set(posX, 1.4, posZ);
                            this.sceneManager.scene.add(roof);
                        }
                    }
                }
            }

            // Add minimap if not in debug mode
            if (controlType !== 'debug') {
                this.createMinimap();
            }

            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                if (this.movePlayer) this.movePlayer();
                if (this.updateLight) this.updateLight();
                if (controls.update) controls.update();
                this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
                if (controlType !== 'debug') {
                    this.updateMinimap();
                }
            };

            // Load skybox after initial setup
            const exrLoader = new EXRLoader();
            const pmremGenerator = new THREE.PMREMGenerator(this.sceneManager.renderer);
            pmremGenerator.compileEquirectangularShader();

            const skyboxPath = worldType === 'underdark'
                ? '../assets/textures/cave_hdr.exr'
                : '../assets/textures/sky_hdr.exr';

            exrLoader.load(skyboxPath, (texture) => {
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                this.sceneManager.scene.environment = envMap;
                this.sceneManager.scene.background = envMap;
                texture.dispose();
                pmremGenerator.dispose();
            });

            // Start animation
            animate();
            resolve();
        });
    }

    createMinimap() {
        // Create minimap canvas
        const minimapSize = 150;
        const minimap = document.createElement('canvas');
        minimap.id = 'minimap';
        minimap.width = minimapSize;
        minimap.height = minimapSize;
        minimap.style.position = 'absolute';
        minimap.style.bottom = '80px';
        minimap.style.right = '20px';
        minimap.style.border = '2px solid #fff';
        minimap.style.backgroundColor = 'rgba(0,0,0,0.5)';
        document.body.appendChild(minimap);

        // Initial render of minimap
        this.updateMinimap();
    }

    updateMinimap() {
        const minimap = document.getElementById('minimap');
        if (!minimap) return;

        const ctx = minimap.getContext('2d');
        const tileSize = minimap.width / this.dungeon.width;

        ctx.clearRect(0, 0, minimap.width, minimap.height);

        // Draw dungeon tiles
        for (let x = 0; x < this.dungeon.width; x++) {
            for (let y = 0; y < this.dungeon.height; y++) {
                const tile = this.dungeon.tiles[x][y];
                ctx.fillStyle = tile.type === 'wall' ? '#fff' : '#333';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }

        // Draw player position and direction
        const playerPos = this.sceneManager.camera.position;
        // Use class properties for offset
        const playerX = ((playerPos.x - this.offsetX) * tileSize);
        const playerY = ((playerPos.z - this.offsetZ) * tileSize);

        // Draw player dot
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(playerX, playerY, tileSize/2, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction indicator
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.sceneManager.camera.quaternion);

        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        ctx.lineTo(
            playerX + direction.x * tileSize * 1.5,
            playerY + direction.z * tileSize * 1.5
        );
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add player position text
        ctx.fillStyle = '#000000FF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
            `X: ${Math.round(playerPos.x - this.offsetX)}, Z: ${Math.round(playerPos.z - this.offsetZ)}`,
            minimap.width - 2,
            minimap.height - 2
        );
    }

    checkWallCollision(position) {
        // Convert world position to tile coordinates
        const tileX = Math.round(position.x - this.offsetX);
        const tileZ = Math.round(position.z - this.offsetZ);

        // Check surrounding tiles for walls (including diagonals)
        for(let x = -1; x <= 1; x++) {
            for(let z = -1; z <= 1; z++) {
                const checkX = tileX + x;
                const checkZ = tileZ + z;

                // Check if tile is within bounds
                if(checkX >= 0 && checkX < this.dungeon.width &&
                   checkZ >= 0 && checkZ < this.dungeon.height) {
                    const tile = this.dungeon.tiles[checkX][checkZ];
                    if(tile.type === 'wall') {
                        // Calculate distance to wall center
                        const wallX = checkX + this.offsetX;
                        const wallZ = checkZ + this.offsetZ;
                        const dx = position.x - wallX;
                        const dz = position.z - wallZ;
                        const distance = Math.sqrt(dx * dx + dz * dz);

                        // If too close to wall (0.7 units), prevent movement
                        if(distance < 0.9) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Add this method to create debug controls
    createDebugControls() {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'debug-controls';
        controlPanel.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 200px;
            background-color: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 100;
        `;

        // View toggle buttons
        const viewControls = document.createElement('div');
        viewControls.innerHTML = `
            <div>
                <button id="view-2d">2D View</button>
                <button id="view-3d">3D View</button>
            </div>
            <div id="3d-controls" style="display: none;">
                <div style="margin-top: 10px;margin-bottom: 10px;">
                    Environment:
                    <button id="env-underdark">Underdark</button>
                    <button id="env-outside">Outside</button>
                </div>
                <div>
                    Controls:
                    <button id="control-debug">Debug</button>
                    <button id="control-first">First Person</button>
                    <button id="control-third">Third Person</button>
                </div>
            </div>
        `;

        controlPanel.appendChild(viewControls);
        document.body.appendChild(controlPanel);

        // Add loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const loadingContent = document.createElement('div');
        loadingContent.style.cssText = `
            text-align: center;
            color: white;
        `;
        loadingContent.innerHTML = `
            <div style="margin-bottom: 20px;" id="loading-text">Initializing 3D View...</div>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
        `;

        loadingOverlay.appendChild(loadingContent);
        document.body.appendChild(loadingOverlay);

        // Add CSS for progress bar
        const style = document.createElement('style');
        style.textContent = `
            .progress-bar {
                width: 200px;
                height: 20px;
                background-color: #333;
                border-radius: 10px;
                overflow: hidden;
            }
            .progress {
                width: 0%;
                height: 100%;
                background-color: #4CAF50;
                transition: width 0.3s ease-in-out;
            }
            #loading-text {
                font-size: 1.2em;
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(style);

        // Event handlers
        let currentEnv = 'outside';
        let currentControl = 'debug';

        document.getElementById('view-2d').addEventListener('click', () => {
            this.render2D();
            document.getElementById('3d-controls').style.display = 'none';
        });

        document.getElementById('view-3d').addEventListener('click', async () => {
            document.getElementById('3d-controls').style.display = 'block';
            await this.switchTo3D(currentEnv, currentControl);
        });

        document.getElementById('env-underdark').addEventListener('click', async () => {
            currentEnv = 'underdark';
            await this.switchTo3D(currentEnv, currentControl);
        });

        document.getElementById('env-outside').addEventListener('click', async () => {
            currentEnv = 'outside';
            await this.switchTo3D(currentEnv, currentControl);
        });

        document.getElementById('control-debug').addEventListener('click', async () => {
            currentControl = 'debug';
            await this.switchTo3D(currentEnv, currentControl);
        });

        document.getElementById('control-first').addEventListener('click', async () => {
            currentControl = 'firstperson';
            await this.switchTo3D(currentEnv, currentControl);
        });

        document.getElementById('control-third').addEventListener('click', async () => {
            currentControl = 'thirdperson';
            await this.switchTo3D(currentEnv, currentControl);
        });
    }

    async switchTo3D(worldType, controlType) {
        const overlay = document.getElementById('loading-overlay');
        const progress = overlay.querySelector('.progress');
        const loadingText = document.getElementById('loading-text');
        overlay.style.display = 'flex';

        try {
            // Initial setup progress (20%)
            loadingText.textContent = 'Initializing scene...';
            progress.style.width = '20%';
            await new Promise(resolve => setTimeout(resolve, 200));

            // Create scene and prepare materials (40%)
            this.sceneManager.createScene();
            loadingText.textContent = 'Creating materials...';
            progress.style.width = '40%';
            await new Promise(resolve => setTimeout(resolve, 200));

            // Load skybox (60-80%)
            loadingText.textContent = 'Loading environment...';
            const skyboxPath = worldType === 'underdark'
                ? '../assets/textures/cave_hdr.exr'
                : '../assets/textures/sky_hdr.exr';

            await new Promise((resolve, reject) => {
                const exrLoader = new EXRLoader();
                const pmremGenerator = new THREE.PMREMGenerator(this.sceneManager.renderer);
                pmremGenerator.compileEquirectangularShader();

                progress.style.width = '60%';

                exrLoader.load(
                    skyboxPath,
                    (texture) => {
                        progress.style.width = '80%';
                        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                        this.sceneManager.scene.environment = envMap;
                        this.sceneManager.scene.background = envMap;
                        texture.dispose();
                        pmremGenerator.dispose();
                        resolve();
                    },
                    (xhr) => {
                        if (xhr.lengthComputable) {
                            const percentComplete = 60 + (xhr.loaded / xhr.total * 20);
                            progress.style.width = `${percentComplete}%`;
                        }
                    },
                    (error) => {
                        console.error('Error loading skybox:', error);
                        resolve(); // Continue even if skybox fails
                    }
                );
            });

            // Final render and setup (100%)
            loadingText.textContent = 'Finalizing...';
            progress.style.width = '100%';
            await new Promise(resolve => setTimeout(resolve, 200));

            // Render 3D view
            await this.render3D(worldType, controlType);

        } catch (error) {
            console.error('Error during 3D initialization:', error);
        } finally {
            // Always hide the overlay when done
            overlay.style.display = 'none';
            progress.style.width = '0%';
        }
    }

    /**
     * Adds hover and click functionality to the 2D canvas, displaying information about the dungeon tiles.
     * This includes position information, tile type, room information, and additional details depending
     * on the tile type (doors, creatures, chests, etc.).
     *
     * @param {HTMLCanvasElement} canvas - The canvas element to add hover functionality to
     * @param {number} tileSize - The size of each tile in pixels
     *
     * @listens mousemove - Tracks mouse movement to update tile information
     * @listens mouseleave - Resets displayed information when mouse leaves canvas
     * @listens click - Logs clicked tile information to console
     *
     * @requires DOM elements with IDs:
     * - 'cell-position': displays current tile coordinates
     * - 'cell-type': displays the type of the current tile
     * - 'cell-room': displays room information if tile is part of a room
     * - 'cell-extra-info': displays additional tile-specific information
     */
    addHoverFunctionality(canvas, tileSize) {
        // Current highlighted cell coordinates
        let highlightedX = -1;
        let highlightedY = -1;

        // Reference to dungeon for use in the hover handlers
        const dungeon = this.dungeon;
        const ctx = canvas.getContext('2d');
        const renderer = this; // Store reference to the renderer for use in callbacks

        // DOM elements for info display
        const positionEl = document.getElementById('cell-position');
        const typeEl = document.getElementById('cell-type');
        const roomEl = document.getElementById('cell-room');
        const extraInfoEl = document.getElementById('cell-extra-info');

        //Mouse click handler
        canvas.addEventListener('click', function(e) {
            //when clicked on tile, console log it
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / tileSize);
            const y = Math.floor((e.clientY - rect.top) / tileSize);

            console.log(dungeon.tiles[x][y]);
        });

        // Mouse move handler
        canvas.addEventListener('mousemove', function(e) {
            // Get the canvas position
            const rect = canvas.getBoundingClientRect();

            // Calculate the cell coordinates from the mouse position
            const x = Math.floor((e.clientX - rect.left) / tileSize);
            const y = Math.floor((e.clientY - rect.top) / tileSize);

            // Only update UI if we've moved to a different cell
            if (x !== highlightedX || y !== highlightedY) {
                // Store the new highlighted cell
                highlightedX = x;
                highlightedY = y;

                // Update the UI information
                if (x >= 0 && x < dungeon.width && y >= 0 && y < dungeon.height) {
                    // Update position display
                    positionEl.textContent = `${x}, ${y}`;

                    // Update tile type
                    const tile = dungeon.tiles[x][y];
                    typeEl.textContent = tile ? tile.type : 'unknown';

                    // Check if this cell is part of a room
                    let roomInfo = 'None';
                    for (let i = 0; i < dungeon.rooms.length; i++) {
                        const room = dungeon.rooms[i];
                        if (room.containsPoint(x, y)) {
                            roomInfo = `Room ${i} (${room.width}x${room.height})`;
                            break;
                        }
                    }
                    roomEl.textContent = roomInfo;

                    // Extra info for debugging
                    switch(tile.type) {
                        case 'door':
                            extraInfoEl.innerHTML = `<div>Facing: ${tile.obj.facing}</div>
                            <div>Locked: ${tile.obj.locked ? 'Yes' : 'No'}</div>
                            <div>Trapped: ${tile.obj.trapped ? 'Yes' : 'No'}</div>`;
                            break;
                        case 'floor':
                            if (tile.obj.creature) {
                                const creature = tile.obj.creature;
                                extraInfoEl.innerHTML = `<div>Creature: ${creature.type}</div>
                                <div>Health: ${creature.health}</div>
                                <div>Status: ${creature.asleep ? 'Asleep' : 'Awake'}</div>`;
                                if (creature.loot.length > 0){
                                    extraInfoEl.innerHTML += `<div>Loot:</div>`;
                                    for (let i = 0; i < creature.loot.length; i++){
                                        var ExtraData = "";
                                        switch (creature.loot[i].type) {
                                            case "gold":
                                                ExtraData = ` (${creature.loot[i].amount} gold)`;
                                                break;
                                            case "doorKey":
                                            case "chestKey":
                                                ExtraData = ` (${creature.loot[i].keyId})`;
                                                break;
                                            default:
                                                ExtraData = "";
                                        }
                                        extraInfoEl.innerHTML += `    <div>${creature.loot[i].type} ${ExtraData}</div>`;
                                    }
                                }
                            } else if (tile.obj.item && tile.obj.item instanceof Chest) {
                                const chest = tile.obj.item;
                                extraInfoEl.innerHTML = `<div>Chest (${chest.quality})</div>
                                <div>Locked: ${chest.locked ? 'Yes' : 'No'}</div>`;
                                if (chest.loot.length > 0){
                                    extraInfoEl.innerHTML += `<div>Loot:</div>`;
                                    for (let i = 0; i < chest.loot.length; i++){
                                        var ExtraData = "";
                                        switch (chest.loot[i].type) {
                                            case "gold":
                                                ExtraData = ` (${chest.loot[i].amount} gold)`;
                                                break;
                                            case "doorKey":
                                            case "chestKey":
                                                ExtraData = ` (${chest.loot[i].keyId})`;
                                                break;
                                            default:
                                                ExtraData = "";
                                        }
                                        extraInfoEl.innerHTML += `    <div>${chest.loot[i].type} ${ExtraData}</div>`;
                                    }
                                }

                            } else if (tile.obj.item && (tile.obj.item.type === "doorKey" || tile.obj.item.type === "chestKey")) {
                                const key = tile.obj.item;
                                extraInfoEl.innerHTML = `<div>${key.type}: (${key.keyId})</div>`;
                            } else {
                                extraInfoEl.textContent = `Trapped: ${tile.obj.trapped ? 'Yes' : 'No'}`;
                            }
                            break;
                        case 'wall':
                            extraInfoEl.textContent = 'This is a wall.';
                            break;
                        default:
                            extraInfoEl.textContent = '';
                    }
                } else {
                    // Out of bounds
                    positionEl.textContent = 'Out of bounds';
                    typeEl.textContent = '-';
                    roomEl.textContent = '-';
                    extraInfoEl.textContent = '';
                }
            }
        });

        // Handler for mouse leaving the canvas
        canvas.addEventListener('mouseleave', function() {
            highlightedX = -1;
            highlightedY = -1;
            positionEl.textContent = '-,-';
            typeEl.textContent = '-';
            roomEl.textContent = '-';
        });
    }

    update() {
        // update the rendering
    }
}

export default DungeonRenderer;
export { DungeonRenderer };