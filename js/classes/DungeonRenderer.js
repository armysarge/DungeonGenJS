import Chest from './Chest.js';

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

        // Create UI elements when renderer is initialized
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
     * Renders the dungeon based on the specified type.
     * @param {string} type - The type of rendering ('3D' for three.js 3D rendering, any other value for 2D rendering)
     * @method
     * @memberof DungeonRenderer
     */
    render(type) {
        // render the dungeon in 3D
        if (type === '3D') {
            //use three.js to render the dungeon in 3D
            this.render3D();
        } else {
            // render the dungeon in 2D
            this.render2D();
        }
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
        const canvas = document.getElementById('dungeon-container');
        const ctx = canvas.getContext('2d');
        const tileSize = 10;

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

    /**
     * Renders the dungeon in a 3D environment using Three.js library.
     * @method render3D
     * @memberof DungeonRenderer
     * @instance
     * @returns {void}
     */
    render3D() {
        // Clear and set up the scene
        this.sceneManager.createScene();

        // Create materials
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const stairsMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
        const chestMaterial = new THREE.MeshPhongMaterial({ color: 0xcd853f });
        const creatureMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

        // Create geometries
        const wallGeometry = new THREE.BoxGeometry(1, 2, 1);
        const floorGeometry = new THREE.BoxGeometry(1, 0.1, 1);
        const doorGeometry = new THREE.BoxGeometry(0.2, 1.5, 1);
        const chestGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
        const creatureGeometry = new THREE.SphereGeometry(0.3, 32, 32);

        // Center the dungeon
        const offsetX = -this.dungeon.width / 2;
        const offsetZ = -this.dungeon.height / 2;

        // Render each tile
        for (let x = 0; x < this.dungeon.width; x++) {
            for (let z = 0; z < this.dungeon.height; z++) {
                const tile = this.dungeon.tiles[x][z];
                const posX = x + offsetX;
                const posZ = z + offsetZ;

                // Add floor for all non-wall tiles
                if (tile.type !== 'wall') {
                    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                    floor.position.set(posX, 0, posZ);
                    this.sceneManager.scene.add(floor);
                }

                switch (tile.type) {
                    case 'wall':
                        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                        wall.position.set(posX, 1, posZ);
                        this.sceneManager.scene.add(wall);
                        break;

                    case 'door':
                        const door = new THREE.Mesh(doorGeometry, doorMaterial);
                        door.position.set(posX, 0.75, posZ);

                        // Rotate door based on facing direction
                        if (tile.obj.facing === 'east' || tile.obj.facing === 'west') {
                            door.rotation.y = Math.PI / 2;
                        }

                        // Add lock if door is locked
                        if (tile.obj.locked) {
                            const lockGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                            const lockMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
                            const lock = new THREE.Mesh(lockGeometry, lockMaterial);
                            lock.position.set(
                                posX + (tile.obj.facing === 'east' ? 0.2 : tile.obj.facing === 'west' ? -0.2 : 0),
                                0.75,
                                posZ + (tile.obj.facing === 'north' ? -0.2 : tile.obj.facing === 'south' ? 0.2 : 0)
                            );
                            this.sceneManager.scene.add(lock);
                        }

                        this.sceneManager.scene.add(door);
                        break;

                    case 'floor':
                        // Add items on floor
                        if (tile.obj.item) {
                            if (tile.obj.item instanceof Chest) {
                                const chest = new THREE.Mesh(chestGeometry, chestMaterial);
                                chest.position.set(posX, 0.2, posZ);
                                this.sceneManager.scene.add(chest);

                                // Add lock if chest is locked
                                if (tile.obj.item.locked) {
                                    const lockGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
                                    const lockMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
                                    const lock = new THREE.Mesh(lockGeometry, lockMaterial);
                                    lock.position.set(posX, 0.3, posZ - 0.2);
                                    this.sceneManager.scene.add(lock);
                                }
                            }
                        }

                        // Add creatures
                        if (tile.obj.creature) {
                            const creature = new THREE.Mesh(creatureGeometry, creatureMaterial);
                            creature.position.set(posX, 0.3, posZ);
                            this.sceneManager.scene.add(creature);

                            // Add sleep indicator if creature is asleep
                            if (tile.obj.creature.asleep) {
                                const sleepGeometry = new TextGeometry('z', {
                                    size: 0.2,
                                    height: 0.01
                                });
                                const sleepMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
                                const sleepText = new THREE.Mesh(sleepGeometry, sleepMaterial);
                                sleepText.position.set(posX + 0.2, 0.6, posZ - 0.1);
                                sleepText.rotation.x = -Math.PI / 4;
                                this.sceneManager.scene.add(sleepText);
                            }
                        }
                        break;

                    case 'stairs':
                        // Create stairs using multiple blocks
                        for (let i = 0; i < 4; i++) {
                            const stairStep = new THREE.Mesh(
                                new THREE.BoxGeometry(1, 0.2, 0.25),
                                stairsMaterial
                            );
                            stairStep.position.set(posX, 0.1 + (i * 0.2), posZ - 0.375 + (i * 0.25));
                            this.sceneManager.scene.add(stairStep);
                        }
                        break;
                }
            }
        }

        // Start the render loop
        this.sceneManager.updateScene();
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