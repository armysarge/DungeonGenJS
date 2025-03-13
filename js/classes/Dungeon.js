import Tile from "./Tile.js";
import Room from "./Room.js";
import Corridor from "./Corridor.js";
import Chest from './Chest.js';
import Creature from './Creature.js';
import Item from './Item.js';

/**
 * Represents a procedurally generated dungeon with rooms, corridors, and game elements.
 *
 * @class
 * @description Creates a dungeon using Binary Space Partitioning (BSP) for room layout,
 * connecting rooms with corridors, and populating the dungeon with various game elements
 * like doors, chests, creatures, and keys.
 *
 * @property {number} MAX_BSP_DEPTH - Maximum depth for BSP tree (default: 4)
 * @property {number} MIN_ROOM_WIDTH - Minimum width for generated rooms (default: 4)
 * @property {number} MIN_ROOM_HEIGHT - Minimum height for generated rooms (default: 4)
 * @property {number} MAX_ROOM_WIDTH - Maximum width for generated rooms (default: 15)
 * @property {number} MAX_ROOM_HEIGHT - Maximum height for generated rooms (default: 12)
 * @property {number} MAX_ROOMS - Maximum number of rooms to generate (default: 15)
 * @property {Array<Array<Tile>>} tiles - 2D array of tiles representing the dungeon
 * @property {Array<Room>} rooms - Array of rooms in the dungeon
 * @property {Array<Corridor>} corridors - Array of corridors connecting rooms
 * @property {Array<Chest>} chests - Array of chests placed in the dungeon
 * @property {Array<Creature>} creatures - Array of creatures placed in the dungeon
 * @property {Array<Key>} keys - Array of keys placed in the dungeon
 * @property {Array<Door>} doors - Array of doors placed in the dungeon
 * @property {Array<Room>} playerStart - Starting position of the player
 * @property {boolean} debug - Flag for debug mode
 * @property {number} borderSize - Size of the dungeon border (default: 1)
 * @property {number} seed - Random seed for dungeon generation
 * @property {Object} rng - Random number generator object
 *
 * @constructor
 * @param {number} width - The width of the dungeon
 * @param {number} height - The height of the dungeon
 * @param {number|null} [seed=null] - Optional seed for random generation
 *
 * @example
 * --Create a new 50x50 dungeon with random seed
 * const dungeon = new Dungeon(50, 50);
 *
 * --Create a dungeon with specific seed
 * const dungeon = new Dungeon(50, 50, 12345);
 */
class Dungeon {

    // BSP tree parameters
    MAX_BSP_DEPTH = 4;

    // Room size parameters
    MIN_ROOM_WIDTH = 4;
    MIN_ROOM_HEIGHT = 4;
    MAX_ROOM_WIDTH = 15;
    MAX_ROOM_HEIGHT = 12;

    // Maximum number of rooms
    MAX_ROOMS = 15;

    /**
     * Creates a new Dungeon instance.
     * @class
     * @param {number} width - The width of the dungeon.
     * @param {number} height - The height of the dungeon.
     * @param {number} [seed=null] - Optional seed for random number generation. If not provided, a random seed will be generated.
     * @property {number} width - Width of the dungeon.
     * @property {number} height - Height of the dungeon.
     * @property {Array} tiles - Collection of dungeon tiles.
     * @property {Array} rooms - Collection of dungeon rooms.
     * @property {Array} corridors - Collection of dungeon corridors.
     * @property {Array} dungeon - Main dungeon structure.
     * @property {Array} chests - Collection of treasure chests.
     * @property {Array} creatures - Collection of creatures/monsters.
     * @property {Array} keys - Collection of keys.
     * @property {Array} doors - Collection of doors.
     * @property {Object|null} playerStart - Starting position of the player.
     * @property {boolean} debug - Debug mode flag.
     * @property {number} borderSize - Size of the dungeon border.
     * @property {number} seed - Seed used for random number generation.
     * @property {Object} rng - Random number generator instance.
     */
    constructor(width, height, seed = null) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.rooms = [];
        this.corridors = [];
        this.dungeon = [];
        this.chests = [];
        this.creatures = [];
        this.keys = [];
        this.doors = [];
        this.playerStart = null; // Player starting position
        this.debug = true;

        // Add border size to track the boundary walls that should be ignored
        this.borderSize = 1;

        // Initialize with a seed directly
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 1000000);
        this.rng = this.createRNG(this.seed);

        if (this.debug) console.log(`Dungeon created with seed: ${this.seed}`);
    }

    /**
     * Generates a complete dungeon layout with rooms, corridors, and various game elements.
     * This method handles the entire dungeon generation process including:
     * - Room placement
     * - Corridor generation
     * - Door placement
     * - Chest placement
     * - Creature spawning
     * - Key placement
     * - Player and stairs positioning
     *
     * @param {number|null} newSeed - Optional seed value for random generation. If provided,
     *                               resets the random number generator with this seed.
     * @returns {number} The seed used for the dungeon generation
     *
     * @example
     * // Generate a new dungeon with a random seed
     * dungeon.generateDungeon();
     *
     * // Generate a dungeon with a specific seed
     * dungeon.generateDungeon(12345);
     */
    generateDungeon(newSeed = null) {
        // Allow regenerating with a new seed
        if (newSeed !== null) {
            this.seed = newSeed;
            this.rng = this.createRNG(this.seed);
            console.log(`Regenerating dungeon with seed: ${this.seed}`);
        }

        // Clear any existing data
        this.tiles = [];
        this.rooms = [];
        this.corridors = [];

        // Initialize all tiles as walls
        for (let i = 0; i < this.width; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < this.height; j++)
                this.tiles[i][j] = new Tile("wall", this);
        }

        this.placeRooms("BSP");
        this.placeCorridors();
        this.addCorridorVariety();
        this.placeDoors(); // Add doors after corridors are placed
        this.placeChests(); // Add chest placement after doors
        this.placeCreatures(); // Add creature placement after chests
        this.placeKeys(); // Add key placement
        this.placePlayerAndStairs(); // Add player and stairs

        if (this.debug) {
            // Debug log to check how many rooms were created and their properties
            console.log(`Generated ${this.rooms.length} rooms:`);
            this.rooms.forEach((room, i) => {
                console.log(`Room ${i}: x=${room.x}, y=${room.y}, w=${room.width}, h=${room.height}`);
            });
        }

        return this.seed; // Return the seed used for this generation
    }

    //region Random Number Generation
    /**
     * Creates a seeded random number generator object
     * @param {number} seed - The initial seed value for the RNG
     * @returns {Object} An RNG object with the following methods:
     *   - random(): Returns a pseudo-random number between 0 and 1
     *   - randomInt(min, max): Returns a pseudo-random integer between min (inclusive) and max (exclusive)
     * @description Uses a linear congruential generator algorithm with parameters:
     *   - multiplier: 9301
     *   - increment: 49297
     *   - modulus: 233280
     */
    createRNG(seed) {
        // Simple but effective seeded random number generator
        let rng = {
            // Initial seed
            _seed: seed,

            // Get a random number between 0 and 1 (like this.random())
            random() {
                this._seed = (this._seed * 9301 + 49297) % 233280;
                return this._seed / 233280;
            },

            // Get a random integer between min (inclusive) and max (exclusive)
            randomInt(min, max) {
                return Math.floor(this.random() * (max - min)) + min;
            }
        };

        return rng;
    }

    /**
     * Returns a random number between 0 and 1 using the instance's random number generator
     * @returns {number} A floating-point number in the range [0, 1)
     */
    random() {
        return this.rng.random();
    }

    /**
     * Generates a random integer between min and max (inclusive).
     * @param {number} min - The minimum value (inclusive).
     * @param {number} max - The maximum value (inclusive).
     * @returns {number} A random integer between min and max.
     */
    randomInt(min, max) {
        return this.rng.randomInt(min, max);
    }

    //region Room Placement
    /**
     * Places rooms within the dungeon using a binary space partitioning (BSP) method.
     * The process involves creating a root room that accounts for border walls,
     * recursively splitting the space, and generating actual rooms from the resulting leaves.
     * @param {string} method - The room placement method to be used (currently not implemented)
     * @returns {void}
     */
    placeRooms(method) {
        // Adjust the room placement to account for border walls
        const root = new Room(
            this.borderSize,
            this.borderSize,
            this.width - (this.borderSize * 2),
            this.height - (this.borderSize * 2),
            this
        );
        this.splitRecursively(root, 0);
        this.createRoomsFromLeaves();
    }

    /**
     * Recursively splits a room into smaller rooms using binary space partitioning (BSP).
     *
     * This method implements the BSP algorithm for dungeon generation by recursively
     * dividing rooms either horizontally or vertically. The split direction is determined
     * based on room proportions and randomness. The process continues until either:
     * - Maximum recursion depth is reached
     * - Room becomes too small to split further
     *
     * @param {Room} room - The room object to split
     * @param {number} depth - Current recursion depth
     * @returns {void} - No return value; resulting rooms are added to this.rooms array
     *
     * @example
     * // Initial call to start BSP on the main dungeon area
     * const initialRoom = new Room(0, 0, dungeonWidth, dungeonHeight, this);
     * this.splitRecursively(initialRoom, 0);
     */
    splitRecursively(room, depth) {
        // Stop recursion if we've reached maximum depth or room is too small to split
        if (depth >= this.MAX_BSP_DEPTH ||
            room.width <= this.MIN_ROOM_WIDTH * 2 ||
            room.height <= this.MIN_ROOM_HEIGHT * 2) {
            this.rooms.push(room);
            return;
        }

        // Determine split direction - horizontal or vertical
        let splitHorizontally = this.random() > 0.5;

        // Force split direction based on room proportions
        if (room.width > room.height * 1.25) {
            splitHorizontally = false; // Split vertically if room is much wider
        } else if (room.height > room.width * 1.25) {
            splitHorizontally = true;  // Split horizontally if room is much taller
        }

        // Calculate split position with some randomness
        // But ensure minimum size for both resulting rooms
        let splitPosition;

        if (splitHorizontally) {
            // Horizontal split (creates top and bottom rooms)
            const minY = room.y + this.MIN_ROOM_HEIGHT;
            const maxY = room.y + room.height - this.MIN_ROOM_HEIGHT;

            if (maxY - minY < 1) {
                this.rooms.push(room); // Room too small to split
                return;
            }

            splitPosition = Math.floor(minY + this.random() * (maxY - minY));

            // Create two rooms from the split
            const roomTop = new Room(
                room.x,
                room.y,
                room.width,
                splitPosition - room.y,
                this
            );

            const roomBottom = new Room(
                room.x,
                splitPosition,
                room.width,
                room.y + room.height - splitPosition,
                this
            );

            // Continue recursively splitting
            this.splitRecursively(roomTop, depth + 1);
            this.splitRecursively(roomBottom, depth + 1);
        } else {
            // Vertical split (creates left and right rooms)
            const minX = room.x + this.MIN_ROOM_WIDTH;
            const maxX = room.x + room.width - this.MIN_ROOM_WIDTH;

            if (maxX - minX < 1) {
                this.rooms.push(room); // Room too small to split
                return;
            }

            splitPosition = Math.floor(minX + this.random() * (maxX - minX));

            // Create two rooms from the split
            const roomLeft = new Room(
                room.x,
                room.y,
                splitPosition - room.x,
                room.height,
                this
            );

            const roomRight = new Room(
                splitPosition,
                room.y,
                room.x + room.width - splitPosition,
                room.height,
                this
            );

            // Continue recursively splitting
            this.splitRecursively(roomLeft, depth + 1);
            this.splitRecursively(roomRight, depth + 1);
        }
    }

    /**
     * Creates rooms from BSP leaves with controlled size and distribution.
     * This method:
     * 1. Takes previously generated BSP leaves and converts them to actual dungeon rooms
     * 2. Randomizes leaf selection and limits total rooms to MAX_ROOMS
     * 3. Applies padding within each leaf to ensure walls between rooms
     * 4. Controls room size within MIN/MAX constraints while adding variation
     * 5. Centers each room within its leaf
     * 6. Carves the room into the dungeon map
     *
     * The BSP tree structure naturally prevents room overlap, so no additional
     * collision detection is needed.
     *
     * @returns {void} - Updates the dungeon's rooms array with the generated rooms
     */
    createRoomsFromLeaves() {
        const actualRooms = [];
        const bspLeaves = [...this.rooms]; // Store BSP leaves
        this.rooms = []; // Clear current rooms array

        // Shuffle the BSP leaves to randomize which ones we pick if we have more than MAX_ROOMS
        const shuffledLeaves = [...bspLeaves].sort(() => this.random() - 0.5);

        // Create rooms in the leaves, up to MAX_ROOMS limit
        for (const leaf of shuffledLeaves) {
            // Stop if we've reached the maximum number of rooms
            if (actualRooms.length >= this.MAX_ROOMS) {
                break;
            }

            // Add some padding inside each leaf for walls
            const padding = 1; // Reduced padding to allow more room space

            // Only create room if there's enough space after padding
            if (leaf.width > padding * 2 + 3 && leaf.height > padding * 2 + 3) {
                // Calculate maximum possible dimensions for this room
                // Don't exceed MAX_ROOM dimensions
                const maxWidth = Math.min(leaf.width - padding * 2, this.MAX_ROOM_WIDTH);
                const maxHeight = Math.min(leaf.height - padding * 2, this.MAX_ROOM_HEIGHT);

                // Create room with more consistent sizing
                const finalWidth = Math.max(
                    this.MIN_ROOM_WIDTH,
                    Math.floor(maxWidth * 0.7) + Math.floor(this.random() * (maxWidth * 0.3))
                );
                const finalHeight = Math.max(
                    this.MIN_ROOM_HEIGHT,
                    Math.floor(maxHeight * 0.7) + Math.floor(this.random() * (maxHeight * 0.3))
                );

                // Position room within leaf with padding
                const roomX = leaf.x + Math.floor((leaf.width - finalWidth) / 2);
                const roomY = leaf.y + Math.floor((leaf.height - finalHeight) / 2);

                // Create the actual room
                const room = new Room(roomX, roomY, finalWidth, finalHeight, this);

                // Since BSP naturally prevents rooms from overlapping in their own cells,
                // we can skip the overlap check for better performance

                // Carve out the room in the dungeon
                this.carveRoom(room);

                // Save the actual room
                actualRooms.push(room);

                if (this.debug) {
                    console.log(`Created room at (${roomX}, ${roomY}) with size ${finalWidth}x${finalHeight}`);
                }
            }
        }

        // Store the actual rooms
        this.rooms = actualRooms;

        if (this.debug) console.log(`Generated ${this.rooms.length} rooms`);
    }

    /**
     * Builds an accessibility graph representing connections between rooms.
     *
     * @returns {Map<number, number[]>} A graph where keys are room indices and values are arrays of connected room indices.
     * Each room is represented by its index in the dungeon's room array.
     * Connections are bidirectional and only exist through unlocked doors.
     */
    buildAccessibilityGraph() {
        // Create graph where each room is a node and unlocked doors are edges
        const graph = new Map();

        // Initialize graph with all rooms
        for (let i = 0; i < this.rooms.length; i++) {
            graph.set(i, []);
        }

        // Find connections via unlocked doors
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const tile = this.tiles[x][y];

                // Only consider unlocked doors
                if (tile.type === 'door' && !tile.obj.locked) {
                    const doorRoom = tile.obj.room;
                    const doorRoomIndex = this.rooms.findIndex(room => room === doorRoom);

                    // Find which room(s) this door connects to
                    const directions = [
                        { dx: 0, dy: -1 }, // North
                        { dx: 1, dy: 0 },  // East
                        { dx: 0, dy: 1 },  // South
                        { dx: -1, dy: 0 }  // West
                    ];

                    for (const dir of directions) {
                        const nx = x + dir.dx;
                        const ny = y + dir.dy;

                        if (this.isValidPosition(nx, ny) && this.tiles[nx][ny].type === 'floor') {
                            // Find if this position is in a room
                            for (let i = 0; i < this.rooms.length; i++) {
                                const room = this.rooms[i];
                                if (room.containsPoint(nx, ny) && room !== doorRoom) {
                                    // Add connection between rooms
                                    graph.get(doorRoomIndex).push(i);
                                    graph.get(i).push(doorRoomIndex);
                                }
                            }
                        }
                    }
                }
            }
        }

        return graph;
    }

    /**
     * Finds all rooms that are accessible from a starting room using breadth-first search.
     *
     * @param {number} startRoomIndex - The index of the starting room.
     * @param {Map<number, Array<number>>} graph - A graph representation where keys are room indices and values are arrays of connected room indices.
     * @returns {Set<number>} - A set containing the indices of all rooms that can be reached from the starting room.
     */
    findAccessibleRooms(startRoomIndex, graph) {
        const visited = new Set();
        const queue = [startRoomIndex];
        visited.add(startRoomIndex);

        while (queue.length > 0) {
            const currentRoom = queue.shift();

            for (const neighbor of graph.get(currentRoom)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return visited;
    }

    /**
     * Retrieves the room that contains the specified coordinates.
     *
     * @param {number} x - The x-coordinate to check.
     * @param {number} y - The y-coordinate to check.
     * @returns {Room|null} The room that contains the point (x, y), or null if no room contains the point.
     */
    getRoomForPosition(x, y) {
        for (const room of this.rooms) {
            if (room.containsPoint(x, y)) {
                return room;
            }
        }
        return null;
    }

    /**
     * Carves out a room in the dungeon by setting floor tiles.
     * @param {Object} room - The room object to carve.
     * @param {number} room.x - The x-coordinate of the top-left corner of the room.
     * @param {number} room.y - The y-coordinate of the top-left corner of the room.
     * @param {number} room.width - The width of the room.
     * @param {number} room.height - The height of the room.
     */
    carveRoom(room) {
        for (let x = room.x; x < room.x + room.width; x++) {
            for (let y = room.y; y < room.y + room.height; y++) {
                if (this.isValidPosition(x, y)) {
                    this.tiles[x][y] = new Tile("floor",this);
                }
            }
        }
    }

    /**
     * Checks if the given coordinates are part of any room in the dungeon
     *
     * @param {number} x - The x coordinate to check
     * @param {number} y - The y coordinate to check
     * @returns {boolean} True if the point is inside any room, false otherwise
     */
    isPartOfRoom(x, y) {
        for (const room of this.rooms) {
            if (room.containsPoint(x, y)) {
                return true;
            }
        }
        return false;
    }

    //region Corridor Placement
    /**
     * Places corridors between rooms in the dungeon using a modified Prim's algorithm.
     * Creates a minimum spanning tree of corridors to ensure all rooms are connected,
     * then adds additional corridors to create some loops for alternate paths.
     *
     * The algorithm works as follows:
     * 1. Sorts all possible room pairs by Manhattan distance
     * 2. Creates a minimum spanning tree by connecting the closest unconnected rooms
     * 3. Adds extra corridors between already connected rooms to create loops
     *
     * The number of extra corridors is calculated as max(1, floor(numberOfRooms/10))
     * to ensure reasonable pathway alternatives without overcrowding.
     *
     * @method placeCorridors
     * @memberof DungeonGenerator
     * @instance
     * @returns {void} Updates the internal corridors array with new corridor objects
     */
    placeCorridors() {
        // Reset corridors array
        this.corridors = [];

        // First, mark all rooms as not connected
        this.rooms.forEach(room => {
            room.connected = false;
        });

        // Start with the first room as connected
        if (this.rooms.length > 0)
            this.rooms[0].connected = true;

        // Create a minimum spanning tree to ensure all rooms are connected
        // We'll use Prim's algorithm to build a MST with the rooms

        // First, sort rooms based on distance to create more natural corridor paths
        const sortedPairs = [];
        for (let i = 0; i < this.rooms.length; i++) {
            for (let j = i + 1; j < this.rooms.length; j++) {
                const roomA = this.rooms[i];
                const roomB = this.rooms[j];
                const centerA = roomA.getCenter();
                const centerB = roomB.getCenter();

                // Calculate Manhattan distance between room centers
                const distance =
                    Math.abs(centerA.x - centerB.x) +
                    Math.abs(centerA.y - centerB.y);

                sortedPairs.push({
                    roomA,
                    roomB,
                    distance
                });
            }
        }

        // Sort pairs by distance (ascending)
        sortedPairs.sort((a, b) => a.distance - b.distance);

        // Connect rooms using MST-like approach
        const connections = [];
        let connectedCount = 1; // We already marked the first room as connected

        // Continue until all rooms are connected
        while (connectedCount < this.rooms.length && sortedPairs.length > 0) {
            // Find the closest pair where exactly one room is already connected
            for (let i = 0; i < sortedPairs.length; i++) {
                const { roomA, roomB } = sortedPairs[i];

                // If one room is connected and the other isn't, we can connect them
                if (roomA.connected && !roomB.connected) {
                    // Create corridor between rooms
                    const corridor = this.createCorridor(roomA, roomB);
                    if (corridor) {
                        this.corridors.push(corridor);
                        connections.push({ from: roomA, to: roomB });
                        roomB.connected = true;
                        connectedCount++;

                        if (this.debug)
                            console.log(`Connected room at (${roomB.x}, ${roomB.y}) to the network`);
                    }

                    // Remove this pair from the sorted list
                    sortedPairs.splice(i, 1);
                    break;
                }
                else if (!roomA.connected && roomB.connected) {
                    // Create corridor between rooms
                    const corridor = this.createCorridor(roomB, roomA);
                    if (corridor) {
                        this.corridors.push(corridor);
                        connections.push({ from: roomB, to: roomA });
                        roomA.connected = true;
                        connectedCount++;

                        if (this.debug)
                            console.log(`Connected room at (${roomA.x}, ${roomA.y}) to the network`);
                    }

                    // Remove this pair from the sorted list
                    sortedPairs.splice(i, 1);
                    break;
                }
                // Skip pairs where both rooms are either connected or disconnected
            }
        }

        // Add a small number of extra corridors to create some loops (not strictly MST)
        // This adds more pathways without overwhelming the dungeon with corridors
        const extraCorridors = Math.max(1, Math.floor(this.rooms.length / 10));

        // Pick the closest pairs that don't already have corridors between them
        let extraCount = 0;
        for (let i = 0; i < sortedPairs.length && extraCount < extraCorridors; i++) {
            const { roomA, roomB } = sortedPairs[i];

            // Only connect rooms that are already part of the network
            if (roomA.connected && roomB.connected) {
                // Check if these rooms are already directly connected
                const alreadyConnected = connections.some(
                    c => (c.from === roomA && c.to === roomB) ||
                            (c.from === roomB && c.to === roomA)
                );

                if (!alreadyConnected) {
                    const corridor = this.createCorridor(roomA, roomB);
                    if (corridor) {
                        this.corridors.push(corridor);
                        extraCount++;
                    }
                }
            }
        }

        // Verify final connectivity
        if (this.debug) {
            const connectedCount = this.rooms.filter(room => room.connected).length;
            console.log(`Connectivity check: ${connectedCount}/${this.rooms.length} rooms connected`);
            console.log(`Created ${this.corridors.length} corridors`);
        }
    }

    /**
     * Creates a corridor connecting two rooms in the dungeon.
     *
     * Makes multiple attempts to create a valid corridor between the rooms.
     * For each attempt, it finds suitable door positions on both rooms
     * and tries to create a path between them. If all attempts fail,
     * it falls back to creating a direct path as a last resort.
     *
     * @param {Room} roomA - The first room to connect
     * @param {Room} roomB - The second room to connect
     * @returns {Corridor|null} The created corridor object, or null if creation fails
     */
    createCorridor(roomA, roomB) {
        // Allow multiple attempts to create a corridor that doesn't run alongside
        const maxAttempts = 3;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Find the best door positions on each room to connect them
            const doorA = this.findBestDoorPosition(roomA, roomB, attempt);
            const doorB = this.findBestDoorPosition(roomB, roomA, attempt);

            // Ensure points are within valid dungeon area
            if (!this.isValidPosition(doorA.x, doorA.y) || !this.isValidPosition(doorB.x, doorB.y)) {
                continue;
            }

            // Create a new corridor object
            const corridor = new Corridor(
                { x: doorA.x, y: doorA.y },
                { x: doorB.x, y: doorB.y },
                this
            );

            // Try both types of paths
            let success = this.tryCorridorPath(corridor);

            if (success) {
                return corridor;
            }
        }

        // If all attempts fail, create a direct path as a fallback
        const doorA = this.findBestDoorPosition(roomA, roomB, 0);
        const doorB = this.findBestDoorPosition(roomB, roomA, 0);

        if (!this.isValidPosition(doorA.x, doorA.y) || !this.isValidPosition(doorB.x, doorB.y)) {
            return null;
        }

        const corridor = new Corridor(
            { x: doorA.x, y: doorA.y },
            { x: doorB.x, y: doorB.y },
            this
        );

        // Use direct path as last resort
        this.createDirectPath(doorA.x, doorA.y, doorB.x, doorB.y);
        return corridor;
    }

    /**
     * Attempts to create a viable corridor path between two points.
     *
     * First tries a horizontal-then-vertical path. If that fails,
     * attempts a vertical-then-horizontal path.
     *
     * @param {Corridor} corridor - The corridor object containing start and end points
     * @returns {boolean} True if a valid path was created, false otherwise
     */
    tryCorridorPath(corridor) {
        // First try horizontal-vertical
        const hvWorked = this.attemptHorizontalVerticalPath(corridor);
        if (hvWorked) return true;

        // Then try vertical-horizontal
        const vhWorked = this.attemptVerticalHorizontalPath(corridor);
        if (vhWorked) return true;

        return false;
    }

    /**
     * Creates a corridor by first moving horizontally from the start point, then vertically to the end point.
     * Attempts to merge with existing corridors where possible and avoids running alongside existing rooms/corridors.
     *
     * @param {Object} corridor - The corridor object containing start and end points
     * @param {Object} corridor.start - The starting point of the corridor
     * @param {Object} corridor.start.x - The x-coordinate of the starting point
     * @param {Object} corridor.start.y - The y-coordinate of the starting point
     * @param {Object} corridor.end - The ending point of the corridor
     * @param {Object} corridor.end.x - The x-coordinate of the ending point
     * @param {Object} corridor.end.y - The y-coordinate of the ending point
     * @param {number} [recursionCount=0] - Counter to prevent infinite recursion between path carving methods
     * @returns {void}
     */
    carveHorizontalVerticalPath(corridor, recursionCount = 0) {
        const { start, end } = corridor;

        // Prevent infinite recursion
        if (recursionCount >= 3) {
            // Simply create a direct path if we've tried to recurse too many times
            this.createDirectPath(start.x, start.y, end.x, end.y);
            return;
        }

        // First check if we can merge with an existing corridor during horizontal movement
        let horizontalMergePoint = this.findCorridorMergePoint(start.x, start.y, end.x, start.y);

        if (horizontalMergePoint) {
            // We found a merge point - use it instead of the standard approach

            // Carve horizontal corridor up to the merge point
            let currentX = start.x;
            const mergeX = horizontalMergePoint.x;

            while (currentX !== mergeX) {
                if (this.isValidPosition(currentX, start.y)) {
                    this.tiles[currentX][start.y] = new Tile("floor",this);
                }
                currentX += start.x < mergeX ? 1 : -1;
            }

            // From merge point, find path to destination
            this.findAndCarvePath(mergeX, start.y, end.x, end.y);
            return;
        }

        // Check if this corridor would run alongside rooms or other corridors
        const wouldRunAlongside = this.corridorWouldRunAlongside(
            start.x, start.y, end.x, start.y
        );

        // If corridor would run alongside something, try the alternative path
        if (wouldRunAlongside) {
            this.carveVerticalHorizontalPath(corridor, recursionCount + 1);
            return;
        }

        // Standard horizontal-then-vertical path if no special cases apply
        let currentX = start.x;
        const horizontalEndX = end.x;

        // Carve horizontal corridor
        while (currentX !== horizontalEndX) {
            if (this.isValidPosition(currentX, start.y)) {
                this.tiles[currentX][start.y] = new Tile("floor",this);
            }
            currentX += start.x < horizontalEndX ? 1 : -1;
        }

        // Carve vertical corridor
        let currentY = start.y;
        const verticalEndY = end.y;

        while (currentY !== verticalEndY) {
            if (this.isValidPosition(end.x, currentY)) {
                this.tiles[end.x][currentY] = new Tile("floor",this);
            }
            currentY += start.y < verticalEndY ? 1 : -1;
        }
    }

    /**
     * Creates a path from start to end by first moving vertically, then horizontally.
     * This method uses several strategies to create more natural-looking paths:
     * 1. Tries to merge with existing corridors during the vertical movement
     * 2. Avoids creating paths that run alongside rooms or other corridors
     * 3. Falls back to alternative path patterns if needed
     * 4. Limits recursion to prevent infinite loops
     *
     * @param {Object} corridor - The corridor object containing start and end points
     * @param {Object} corridor.start - The starting point of the corridor
     * @param {Object} corridor.start.x - X coordinate of the starting point
     * @param {Object} corridor.start.y - Y coordinate of the starting point
     * @param {Object} corridor.end - The ending point of the corridor
     * @param {Object} corridor.end.x - X coordinate of the ending point
     * @param {Object} corridor.end.y - Y coordinate of the ending point
     * @param {number} recursionCount - Tracks recursion depth to prevent infinite loops
     * @returns {void} - Modifies the dungeon tiles directly
     */
    carveVerticalHorizontalPath(corridor, recursionCount = 0) {
        const { start, end } = corridor;

        // Prevent infinite recursion
        if (recursionCount >= 3) {
            // Simply create a direct path if we've tried to recurse too many times
            this.createDirectPath(start.x, start.y, end.x, end.y);
            return;
        }

        // First check if we can merge with an existing corridor during vertical movement
        let verticalMergePoint = this.findCorridorMergePoint(start.x, start.y, start.x, end.y);

        if (verticalMergePoint) {
            // We found a merge point - use it instead of the standard approach

            // Carve vertical corridor up to the merge point
            let currentY = start.y;
            const mergeY = verticalMergePoint.y;

            while (currentY !== mergeY) {
                if (this.isValidPosition(start.x, currentY)) {
                    this.tiles[start.x][currentY] = new Tile("floor", this);
                }
                currentY += start.y < mergeY ? 1 : -1;
            }

            // From merge point, find path to destination
            this.findAndCarvePath(start.x, mergeY, end.x, end.y);
            return;
        }

        // Check if this corridor would run alongside rooms or other corridors
        const wouldRunAlongside = this.corridorWouldRunAlongside(
            start.x, start.y, start.x, end.y
        );

        // If corridor would run alongside something, try the alternative path
        if (wouldRunAlongside) {
            this.carveHorizontalVerticalPath(corridor, recursionCount + 1);
            return;
        }

        // Standard vertical-then-horizontal path if no special cases apply
        let currentY = start.y;
        const verticalEndY = end.y;

        // Carve vertical corridor
        while (currentY !== verticalEndY) {
            if (this.isValidPosition(start.x, currentY)) {
                this.tiles[start.x][currentY] = new Tile("floor", this);
            }
            currentY += start.y < verticalEndY ? 1 : -1;
        }

        // Carve horizontal corridor
        let currentX = start.x;
        const horizontalEndX = end.x;

        while (currentX !== horizontalEndX) {
            if (this.isValidPosition(currentX, end.y)) {
                this.tiles[currentX][end.y] = new Tile("floor", this);
            }
            currentX += start.x < horizontalEndX ? 1 : -1;
        }
    }

    /**
     * Attempts to create a corridor path that follows a horizontal then vertical trajectory.
     * This method validates that the corridor won't run alongside existing structures
     * before carving the path.
     *
     * @param {Object} corridor - The corridor object containing start and end points
     * @param {Object} corridor.start - The starting point of the corridor
     * @param {number} corridor.start.x - The x-coordinate of the starting point
     * @param {number} corridor.start.y - The y-coordinate of the starting point
     * @param {Object} corridor.end - The ending point of the corridor
     * @param {number} corridor.end.x - The x-coordinate of the ending point
     * @param {number} corridor.end.y - The y-coordinate of the ending point
     * @returns {boolean} - Returns true if the path was successfully created, false otherwise
     */
    attemptHorizontalVerticalPath(corridor) {
        const { start, end } = corridor;

        // Check if this corridor would run alongside rooms or corridors
        const wouldRunAlongside = this.corridorWouldRunAlongside(
            start.x, start.y, end.x, start.y
        );

        if (wouldRunAlongside) return false;

        const wouldVerticalRunAlongside = this.corridorWouldRunAlongside(
            end.x, start.y, end.x, end.y
        );

        if (wouldVerticalRunAlongside) return false;

        // It's safe to create this path
        let currentX = start.x;
        const horizontalEndX = end.x;

        // Carve horizontal corridor
        while (currentX !== horizontalEndX) {
            if (this.isValidPosition(currentX, start.y)) {
                this.tiles[currentX][start.y] = new Tile("floor", this);
            }
            currentX += start.x < horizontalEndX ? 1 : -1;
        }

        // Carve vertical corridor
        let currentY = start.y;
        const verticalEndY = end.y;

        while (currentY !== verticalEndY) {
            if (this.isValidPosition(end.x, currentY)) {
                this.tiles[end.x][currentY] = new Tile("floor", this);
            }
            currentY += start.y < verticalEndY ? 1 : -1;
        }

        return true;
    }

    /**
     * Attempts to create an L-shaped corridor path by first moving vertically from start point,
     * then horizontally to the end point.
     *
     * @param {Object} corridor - The corridor object containing start and end points.
     * @param {Object} corridor.start - The starting point of the corridor.
     * @param {Object} corridor.start.x - The x-coordinate of the starting point.
     * @param {Object} corridor.start.y - The y-coordinate of the starting point.
     * @param {Object} corridor.end - The ending point of the corridor.
     * @param {Object} corridor.end.x - The x-coordinate of the ending point.
     * @param {Object} corridor.end.y - The y-coordinate of the ending point.
     * @returns {boolean} - Returns true if the corridor was successfully created, false if it would
     *                      run alongside other rooms or corridors.
     */
    attemptVerticalHorizontalPath(corridor) {
        const { start, end } = corridor;

        // Check if this corridor would run alongside rooms or corridors
        const wouldRunAlongside = this.corridorWouldRunAlongside(
            start.x, start.y, start.x, end.y
        );

        if (wouldRunAlongside) return false;

        const wouldHorizontalRunAlongside = this.corridorWouldRunAlongside(
            start.x, end.y, end.x, end.y
        );

        if (wouldHorizontalRunAlongside) return false;

        // It's safe to create this path
        let currentY = start.y;
        const verticalEndY = end.y;

        // Carve vertical corridor
        while (currentY !== verticalEndY) {
            if (this.isValidPosition(start.x, currentY)) {
                this.tiles[start.x][currentY] = new Tile("floor", this);
            }
            currentY += start.y < verticalEndY ? 1 : -1;
        }

        // Carve horizontal corridor
        let currentX = start.x;
        const horizontalEndX = end.x;

        while (currentX !== horizontalEndX) {
            if (this.isValidPosition(currentX, end.y)) {
                this.tiles[currentX][end.y] = new Tile("floor", this);
            }
            currentX += start.x < horizontalEndX ? 1 : -1;
        }

        return true;
    }

    /**
     * Creates an L-shaped path from point (x1, y1) to point (x2, y2).
     * The path first moves horizontally from the starting point until it reaches the target x-coordinate,
     * then it moves vertically until it reaches the target y-coordinate.
     * Each cell along the path is set to a floor tile if the position is valid.
     *
     * @param {number} x1 - The x-coordinate of the starting point
     * @param {number} y1 - The y-coordinate of the starting point
     * @param {number} x2 - The x-coordinate of the ending point
     * @param {number} y2 - The y-coordinate of the ending point
     */
    createDirectPath(x1, y1, x2, y2) {
        // Simple L-shaped path with no additional checks
        // First horizontal then vertical
        let currentX = x1;
        while (currentX !== x2) {
            if (this.isValidPosition(currentX, y1)) {
                this.tiles[currentX][y1] = new Tile("floor", this);
            }
            currentX += x1 < x2 ? 1 : -1;
        }

        let currentY = y1;
        while (currentY !== y2) {
            if (this.isValidPosition(x2, currentY)) {
                this.tiles[x2][currentY] = new Tile("floor", this);
            }
            currentY += y1 < y2 ? 1 : -1;
        }
    }

    /**
     * Finds a point where a proposed corridor between two points can merge with an existing corridor.
     * Checks for valid merge points along the path, looking for existing floor tiles that aren't part of a room.
     * Only works for perfectly horizontal or vertical corridors.
     *
     * @param {number} x1 - X-coordinate of the first point
     * @param {number} y1 - Y-coordinate of the first point
     * @param {number} x2 - X-coordinate of the second point
     * @param {number} y2 - Y-coordinate of the second point
     * @returns {Object|null} - An object containing {x, y} coordinates of the merge point, or null if no valid merge point was found
     */
    findCorridorMergePoint(x1, y1, x2, y2) {
        // Ensure valid inputs to prevent recursion issues
        if (!this.isValidPosition(x1, y1) || !this.isValidPosition(x2, y2)) {
            return null;
        }

        // For horizontal corridors
        if (y1 === y2) {
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);

            // Skip if path is too short
            if (endX - startX <= 2) return null;

            for (let x = startX + 1; x < endX; x++) {
                // Look above and below for corridor tiles
                if (this.isValidPosition(x, y1 - 1) &&
                    this.tiles[x][y1 - 1].type === "floor" &&
                    !this.isPartOfRoom(x, y1 - 1)) {
                    return { x, y: y1 };
                }

                if (this.isValidPosition(x, y1 + 1) &&
                    this.tiles[x][y1 + 1].type === "floor" &&
                    !this.isPartOfRoom(x, y1 + 1)) {
                    return { x, y: y1 };
                }

                // Also check the path itself for existing floor tiles (direct merge)
                if (this.isValidPosition(x, y1) &&
                    this.tiles[x][y1].type === "floor") {
                    return { x, y: y1 };
                }
            }
        }

        // For vertical corridors
        if (x1 === x2) {
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);

            // Skip if path is too short
            if (endY - startY <= 2) return null;

            for (let y = startY + 1; y < endY; y++) {
                // Look left and right for corridor tiles
                if (this.isValidPosition(x1 - 1, y) &&
                    this.tiles[x1 - 1][y].type === "floor" &&
                    !this.isPartOfRoom(x1 - 1, y)) {
                    return { x: x1, y };
                }

                if (this.isValidPosition(x1 + 1, y) &&
                    this.tiles[x1 + 1][y].type === "floor" &&
                    !this.isPartOfRoom(x1 + 1, y)) {
                    return { x: x1, y };
                }

                // Also check the path itself for existing floor tiles (direct merge)
                if (this.isValidPosition(x1, y) &&
                    this.tiles[x1][y].type === "floor") {
                    return { x: x1, y };
                }
            }
        }

        return null;
    }

    /**
     * Checks if a potential corridor would run alongside an existing room or corridor.
     *
     * This function determines whether a corridor from (x1,y1) to (x2,y2) would be
     * adjacent to any existing room or corridor. It prevents the generation of
     * corridors that would run parallel to existing structures, which helps create
     * more interesting dungeon layouts by avoiding redundant pathways.
     *
     * The function handles both horizontal and vertical corridors separately:
     * - For horizontal corridors: Checks tiles above and below the proposed corridor
     * - For vertical corridors: Checks tiles to the left and right of the proposed corridor
     *
     * @param {number} x1 - X-coordinate of the starting point
     * @param {number} y1 - Y-coordinate of the starting point
     * @param {number} x2 - X-coordinate of the ending point
     * @param {number} y2 - Y-coordinate of the ending point
     * @returns {boolean} True if the corridor would run alongside an existing structure,
     *                    false otherwise (meaning it's safe to build the corridor)
     */
    corridorWouldRunAlongside(x1, y1, x2, y2) {
        // Check if a corridor from (x1,y1) to (x2,y2) would run alongside any room or corridor
        const checkDistance = 1; // Reduce to 1 for more precise checks

        // For horizontal corridors
        if (y1 === y2) {
            const startX = Math.min(x1, x2);
            const endX = Math.max(x1, x2);

            // Skip very short corridors
            if (endX - startX <= 1) return false;

            // Check for rooms alongside
            for (const room of this.rooms) {
                // Check if corridor runs along the north or south wall of the room
                // More precise check: only detect exact adjacency (distance of 1)
                if ((y1 === room.y - 1 || y1 === room.y + room.height) &&
                    !(startX + 1 >= room.x + room.width || endX - 1 <= room.x)) {
                    return true;
                }
            }

            // Check for corridors alongside (more thorough check)
            for (let x = startX; x <= endX; x++) {
                // Check one tile above and below for corridor
                if (this.isValidPosition(x, y1 - 1) &&
                    this.tiles[x][y1 - 1].type === "floor" &&
                    !this.isPartOfRoom(x, y1 - 1)) {
                    // Count consecutive parallel corridor tiles
                    let parallelCount = 0;
                    for (let dx = 0; dx < 3 && x + dx <= endX; dx++) {
                        if (this.isValidPosition(x + dx, y1 - 1) &&
                            this.tiles[x + dx][y1 - 1].type === "floor" &&
                            !this.isPartOfRoom(x + dx, y1 - 1)) {
                            parallelCount++;
                        }
                    }
                    if (parallelCount >= 2) return true;  // Only flag as alongside if there are multiple parallel tiles
                }

                if (this.isValidPosition(x, y1 + 1) &&
                    this.tiles[x][y1 + 1].type === "floor" &&
                    !this.isPartOfRoom(x, y1 + 1)) {
                    // Count consecutive parallel corridor tiles
                    let parallelCount = 0;
                    for (let dx = 0; dx < 3 && x + dx <= endX; dx++) {
                        if (this.isValidPosition(x + dx, y1 + 1) &&
                            this.tiles[x + dx][y1 + 1].type === "floor" &&
                            !this.isPartOfRoom(x + dx, y1 + 1)) {
                            parallelCount++;
                        }
                    }
                    if (parallelCount >= 2) return true;  // Only flag as alongside if there are multiple parallel tiles
                }
            }
        }

        // For vertical corridors
        if (x1 === x2) {
            const startY = Math.min(y1, y2);
            const endY = Math.max(y1, y2);

            // Skip very short corridors
            if (endY - startY <= 1) return false;

            // Check for rooms alongside
            for (const room of this.rooms) {
                // Check if corridor runs along the east or west wall of the room
                // More precise check: only detect exact adjacency (distance of 1)
                if ((x1 === room.x - 1 || x1 === room.x + room.width) &&
                    !(startY + 1 >= room.y + room.height || endY - 1 <= room.y)) {
                    return true;
                }
            }

            // Check for corridors alongside (more thorough check)
            for (let y = startY; y <= endY; y++) {
                // Check one tile to the left and right for corridor
                if (this.isValidPosition(x1 - 1, y) &&
                    this.tiles[x1 - 1][y].type === "floor" &&
                    !this.isPartOfRoom(x1 - 1, y)) {
                    // Count consecutive parallel corridor tiles
                    let parallelCount = 0;
                    for (let dy = 0; dy < 3 && y + dy <= endY; dy++) {
                        if (this.isValidPosition(x1 - 1, y + dy) &&
                            this.tiles[x1 - 1][y + dy].type === "floor" &&
                            !this.isPartOfRoom(x1 - 1, y + dy)) {
                            parallelCount++;
                        }
                    }
                    if (parallelCount >= 2) return true;  // Only flag as alongside if there are multiple parallel tiles
                }

                if (this.isValidPosition(x1 + 1, y) &&
                    this.tiles[x1 + 1][y].type === "floor" &&
                    !this.isPartOfRoom(x1 + 1, y)) {
                    // Count consecutive parallel corridor tiles
                    let parallelCount = 0;
                    for (let dy = 0; dy < 3 && y + dy <= endY; dy++) {
                        if (this.isValidPosition(x1 + 1, y + dy) &&
                            this.tiles[x1 + 1][y + dy].type === "floor" &&
                            !this.isPartOfRoom(x1 + 1, y + dy)) {
                            parallelCount++;
                        }
                    }
                    if (parallelCount >= 2) return true;  // Only flag as alongside if there are multiple parallel tiles
                }
            }
        }

        return false;
    }

    /**
     * Carves an L-shaped path between two points in the dungeon.
     * Randomly chooses between carving horizontally then vertically, or vertically then horizontally.
     *
     * @param {number} startX - The starting X coordinate of the path
     * @param {number} startY - The starting Y coordinate of the path
     * @param {number} endX - The ending X coordinate of the path
     * @param {number} endY - The ending Y coordinate of the path
     * @returns {void} - Modifies the tiles array in place by setting path tiles to floor type
     */
    findAndCarvePath(startX, startY, endX, endY) {
        // Simple L-shaped path from start to end
        if (this.random() > 0.5) {
            // Horizontal then vertical
            let currentX = startX;
            while (currentX !== endX) {
                if (this.isValidPosition(currentX, startY)) {
                    this.tiles[currentX][startY] = new Tile("floor", this);
                }
                currentX += startX < endX ? 1 : -1;
            }

            let currentY = startY;
            while (currentY !== endY) {
                if (this.isValidPosition(endX, currentY)) {
                    this.tiles[endX][currentY] = new Tile("floor", this);
                }
                currentY += startY < endY ? 1 : -1;
            }
        } else {
            // Vertical then horizontal
            let currentY = startY;
            while (currentY !== endY) {
                if (this.isValidPosition(startX, currentY)) {
                    this.tiles[startX][currentY] = new Tile("floor", this);
                }
                currentY += startY < endY ? 1 : -1;
            }

            let currentX = startX;
            while (currentX !== endX) {
                if (this.isValidPosition(currentX, endY)) {
                    this.tiles[currentX][endY] = new Tile("floor", this);
                }
                currentX += startX < endX ? 1 : -1;
            }
        }
    }

    /**
     * Adds variety to long straight corridors by adding alcoves, rest areas and decorations.
     * Should be called after corridor placement but before door placement.
     */
    addCorridorVariety() {
        // First identify all long straight corridors
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.isLongStraightCorridor(x, y) && this.random() < 0.5) { // 50% chance to add variety
                    const orientation = this.getCorridorOrientation(x, y);
                    if (orientation === 'horizontal') {
                        this.addVarietyToHorizontalCorridor(x, y);
                    } else if (orientation === 'vertical') {
                        this.addVarietyToVerticalCorridor(x, y);
                    }
                }
            }
        }
    }

    /**
     * Checks if a position is part of a long straight corridor.
     * @param {number} x - Starting x coordinate
     * @param {number} y - Starting y coordinate
     * @returns {boolean} True if position is part of a long corridor
     */
    isLongStraightCorridor(x, y) {
        if (!this.isValidPosition(x, y) ||
            this.tiles[x][y].type !== 'floor' ||
            this.isPartOfRoom(x, y)) {
            return false;
        }

        // Check horizontal corridor
        let horizontalLength = 1;
        let dx = 1;
        while (this.isValidPosition(x + dx, y) &&
            this.tiles[x + dx][y].type === 'floor' &&
            !this.isPartOfRoom(x + dx, y)) {
            horizontalLength++;
            dx++;
        }
        dx = -1;
        while (this.isValidPosition(x + dx, y) &&
            this.tiles[x + dx][y].type === 'floor' &&
            !this.isPartOfRoom(x + dx, y)) {
            horizontalLength++;
            dx--;
        }

        // Check vertical corridor
        let verticalLength = 1;
        let dy = 1;
        while (this.isValidPosition(x, y + dy) &&
            this.tiles[x][y + dy].type === 'floor' &&
            !this.isPartOfRoom(x, y + dy)) {
            verticalLength++;
            dy++;
        }
        dy = -1;
        while (this.isValidPosition(x, y + dy) &&
            this.tiles[x][y + dy].type === 'floor' &&
            !this.isPartOfRoom(x, y + dy)) {
            verticalLength++;
            dy--;
        }

        return horizontalLength >= 6 || verticalLength >= 6;
    }

    /**
     * Determines if a corridor is horizontal or vertical.
     * @param {number} x - X coordinate to check
     * @param {number} y - Y coordinate to check
     * @returns {string} 'horizontal', 'vertical', or null
     */
    getCorridorOrientation(x, y) {
        let horizontalLength = 0;
        let verticalLength = 0;

        // Count horizontal corridor tiles
        let dx = 0;
        while (this.isValidPosition(x + dx, y) &&
            this.tiles[x + dx][y].type === 'floor' &&
            !this.isPartOfRoom(x + dx, y)) {
            horizontalLength++;
            dx++;
        }
        dx = -1;
        while (this.isValidPosition(x + dx, y) &&
            this.tiles[x + dx][y].type === 'floor' &&
            !this.isPartOfRoom(x + dx, y)) {
            horizontalLength++;
            dx--;
        }

        // Count vertical corridor tiles
        let dy = 0;
        while (this.isValidPosition(x, y + dy) &&
            this.tiles[x][y + dy].type === 'floor' &&
            !this.isPartOfRoom(x, y + dy)) {
            verticalLength++;
            dy++;
        }
        dy = -1;
        while (this.isValidPosition(x, y + dy) &&
            this.tiles[x][y + dy].type === 'floor' &&
            !this.isPartOfRoom(x, y + dy)) {
            verticalLength++;
            dy--;
        }

        if (horizontalLength > verticalLength) return 'horizontal';
        if (verticalLength > horizontalLength) return 'vertical';
        return null;
    }

    /**
     * Adds variety to a horizontal corridor.
     * @param {number} x - Starting x coordinate
     * @param {number} y - Starting y coordinate
     */
    addVarietyToHorizontalCorridor(x, y) {
        // Find corridor length
        let length = 0;
        while (this.isValidPosition(x + length, y) &&
            this.tiles[x + length][y].type === 'floor' &&
            !this.isPartOfRoom(x + length, y)) {
            length++;
        }

        // Add features every 3-4 tiles
        for (let i = 2; i < length - 2; i += 3) {
            if (this.random() < 0.4) { // 40% chance per position
                const featureType = this.random();

                if (featureType < 0.4) { // Alcove
                    this.addAlcove(x + i, y, 'horizontal');
                } else if (featureType < 0.7) { // Rest area
                    this.addRestArea(x + i, y, 'horizontal');
                } else { // Decoration
                    this.addDecoration(x + i, y);
                }
            }
        }
    }

    /**
     * Adds variety to a vertical corridor.
     * @param {number} x - Starting x coordinate
     * @param {number} y - Starting y coordinate
     */
    addVarietyToVerticalCorridor(x, y) {
        // Find corridor length
        let length = 0;
        while (this.isValidPosition(x, y + length) &&
            this.tiles[x][y + length].type === 'floor' &&
            !this.isPartOfRoom(x, y + length)) {
            length++;
        }

        // Add features every 3-4 tiles
        for (let i = 2; i < length - 2; i += 3) {
            if (this.random() < 0.4) { // 40% chance per position
                const featureType = this.random();

                if (featureType < 0.4) { // Alcove
                    this.addAlcove(x, y + i, 'vertical');
                } else if (featureType < 0.7) { // Rest area
                    this.addRestArea(x, y + i, 'vertical');
                } else { // Decoration
                    this.addDecoration(x, y + i);
                }
            }
        }
    }

    /**
     * Adds an alcove to a corridor.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} orientation - 'horizontal' or 'vertical'
     */
    addAlcove(x, y, orientation) {
        if (orientation === 'horizontal') {
            // Randomly choose top or bottom side
            const addToTop = this.random() < 0.5;

            if (addToTop) {
                // Try adding alcove to top
                if (this.isValidPosition(x, y - 1) && this.tiles[x][y - 1].type === 'wall') {
                    this.tiles[x][y - 1] = new Tile('floor', this);
                    if (this.random() < 0.3) this.addAlcoveContent(x, y - 1);
                }
            } else {
                // Try adding alcove to bottom
                if (this.isValidPosition(x, y + 1) && this.tiles[x][y + 1].type === 'wall') {
                    this.tiles[x][y + 1] = new Tile('floor', this);
                    if (this.random() < 0.3) this.addAlcoveContent(x, y + 1);
                }
            }
        } else {
            // Randomly choose left or right side
            const addToLeft = this.random() < 0.5;

            if (addToLeft) {
                // Try adding alcove to left
                if (this.isValidPosition(x - 1, y) && this.tiles[x - 1][y].type === 'wall') {
                    this.tiles[x - 1][y] = new Tile('floor', this);
                    if (this.random() < 0.3) this.addAlcoveContent(x - 1, y);
                }
            } else {
                // Try adding alcove to right
                if (this.isValidPosition(x + 1, y) && this.tiles[x + 1][y].type === 'wall') {
                    this.tiles[x + 1][y] = new Tile('floor', this);
                    if (this.random() < 0.3) this.addAlcoveContent(x + 1, y);
                }
            }
        }
    }

    /**
     * Adds content to an alcove.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    addAlcoveContent(x, y) {
        const roll = this.random();
        if (roll < 0.3) {
            // Add a chest
            const chest = new Chest(this, "", "common", null, x, y);
            this.tiles[x][y].obj.item = chest;
            this.chests.push(chest);
        } else if (roll < 0.6) {
            // Add a creature
            this.placeCreatureAt(x, y, null);
        }
    }

    /**
     * Adds a rest area to a corridor.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} orientation - 'horizontal' or 'vertical'
     */
    addRestArea(x, y, orientation) {
        // Create a 2x2 or 3x3 open area
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (this.isValidPosition(x + dx, y + dy) &&
                    this.tiles[x + dx][y + dy].type === 'wall') {
                    this.tiles[x + dx][y + dy] = new Tile('floor', this);
                }
            }
        }

        // Maybe add some content
        if (this.random() < 0.3) {
            this.placeCreatureAt(x, y, null);
        }
    }

    /**
     * Adds decorative elements to a corridor.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    addDecoration(x, y) {
        const roll = this.random();
        if (roll < 0.3) {
            // Add a pillar
            this.tiles[x][y].type = 'pillar';
        } else if (roll < 0.6) {
            // Add debris
            this.tiles[x][y].obj.debris = true;
        } else {
            // Add trap
            this.tiles[x][y].obj.trap = {
                type: ['spike', 'poison', 'magic'][Math.floor(this.random() * 3)],
                detected: false
            };
        }
    }

    //region Door Placement
    /**
     * Places doors throughout the dungeon at valid positions.
     * Doors are placed between corridors and rooms, with some doors being locked or trapped.
     * The placement algorithm:
     * 1. Identifies all potential door positions
     * 2. Groups adjacent door positions to avoid placing doors too close together
     * 3. Selects the best door position from each group based on interest scores
     * 4. Has a 20% chance to skip placing single doors
     *
     * Each door can have the following properties:
     * - 30% chance of being locked
     * - 10% chance of being trapped
     * - A calculated interest score for selection priority
     *
     * @returns {void} Modifies the dungeon tiles directly by placing doors
     */
    placeDoors() {
        // Track placed door positions to avoid duplicates
        const doorPositions = new Set();
        let totalDoorsPlaced = 0;

        // First, identify all potential door positions
        const potentialDoors = [];

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                // Only consider floor tiles that aren't part of rooms
                if (this.isValidPosition(x, y) &&
                    this.tiles[x][y].type === "floor" &&
                    !this.isPartOfRoom(x, y)) {

                    // Check if this is a valid door position
                    const doorInfo = this.checkDoorPosition(x, y);
                    if (doorInfo.isValid) {
                        potentialDoors.push({
                            x,
                            y,
                            roomEntranceDirection: doorInfo.roomEntranceDirection,
                            adjacentRoom: doorInfo.adjacentRoom,
                            isLocked: this.random() < 0.3,  // 20% chance of locked door
                            isTrapped: this.random() < 0.1, // 10% chance of trapped door
                            interestScore: this.random()    // Random value to break ties
                        });
                    }
                }
            }
        }

        // Group potential doors by their proximity to each other
        const doorGroups = this.groupAdjacentDoors(potentialDoors);

        // Place doors, selecting the best door from each group
        for (const group of doorGroups) {
            if (group.length === 1) {
                // Single door in the group, just place it
                const door = group[0];

                // 20% chance of skipping a door placement
                if (this.random() < 0.2) continue;

                this.createDoorAt(door.x, door.y, door.roomEntranceDirection,
                                 door.adjacentRoom, door.isLocked, door.isTrapped);

                doorPositions.add(`${door.x},${door.y}`);
                totalDoorsPlaced++;
            } else {
                // Multiple adjacent doors - select the most interesting one
                const bestDoor = this.selectBestDoor(group);

                this.createDoorAt(bestDoor.x, bestDoor.y, bestDoor.roomEntranceDirection,
                                 bestDoor.adjacentRoom, bestDoor.isLocked, bestDoor.isTrapped);

                doorPositions.add(`${bestDoor.x},${bestDoor.y}`);
                totalDoorsPlaced++;

                if (this.debug) {
                    console.log(`Selected best door from group of ${group.length} adjacent doors`);
                }
            }
        }

        if (this.debug) {
            console.log(`Placed ${totalDoorsPlaced} doors in total`);
        }
    }

    /**
     * Checks if a given position is near a corner of a room in a specific direction.
     * A position is considered "near" if it's within 1 tile of a corner.
     *
     * @param {number} x - The x-coordinate of the position to check
     * @param {number} y - The y-coordinate of the position to check
     * @param {Object} room - The room object to check against
     * @param {number} room.x - The x-coordinate of the room's top-left corner
     * @param {number} room.y - The y-coordinate of the room's top-left corner
     * @param {number} room.width - The width of the room
     * @param {number} room.height - The height of the room
     * @param {string} direction - The direction to check ("north", "south", "east", or "west")
     * @returns {boolean} True if the position is near a corner, false otherwise
     */
    isNearRoomCorner(x, y, room, direction) {
        // Define what "near" means - here we consider a position "near" a corner
        // if it's within 1 tile of a corner
        const cornerDistance = 1;

        // Check based on the direction the door is facing
        switch (direction) {
            case "north": // Door facing north (room is above)
                // Check if too close to left or right corner
                return (x <= room.x + cornerDistance) || (x >= room.x + room.width - 1 - cornerDistance);

            case "south": // Door facing south (room is below)
                // Check if too close to left or right corner
                return (x <= room.x + cornerDistance) || (x >= room.x + room.width - 1 - cornerDistance);

            case "east": // Door facing east (room is to the right)
                // Check if too close to top or bottom corner
                return (y <= room.y + cornerDistance) || (y >= room.y + room.height - 1 - cornerDistance);

            case "west": // Door facing west (room is to the left)
                // Check if too close to top or bottom corner
                return (y <= room.y + cornerDistance) || (y >= room.y + room.height - 1 - cornerDistance);
        }

        return false;
    }

    /**
     * Evaluates a position to determine if it's suitable for door placement.
     * A valid door position must:
     * 1. Be adjacent to exactly one room
     * 2. Be at the entrance of a corridor (not further down)
     * 3. Not be near a room corner
     *
     * @param {number} x - The x-coordinate of the position to check
     * @param {number} y - The y-coordinate of the position to check
     * @returns {Object} An object containing:
     *   - isValid {boolean} - Whether the position is valid for a door
     *   - roomEntranceDirection {string|undefined} - The direction ("north", "east", "south", "west") the door faces if valid
     *   - adjacentRoom {Room|undefined} - Reference to the adjacent room object if valid
     */
    checkDoorPosition(x, y) {
        // Check if this corridor tile is adjacent to exactly one room
        let adjacentRoomCount = 0;
        let roomEntranceDirection = null;
        let adjacentRoom = null;

        // Check in all four directions
        const directions = [
            { dx: 0, dy: -1, facing: "north" }, // North
            { dx: 1, dy: 0, facing: "east" },   // East
            { dx: 0, dy: 1, facing: "south" },  // South
            { dx: -1, dy: 0, facing: "west" }   // West
        ];

        // Count how many adjacent tiles are room floor tiles
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (this.isValidPosition(nx, ny) && this.tiles[nx][ny].type === "floor") {
                for (const room of this.rooms) {
                    if (room.containsPoint(nx, ny)) {
                        adjacentRoomCount++;
                        roomEntranceDirection = dir.facing;
                        adjacentRoom = room;
                        break;
                    }
                }
            }
        }

        // If this position has exactly one adjacent room tile, it's a potential door candidate
        if (adjacentRoomCount === 1) {
            // Check if this is the first floor tile outside of a room
            // (to ensure doors are placed at room entrances, not further down the corridor)
            let oppositeDirection;
            switch (roomEntranceDirection) {
                case "north": oppositeDirection = { dx: 0, dy: 1 }; break; // South
                case "east": oppositeDirection = { dx: -1, dy: 0 }; break; // West
                case "south": oppositeDirection = { dx: 0, dy: -1 }; break; // North
                case "west": oppositeDirection = { dx: 1, dy: 0 }; break; // East
            }

            // Check the opposite direction to make sure we're placing the door at the corridor entrance
            const oppositeX = x + oppositeDirection.dx;
            const oppositeY = y + oppositeDirection.dy;

            if (!this.isValidPosition(oppositeX, oppositeY) ||
                this.tiles[oppositeX][oppositeY].type === "wall" ||
                this.isPartOfRoom(oppositeX, oppositeY)) {
                // Not a good door position, it's not at a corridor-room junction
                return { isValid: false };
            }

            // NEW: Check if this position is at or near a room corner
            // We need to check if we're 1 tile away from a corner
            const isNearCorner = this.isNearRoomCorner(x, y, adjacentRoom, roomEntranceDirection);

            if (isNearCorner) {
                // Too close to a corner, not a good door position
                return { isValid: false };
            }

            return {
                isValid: true,
                roomEntranceDirection,
                adjacentRoom
            };
        }

        return { isValid: false };
    }

    /**
     * Groups adjacent door objects into arrays based on their spatial proximity.
     * Doors are considered adjacent if they are within 1 unit of each other horizontally, vertically, or diagonally.
     *
     * @param {Array<Object>} doors - Array of door objects, each containing x and y coordinates
     * @returns {Array<Array<Object>>} An array of door groups, where each group is an array of adjacent door objects
     */
    groupAdjacentDoors(doors) {
        const groups = [];
        const assigned = new Set();

        for (let i = 0; i < doors.length; i++) {
            if (assigned.has(i)) continue;

            const door = doors[i];
            const group = [door];
            assigned.add(i);

            // Check for adjacent doors
            for (let j = 0; j < doors.length; j++) {
                if (i === j || assigned.has(j)) continue;

                const otherDoor = doors[j];
                const dx = Math.abs(door.x - otherDoor.x);
                const dy = Math.abs(door.y - otherDoor.y);

                // Check if doors are adjacent (including diagonals)
                if (dx <= 1 && dy <= 1) {
                    group.push(otherDoor);
                    assigned.add(j);
                }
            }

            groups.push(group);
        }

        return groups;
    }

    /**
     * Determines the best position to place a door on one room that leads toward another room.
     * Uses different placement strategies based on the attempt number to increase chances of finding a valid door position.
     *
     * @param {Object} roomA - The source room where the door will be placed.
     * @param {Object} roomB - The target room that the door will lead toward.
     * @param {number} [attemptNumber=0] - The attempt number, used to try different door placement strategies:
     *   - 0: Places door based on primary room alignment (horizontal/vertical)
     *   - 1: Tries alternative wall placements with offset positions
     *   - 2+: Falls back to center-based door placement with random wall selection
     *
     * @returns {Object} An object containing the x and y coordinates of the door position.
     * @returns {number} returns.x - The x coordinate of the door.
     * @returns {number} returns.y - The y coordinate of the door.
     */
    findBestDoorPosition(roomA, roomB, attemptNumber = 0) {
        // Find the best position to place a door on roomA towards roomB
        const centerA = roomA.getCenter();
        const centerB = roomB.getCenter();

        // Determine the direction from roomA to roomB
        const horizontalDirection = centerB.x > centerA.x ? 1 : -1;
        const verticalDirection = centerB.y > centerA.y ? 1 : -1;

        // Choose door based on relative positions of rooms
        let doorX, doorY;

        // Use different door placement strategies based on the attempt number
        if (attemptNumber === 0) {
            // Original door placement logic - attempt 0
            if (Math.abs(centerB.x - centerA.x) > Math.abs(centerB.y - centerA.y)) {
                // Rooms are more horizontally aligned - place door on east/west wall
                doorX = horizontalDirection > 0 ?
                    roomA.x + roomA.width - 1 : // East wall
                    roomA.x;                    // West wall

                // Pick a random position along the wall within room bounds
                doorY = Math.floor(roomA.y + 1 + this.random() * (roomA.height - 2));
            } else {
                // Rooms are more vertically aligned - place door on north/south wall
                doorY = verticalDirection > 0 ?
                    roomA.y + roomA.height - 1 : // South wall
                    roomA.y;                     // North wall

                // Pick a random position along the wall within room bounds
                doorX = Math.floor(roomA.x + 1 + this.random() * (roomA.width - 2));
            }
        } else if (attemptNumber === 1) {
            // Alternative door placement - attempt 1
            // Try placing on different walls
            if (Math.abs(centerB.x - centerA.x) <= Math.abs(centerB.y - centerA.y)) {
                // Try horizontal walls this time
                doorX = horizontalDirection > 0 ?
                    roomA.x + roomA.width - 1 : // East wall
                    roomA.x;                    // West wall

                doorY = Math.floor(roomA.y + roomA.height * 0.75);
            } else {
                // Try vertical walls this time
                doorY = verticalDirection > 0 ?
                    roomA.y + roomA.height - 1 : // South wall
                    roomA.y;                     // North wall

                doorX = Math.floor(roomA.x + roomA.width * 0.25);
            }
        } else {
            // Fall back to center-based door placement for attempt 2+
            if (this.random() > 0.5) {
                // Place on horizontal walls
                doorX = horizontalDirection > 0 ?
                    roomA.x + roomA.width - 1 : // East wall
                    roomA.x;                    // West wall

                doorY = Math.floor(roomA.y + Math.floor(roomA.height / 2));
            } else {
                // Place on vertical walls
                doorY = verticalDirection > 0 ?
                    roomA.y + roomA.height - 1 : // South wall
                    roomA.y;                     // North wall

                doorX = Math.floor(roomA.x + Math.floor(roomA.width / 2));
            }
        }

        return { x: doorX, y: doorY };
    }

    /**
     * Selects the most interesting door from a group based on its attributes.
     *
     * Doors are scored based on their properties, with trapped doors getting the highest
     * priority (+3), followed by locked doors (+2). A pre-calculated interestScore
     * is also added to break ties between doors with similar attributes.
     *
     * @param {Array} doorGroup - A group of door objects to evaluate
     * @returns {Object|null} The door with the highest interest score, or null if doorGroup is empty
     */
    selectBestDoor(doorGroup) {
        // Doors that are both locked and trapped are highest priority
        let bestDoor = null;
        let bestScore = -1;

        for (const door of doorGroup) {
            // Calculate an interest score (higher is better)
            let score = 0;
            if (door.isLocked) score += 2;
            if (door.isTrapped) score += 3;

            // Add the randomized interest score to break ties
            score += door.interestScore;

            if (score > bestScore) {
                bestScore = score;
                bestDoor = door;
            }
        }

        return bestDoor;
    }

    /**
     * Creates a door tile at the specified coordinates with given properties.
     *
     * @param {number} x - The x-coordinate of the door.
     * @param {number} y - The y-coordinate of the door.
     * @param {string} facing - The direction the door is facing.
     * @param {Object} room - The room object this door belongs to.
     * @param {boolean} isLocked - Whether the door is locked.
     * @param {boolean} isTrapped - Whether the door is trapped.
     * @returns {void}
     */
    createDoorAt(x, y, facing, room, isLocked, isTrapped) {
        // Create the door tile
        this.tiles[x][y] = new Tile("door", this);
        this.tiles[x][y].obj.facing = facing;
        this.tiles[x][y].obj.room = room;
        this.tiles[x][y].obj.locked = isLocked;
        this.tiles[x][y].obj.trapped = isTrapped;
        this.doors.push(this.tiles[x][y].obj);

        if (this.debug) {
            let doorType = "normal";
            if (isLocked && isTrapped) doorType = "locked & trapped";
            else if (isLocked) doorType = "locked";
            else if (isTrapped) doorType = "trapped";

            console.log(`Placed ${doorType} door at (${x}, ${y}) facing ${facing}`);
        }
    }

    /**
     * Finds and returns all door tiles associated with the specified room.
     *
     * This method scans the perimeter of the room (including the tiles that are
     * one tile outside the room's boundaries) to identify doors that are linked
     * to this room.
     *
     * @param {Object} room - The room object to find doors for
     * @param {number} room.x - The x-coordinate of the room's top-left corner
     * @param {number} room.y - The y-coordinate of the room's top-left corner
     * @param {number} room.width - The width of the room
     * @param {number} room.height - The height of the room
     * @returns {Array} An array of tile objects that are doors associated with the room
     */
    findDoorsForRoom(room) {
        const doors = [];

        // Check the perimeter of the room for doors
        for (let x = room.x - 1; x <= room.x + room.width; x++) {
            for (let y = room.y - 1; y <= room.y + room.height; y++) {
                // Only check the perimeter, not inside or far outside
                const isPerimeter =
                    (x === room.x - 1 || x === room.x + room.width) &&
                    (y >= room.y && y < room.y + room.height) ||
                    (y === room.y - 1 || y === room.y + room.height) &&
                    (x >= room.x && x < room.x + room.width);

                if (!isPerimeter) continue;

                // Check if this position has a door
                if (this.isValidPosition(x, y) &&
                    this.tiles[x][y].type === "door" &&
                    this.tiles[x][y].obj.room === room) {
                    doors.push(this.tiles[x][y]);
                }
            }
        }

        return doors;
    }

    //region Chest Placement
    /**
     * Places treasure chests in the dungeon rooms based on specific criteria.
     * The number of chests is determined by the total number of rooms (1 chest per 3 rooms).
     * Chests are placed with priority given to:
     * 1. Locked rooms (rooms with only locked doors)
     * 2. Larger rooms by area
     *
     * @returns {number} The number of chests successfully placed in the dungeon
     */
    placeChests() {
        // Determine how many chests to place (1 per 3 rooms)
        const numChests = Math.max(1, Math.floor(this.rooms.length / 3));

        // minus existing chests
        const existingChests = this.chests.length;

        if (this.debug)
            console.log(`Placing ${numChests} chests in the dungeon...`);

        // First identify locked rooms (rooms with only locked doors)
        const roomAccessibility = this.rooms.map(room => {
            const doors = this.findDoorsForRoom(room);
            const isLocked = doors.length > 0 && doors.every(door => door.obj.locked);
            return {
                room,
                isLocked,
                hasChest: false
            };
        });

        // Sort rooms by priority: locked rooms first, then by size (largest first)
        roomAccessibility.sort((a, b) => {
            // First prioritize locked rooms
            if (a.isLocked !== b.isLocked) {
                return a.isLocked ? -1 : 1;
            }
            // Then prioritize larger rooms
            return b.room.getArea() - a.room.getArea();
        });

        // Place chests in rooms by priority
        let chestsPlaced = 0;
        for (let i = 0; i < roomAccessibility.length && chestsPlaced < numChests; i++) {
            const roomInfo = roomAccessibility[i];
            if (!roomInfo.hasChest) {
                // Place a chest in this room
                this.placeChestInRoom(roomInfo.room);
                roomInfo.hasChest = true;
                chestsPlaced++;

                if (this.debug) {
                    console.log(`Placed chest in ${roomInfo.isLocked ? "locked" : "unlocked"} room at (${roomInfo.room.x}, ${roomInfo.room.y})`);
                }
            }
        }

        return chestsPlaced;
    }

    /**
     * Attempts to place a chest in the given room at a random valid position.
     *
     * @param {Object} room - The room object where the chest will be placed
     * @param {number} room.x - The x-coordinate of the room's top-left corner
     * @param {number} room.y - The y-coordinate of the room's top-left corner
     * @param {number} room.width - The width of the room
     * @param {number} room.height - The height of the room
     * @returns {boolean} - True if chest was successfully placed, false otherwise
     *
     * @description
     * This method tries to place a chest in a random position inside the room, avoiding the edges.
     * It makes up to 5 attempts to find a suitable location that doesn't already have an object.
     * The chest's quality (rare/epic) is determined based on whether the room is locked.
     * Locked rooms have a higher chance of containing higher quality loot.
     */
    placeChestInRoom(room) {
        // Choose a random position inside the room (not on the edges)
        const minX = room.x + 1;
        const maxX = room.x + room.width - 2;
        const minY = room.y + 1;
        const maxY = room.y + room.height - 2;

        // Make sure the room is big enough for a chest
        if (maxX < minX || maxY < minY)
            return false; // Room too small

        // Try several positions to avoid placing on top of other items
        for (let attempts = 0; attempts < 5; attempts++) {
            const x = Math.floor(minX + this.random() * (maxX - minX + 1));
            const y = Math.floor(minY + this.random() * (maxY - minY + 1));

            // Check if this tile already has an item
            if (this.tiles[x][y].type === "floor" &&
                !this.tiles[x][y].obj.item) {

                // Make the chest rare and more likely to be locked if the room is locked
                const doors = this.findDoorsForRoom(room);
                const isLockedRoom = doors.length > 0 && doors.every(door => door.obj.locked);
                var theQuality = "";

                if (isLockedRoom) {
                    // Higher chance of better loot in locked rooms
                    if (this.random() < 0.2) {
                        theQuality = "rare";
                    } else if (this.random() < 0.1) {
                        theQuality = "epic";
                    } else if (this.random() < 0.05) {
                        theQuality = "legendary";
                    }
                } else {
                    if (this.random() < 0.75)
                        theQuality = "common";
                }

                // Create a new chest with the determined quality
                const chest = new Chest(this, "", theQuality, room, x, y);

                // Place the chest on the tile
                this.tiles[x][y].obj.item = chest;

                // Store the chest in the dungeon
                this.chests.push(chest);

                chest.setType("treasure");

                return true;
            }
        }

        return false; // Couldn't find a suitable position
    }

    //region Creature Placement
    /**
     * Places creatures throughout the dungeon.
     * Creatures are strategically distributed between rooms (70%) and corridors (30%).
     * The function avoids placing creatures on tiles that already contain chests or items.
     * The total number of creatures is calculated based on the number of rooms (1.5 creatures per room).
     *
     * The placement algorithm:
     * 1. First identifies all valid floor tiles without items
     * 2. Prioritizes room placement, allocating ~70% of creatures to rooms
     * 3. Places remaining creatures in corridors
     *
     * @returns {number} The total number of creatures successfully placed
     */
    placeCreatures() {
        // Store all creatures in an array
        this.creatures = [];

        // Calculate total number of creatures based on room count (2.5 per room)
        const totalCreatures = Math.ceil(this.rooms.length * 1.5);

        if (this.debug)
            console.log(`Placing ${totalCreatures} creatures in the dungeon...`);

        // Get all valid floor tiles (excluding those with chests)
        const validTiles = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.isValidPosition(x, y) &&
                    this.tiles[x][y].type === "floor" &&
                    (!this.tiles[x][y].obj.item)) {
                    validTiles.push({ x, y });
                }
            }
        }

        // Shuffle the valid tiles to randomize creature placement
        this.shuffleArray(validTiles);

        // Place creatures
        let creaturesPlaced = 0;

        // First, prioritize rooms
        for (const room of this.rooms) {
            // 70% of creatures should be in rooms
            const roomCreaturesToPlace = Math.ceil(totalCreatures * 0.7 / this.rooms.length);

            for (let i = 0; i < roomCreaturesToPlace && creaturesPlaced < totalCreatures; i++) {
                // Find valid tile in this room
                const validRoomTiles = validTiles.filter(tile =>
                    room.containsPoint(tile.x, tile.y)
                );

                if (validRoomTiles.length > 0) {
                    const tileIndex = Math.floor(this.random() * validRoomTiles.length);
                    const tile = validRoomTiles[tileIndex];

                    // Remove this tile from further consideration
                    validTiles.splice(validTiles.indexOf(tile), 1);

                    // Place creature
                    this.placeCreatureAt(tile.x, tile.y, room);
                    creaturesPlaced++;
                }
            }
        }

        // Then place remaining creatures in corridors
        while (creaturesPlaced < totalCreatures && validTiles.length > 0) {
            // Find tiles that are not in rooms (corridors)
            const corridorTiles = validTiles.filter(tile =>
                !this.isPartOfRoom(tile.x, tile.y)
            );

            if (corridorTiles.length === 0) break;

            const tileIndex = Math.floor(this.random() * corridorTiles.length);
            const tile = corridorTiles[tileIndex];

            // Remove this tile from further consideration
            validTiles.splice(validTiles.indexOf(tile), 1);

            // Place creature
            this.placeCreatureAt(tile.x, tile.y, null); // null for corridor (no room)
            creaturesPlaced++;
        }

        if (this.debug) {
            console.log(`Successfully placed ${creaturesPlaced} creatures`);
        }

        return creaturesPlaced;
    }

    /**
     * Places a creature at a specific position in the dungeon.
     * The creature type is determined based on whether it's placed in a corridor or a room.
     * Creatures in corridors tend to be weaker, while rooms have a full range of possibilities.
     * Locked rooms have a higher chance of containing stronger creatures.
     *
     * @param {number} x - The x-coordinate where the creature will be placed
     * @param {number} y - The y-coordinate where the creature will be placed
     * @param {Object|null} room - The room object where the creature is placed, or null if in a corridor
     * @returns {Creature} The newly created creature that was placed
     */
    placeCreatureAt(x, y, room) {
        // Create a creature with appropriate difficulty based on location
        let creatureType = "";
        let creatureHealth = "";

        // Creatures in corridors tend to be weaker
        if (!room) {
            // Corridor creature - more likely to be a weaker creature
            const roll = this.random();
            if (roll < 0.35) creatureType = "spider";
            else if (roll < 0.6) creatureType = "goblin";
            else if (roll < 0.9) creatureType = "skeleton";
            else creatureType = "zombie";
        } else {
            // Room creatures - full range of possibilities
            // If room has locked doors, higher chance of stronger creatures
            const doors = this.findDoorsForRoom(room);
            const isLockedRoom = doors.length > 0 && doors.every(door => door.obj.locked);

            if (isLockedRoom) {
                // Locked room - stronger creatures
                const roll = this.random();
                if (roll < 0.05) creatureType = "goblin";
                else if (roll < 0.2) creatureType = "skeleton";
                else if (roll < 0.5) creatureType = "orc";
                else if (roll < 0.7) creatureType = "troll";
                else if (roll < 0.9) creatureType = "demon";
                else creatureType = ["whelp","lich"][Math.floor(this.random() * 2)];
            } else {
                // Normal room
                const roll = this.random();
                if (roll < 0.3) creatureType = "goblin";
                else if (roll < 0.6) creatureType = "skeleton";
                else if (roll < 0.8) creatureType = "zombie";
                else if (roll < 0.95) creatureType = "orc";
                else creatureType = "troll";
            }
        }

        // Create the creature and place it
        const creature = new Creature(this, creatureType, creatureHealth);
        creature.x = x;
        creature.y = y;

        // Store the creature in the dungeon
        this.creatures.push(creature);

        // Add the creature to the tile
        this.tiles[x][y].obj.creature = creature;

        if (this.debug) {
            console.log(`Placed ${creature.type} at (${x}, ${y})${room ? ' in room' : ' in corridor'}`);
        }

        return creature;
    }

    /**
     * Shuffles the elements of an array in place using the Fisher-Yates algorithm.
     * Uses the class's random number generator for shuffling.
     *
     * @param {Array} array - The array to be shuffled
     * @returns {Array} The same array with its elements randomly rearranged
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    //region Key Placement
    /**
     * Places keys for locked doors and chests throughout the dungeon.
     *
     * This method:
     * 1. Identifies all locked doors and chests in the dungeon
     * 2. Builds an accessibility graph to determine reachable areas
     * 3. Places door keys in locations that are accessible without passing through the locked door
     * 4. Places chest keys with less strict accessibility requirements
     *
     * Each key is linked to its specific door or chest via a keyId property.
     * Door keys are prioritized over chest keys as they're more important for progression.
     *
     * @returns {void}
     */
    placeKeys() {
        if (this.debug) {
            console.log("Placing keys for locked doors and chests...");
        }

        // First, collect all locked doors and chests
        const lockedDoors = [];
        const lockedChests = [];

        // Find all locked objects
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.isValidPosition(x, y)) {
                    const tile = this.tiles[x][y];

                    // Find locked doors
                    if (tile.type === 'door' && tile.obj.locked) {
                        lockedDoors.push({
                            x,
                            y,
                            keyPlaced: false,
                            doorId: `door_${x}_${y}`,
                            room: tile.obj.room
                        });
                    }

                    // Find locked chests
                    if (tile.type === 'floor' && tile.obj.item instanceof Chest && tile.obj.item.locked) {
                        lockedChests.push({
                            x,
                            y,
                            keyPlaced: false,
                            chestId: `chest_${x}_${y}`,
                            room: this.getRoomForPosition(x, y)
                        });
                    }
                }
            }
        }

        if (this.debug) {
            console.log(`Found ${lockedDoors.length} locked doors and ${lockedChests.length} locked chests`);
        }

        // Create a graph of reachable areas to determine accessibility
        const accessibilityGraph = this.buildAccessibilityGraph();

        // Place keys for doors first (more important for progression)
        for (const door of lockedDoors) {
            // Create a door key
            const doorKey = new Item(this, "doorKey");
            doorKey.keyId = door.doorId; // Link key to specific door

            // Find a place for the key that is accessible without passing through the locked door
            this.placeKeyInAccessibleLocation(doorKey, door, accessibilityGraph);
        }

        // Then place keys for chests
        for (const chest of lockedChests) {
            // Create a chest key
            const chestKey = new Item(this, "chestKey");
            chestKey.keyId = chest.chestId; // Link key to specific chest

            // For chest keys, we're less strict about accessibility
            this.placeKeyInAccessibleLocation(chestKey, chest, null, true);
        }
    }

    /**
     * Places a key in a location accessible to the player before they reach the locked object.
     *
     * This method ensures that keys are not placed behind their own locked doors/chests by:
     * 1. First identifying accessible rooms based on an accessibility graph
     * 2. Attempting to place the key in a creature's inventory in an accessible room
     * 3. If unsuccessful, trying to place it in an unlocked chest in an accessible room
     * 4. If still unsuccessful, placing it directly on the floor in an accessible room
     * 5. As a last resort, placing it in a constrained random location
     *
     * The method also attempts to maintain a one-key-per-room limit where possible.
     *
     * @param {Object} key - The key object to be placed in the dungeon
     * @param {Object} lockedObject - The object (door or chest) that this key unlocks
     * @param {Object} accessibilityGraph - A graph representing which rooms are accessible without this key
     * @param {boolean} [canPlaceAnywhere=false] - If true, ignore accessibility constraints and place anywhere
     * @returns {boolean} - True if key was successfully placed, false otherwise
     */
    placeKeyInAccessibleLocation(key, lockedObject, accessibilityGraph, canPlaceAnywhere = false) {
        // Find the room that contains the locked object
        const objectRoom = lockedObject.room;
        if (!objectRoom) {
            // If no specific room, place key anywhere
            return this.placeKeyRandomly(key);
        }

        const objectRoomIndex = this.rooms.indexOf(objectRoom);

        // If accessibility graph provided, find rooms accessible without this key
        let accessibleRooms;
        if (accessibilityGraph && !canPlaceAnywhere) {
            accessibleRooms = this.findAccessibleRooms(objectRoomIndex, accessibilityGraph);

            // Remove the room containing the locked door from accessible rooms
            // This prevents placing keys behind their own locked doors
            accessibleRooms.delete(objectRoomIndex);
        } else {
            // Otherwise, all rooms are potential candidates
            accessibleRooms = new Set(this.rooms.map((_, i) => i));

            // But exclude the room containing the locked object
            accessibleRooms.delete(objectRoomIndex);
        }

        // Check if we have any accessible rooms at all
        if (accessibleRooms.size === 0) {
            if (this.debug) {
                console.log(`WARNING: No accessible rooms found for key to ${key.type} (keyId: ${key.keyId})`);
            }

            // Find the start room as a fallback placement location
            const startRoom = this.findBestStartRoom();
            const startRoomIndex = this.rooms.indexOf(startRoom);
            accessibleRooms.add(startRoomIndex);
        }

        // Track which rooms already have keys to enforce the one-key-per-room limit
        const roomsWithKeys = new Set(this.getRoomsWithKeys());

        // Filter out rooms that already have keys
        const availableRoomIndices = Array.from(accessibleRooms).filter(index => !roomsWithKeys.has(index));

        // If no rooms without keys are available, we'll need to fall back to rooms with keys
        const accessibleRoomsList = availableRoomIndices.length > 0 ?
            availableRoomIndices.map(index => this.rooms[index]) :
            Array.from(accessibleRooms).map(index => this.rooms[index]);

        // First try placing in a creature's inventory
        const accessibleCreatures = this.creatures.filter(creature => {
            // Skip creatures that already have a key
            if (creature.loot.some(item => item.type === "doorKey" || item.type === "chestKey")) {
                return false;
            }

            const creatureRoom = this.getRoomForPosition(creature.x, creature.y);
            if (!creatureRoom) return false; // Skip creatures not in rooms

            const roomIndex = this.rooms.indexOf(creatureRoom);
            return accessibleRooms.has(roomIndex) &&
                (availableRoomIndices.length === 0 || availableRoomIndices.includes(roomIndex));
        });

        if (accessibleCreatures.length > 0) {
            // Choose a random creature to hold the key
            const randomCreature = accessibleCreatures[Math.floor(this.random() * accessibleCreatures.length)];
            randomCreature.addLoot(key);

            if (this.debug) {
                console.log(`Placed ${key.type} (${key.keyId}) in creature inventory at (${randomCreature.x}, ${randomCreature.y})`);
            }
            return true;
        }

        // Next try placing in an unlocked chest
        const accessibleChests = this.chests.filter(chest => {
            // Skip chests that already have a key
            if (chest.loot.some(item => item.type === "doorKey" || item.type === "chestKey")) {
                return false;
            }

            if (chest.locked) return false;
            const chestRoom = this.getRoomForPosition(chest.x, chest.y);
            if (!chestRoom) return false; // Skip chests not in rooms

            const roomIndex = this.rooms.indexOf(chestRoom);
            return accessibleRooms.has(roomIndex) &&
                (availableRoomIndices.length === 0 || availableRoomIndices.includes(roomIndex));
        });

        if (accessibleChests.length > 0) {
            // Choose a random chest to hold the key
            const randomChest = accessibleChests[Math.floor(this.random() * accessibleChests.length)];
            randomChest.addLoot(key);

            if (this.debug) {
                console.log(`Placed ${key.type} (${key.keyId}) in chest at (${randomChest.x}, ${randomChest.y})`);
            }
            return true;
        }

        // Finally, try to place on the floor in an accessible room
        if (accessibleRoomsList.length > 0) {
            // Shuffle the rooms for more randomness
            this.shuffleArray([...accessibleRoomsList]);

            // Try each room in random order
            for (const room of accessibleRoomsList) {
                const roomIndex = this.rooms.indexOf(room);

                // Skip rooms that already have keys on the floor
                if (this.roomHasKeyOnFloor(room)) {
                    continue;
                }

                // Make multiple attempts to find a valid position in the room
                for (let attempts = 0; attempts < 10; attempts++) {
                    const x = Math.floor(room.x + 1 + this.random() * (room.width - 2));
                    const y = Math.floor(room.y + 1 + this.random() * (room.height - 2));

                    if (this.isValidPosition(x, y) &&
                        this.tiles[x][y].type === 'floor' &&
                        !this.tiles[x][y].obj.item &&
                        !this.tiles[x][y].obj.creature) {

                        // Place key on the floor
                        this.tiles[x][y].obj.item = key;

                        if (this.debug) {
                            console.log(`Placed ${key.type} (${key.keyId}) on floor at (${x}, ${y})`);
                        }
                        return true;
                    }
                }
            }
        }

        // If all else fails, place randomly but with constraints
        return this.placeKeyConstrainedRandomly(key, objectRoomIndex);
    }

    /**
     * Checks if a room contains a key item on any floor tile.
     *
     * @param {Object} room - The room to check for keys.
     * @param {number} room.x - The x-coordinate of the room's top-left corner.
     * @param {number} room.y - The y-coordinate of the room's top-left corner.
     * @param {number} room.width - The width of the room.
     * @param {number} room.height - The height of the room.
     * @returns {boolean} - Returns true if the room contains a door key or chest key on a floor tile, false otherwise.
     */
    roomHasKeyOnFloor(room) {
        for (let x = room.x; x < room.x + room.width; x++) {
            for (let y = room.y; y < room.y + room.height; y++) {
                if (this.isValidPosition(x, y) &&
                    this.tiles[x][y].type === 'floor' &&
                    this.tiles[x][y].obj.item &&
                    (this.tiles[x][y].obj.item.type === 'doorKey' ||
                    this.tiles[x][y].obj.item.type === 'chestKey')) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Identifies all rooms that contain keys within the dungeon.
     *
     * This method searches for both door and chest keys in three different locations:
     * 1. In creature inventories
     * 2. Within chests
     * 3. On the floor tiles
     *
     * @returns {Set<number>} A Set containing the indices of rooms that have keys
     *                       in any of the checked locations.
     */
    getRoomsWithKeys() {
        const roomsWithKeys = new Set();

        // Check keys in creature inventory
        for (const creature of this.creatures) {
            if (creature.loot.some(item => item.type === "doorKey" || item.type === "chestKey")) {
                const creatureRoom = this.getRoomForPosition(creature.x, creature.y);
                if (creatureRoom) {
                    const roomIndex = this.rooms.indexOf(creatureRoom);
                    if (roomIndex !== -1) {
                        roomsWithKeys.add(roomIndex);
                    }
                }
            }
        }

        // Check keys in chests
        for (const chest of this.chests) {
            if (chest.loot.some(item => item.type === "doorKey" || item.type === "chestKey")) {
                const chestRoom = this.getRoomForPosition(chest.x, chest.y);
                if (chestRoom) {
                    const roomIndex = this.rooms.indexOf(chestRoom);
                    if (roomIndex !== -1) {
                        roomsWithKeys.add(roomIndex);
                    }
                }
            }
        }

        // Check keys on the floor
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.isValidPosition(x, y) &&
                    this.tiles[x][y].type === 'floor' &&
                    this.tiles[x][y].obj.item &&
                    (this.tiles[x][y].obj.item.type === 'doorKey' ||
                    this.tiles[x][y].obj.item.type === 'chestKey')) {

                    const keyRoom = this.getRoomForPosition(x, y);
                    if (keyRoom) {
                        const roomIndex = this.rooms.indexOf(keyRoom);
                        if (roomIndex !== -1) {
                            roomsWithKeys.add(roomIndex);
                        }
                    }
                }
            }
        }

        return roomsWithKeys;
    }

    /**
     * Places a key in the dungeon using a constrained random approach.
     *
     * This method tries to place a key following these priorities:
     * 1. First tries rooms that don't already have keys and aren't the avoided room
     * 2. Then tries any room that isn't the avoided room (but may have keys)
     * 3. Fallbacks to placing the key on creatures that don't already have keys
     * 4. Last resort is placing in unlocked chests that don't already have keys
     *
     * For room placement, tries multiple random positions within each room
     * to find valid floor tiles without items or creatures.
     *
     * @param {Object} key - The key object to be placed
     * @param {number} avoidRoomIndex - Index of room to avoid placing the key in
     * @returns {boolean} - True if key was successfully placed, false otherwise
     */
    placeKeyConstrainedRandomly(key, avoidRoomIndex) {
        // Get all rooms that already have keys
        const roomsWithKeys = this.getRoomsWithKeys();

        // Try placing on the floor in a room that doesn't have a key and isn't the avoided room
        const validRooms = this.rooms.filter((room, index) =>
            index !== avoidRoomIndex && !roomsWithKeys.has(index));

        // If we have valid rooms without keys, try those first
        if (validRooms.length > 0) {
            this.shuffleArray(validRooms);

            for (const room of validRooms) {
                // Try multiple positions in the room
                for (let attempts = 0; attempts < 10; attempts++) {
                    const x = Math.floor(room.x + 1 + this.random() * (room.width - 2));
                    const y = Math.floor(room.y + 1 + this.random() * (room.height - 2));

                    if (this.isValidPosition(x, y) &&
                        this.tiles[x][y].type === 'floor' &&
                        !this.tiles[x][y].obj.item &&
                        !this.tiles[x][y].obj.creature) {

                        // Place key on the floor
                        this.tiles[x][y].obj.item = key;

                        if (this.debug) {
                            console.log(`Placed ${key.type} (${key.keyId}) on constrained random floor at (${x}, ${y})`);
                        }
                        return true;
                    }
                }
            }
        }

        // If we couldn't place in a room without keys, try any room that isn't the avoided room
        const anyValidRooms = this.rooms.filter((_, index) => index !== avoidRoomIndex);

        if (anyValidRooms.length > 0) {
            this.shuffleArray(anyValidRooms);

            for (const room of anyValidRooms) {
                // Skip rooms that already have keys on the floor
                if (this.roomHasKeyOnFloor(room)) {
                    continue;
                }

                // Try multiple positions in the room
                for (let attempts = 0; attempts < 10; attempts++) {
                    const x = Math.floor(room.x + 1 + this.random() * (room.width - 2));
                    const y = Math.floor(room.y + 1 + this.random() * (room.height - 2));

                    if (this.isValidPosition(x, y) &&
                        this.tiles[x][y].type === 'floor' &&
                        !this.tiles[x][y].obj.item &&
                        !this.tiles[x][y].obj.creature) {

                        // Place key on the floor
                        this.tiles[x][y].obj.item = key;

                        if (this.debug) {
                            console.log(`Placed ${key.type} (${key.keyId}) on constrained random floor at (${x}, ${y})`);
                        }
                        return true;
                    }
                }
            }
        }

        // Final fallback: try creatures that don't already have a key
        const validCreatures = this.creatures.filter(creature =>
            !creature.loot.some(item => item.type === "doorKey" || item.type === "chestKey"));

        if (validCreatures.length > 0) {
            const randomCreature = validCreatures[Math.floor(this.random() * validCreatures.length)];
            randomCreature.addLoot(key);

            if (this.debug) {
                console.log(`FALLBACK: Placed ${key.type} (${key.keyId}) in random creature at (${randomCreature.x}, ${randomCreature.y})`);
            }
            return true;
        }

        // Last resort: any unlocked chest without a key
        const validChests = this.chests.filter(chest =>
            !chest.locked &&
            !chest.loot.some(item => item.type === "doorKey" || item.type === "chestKey"));

        if (validChests.length > 0) {
            const randomChest = validChests[Math.floor(this.random() * validChests.length)];
            randomChest.addLoot(key);

            if (this.debug) {
                console.log(`FALLBACK: Placed ${key.type} (${key.keyId}) in random chest at (${randomChest.x}, ${randomChest.y})`);
            }
            return true;
        }

        if (this.debug) {
            console.log(`CRITICAL FAILURE: Could not place ${key.type} (${key.keyId}) anywhere!`);
        }
        return false;
    }

    /**
     * Places a key item randomly in the dungeon.
     * Tries to place the key in the following order:
     * 1. In a random creature's inventory (if any creatures exist)
     * 2. In a random chest (if any chests exist)
     * 3. On a valid floor tile (with no item or creature)
     *
     * @param {Object} key - The key item to place in the dungeon
     * @returns {boolean} - True if the key was successfully placed, false otherwise
     */
    placeKeyRandomly(key) {
        // Try placing in any creature, chest, or on the floor
        if (this.creatures.length > 0) {
            const randomCreature = this.creatures[Math.floor(this.random() * this.creatures.length)];
            randomCreature.addLoot(key);
            return true;
        }

        if (this.chests.length > 0) {
            const randomChest = this.chests[Math.floor(this.random() * this.chests.length)];
            randomChest.addLoot(key);
            return true;
        }

        // Last resort: find any valid floor tile
        const validTiles = [];
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.isValidPosition(x, y) &&
                    this.tiles[x][y].type === 'floor' &&
                    !this.tiles[x][y].obj.item &&
                    !this.tiles[x][y].obj.creature) {
                    validTiles.push({ x, y });
                }
            }
        }

        if (validTiles.length > 0) {
            const randomTile = validTiles[Math.floor(this.random() * validTiles.length)];
            this.tiles[randomTile.x][randomTile.y].obj.item = key;
            return true;
        }

        if (this.debug) {
            console.log(`Failed to place ${key.type} anywhere in dungeon!`);
        }
        return false;
    }

    //region Player Placement
    /**
     * Places the player starting position and stairs in the dungeon.
     * The player is placed in the center of the largest non-locked room,
     * while the stairs are placed in a distant room from the player.
     *
     * @method placePlayerAndStairs
     * @memberof DungeonGenerator
     * @instance
     *
     * @description
     * This method:
     * 1. Finds the best starting room for the player
     * 2. Places the player in the center of that room
     * 3. Finds a distant room for the stairs
     * 4. Creates stairs object with properties (color, direction, nextLevel)
     *
     * @modifies {this.playerStart} - Sets the player's starting coordinates
     * @modifies {this.stairs} - Sets the stairs' coordinates
     * @modifies {this.tiles} - Updates the tile at stairs location with stairs object
     *
     * @debug Logs player and stairs placement coordinates when debug is enabled
     */
    placePlayerAndStairs() {
        // Find the largest non-locked room for player start
        const startRoom = this.findBestStartRoom();

        // Place player in this room
        const playerX = Math.floor(startRoom.x + startRoom.width / 2);
        const playerY = Math.floor(startRoom.y + startRoom.height / 2);

        this.playerStart = { x: playerX, y: playerY };

        if (this.debug) {
            console.log(`Placed player start at (${playerX}, ${playerY})`);
        }

        // Find a distant room for stairs down
        const stairsRoom = this.findBestStairsRoom(startRoom);

        // Place stairs down in this room
        const stairsX = Math.floor(stairsRoom.x + stairsRoom.width / 2);
        const stairsY = Math.floor(stairsRoom.y + stairsRoom.height / 2);

        // Create stairs object
        this.stairs = { x: stairsX, y: stairsY };
        this.tiles[stairsX][stairsY].type = "stairs";
        this.tiles[stairsX][stairsY].obj = {
            color: '#6200EA',  // Deep purple color
            direction: "down",
            nextLevel: null     // Will be set when next level is generated
        };

        if (this.debug) {
            console.log(`Placed stairs at (${stairsX}, ${stairsY})`);
        }
    }

    /**
     * Evaluates all rooms in the dungeon to find the most suitable starting room.
     * The evaluation is based on multiple factors:
     * - Room size (larger rooms score higher)
     * - Presence of locked doors (locked rooms are penalized)
     * - Distance from dungeon center (rooms closer to center score higher)
     *
     * Each room receives a score calculated from these factors:
     * - Base score is the room's area
     * - Locked rooms have their score reduced by 80%
     * - Distance from center reduces score (0.5 points per unit of distance)
     *
     * @returns {Room} The room with the highest overall score
     * @memberof DungeonGenerator
     */
    findBestStartRoom() {
        // Look for large, non-locked rooms near the center
        const roomsWithScores = this.rooms.map((room, index) => {
            // Check if room has locked doors
            const doors = this.findDoorsForRoom(room);
            const isLocked = doors.length > 0 && doors.every(door => door.obj.locked);

            // Calculate a score based on size and whether it's locked
            let score = room.getArea();
            if (isLocked) score *= 0.2; // Penalize locked rooms

            // Calculate distance from center of dungeon
            const centerDungeonX = this.width / 2;
            const centerDungeonY = this.height / 2;
            const roomCenterX = room.x + room.width / 2;
            const roomCenterY = room.y + room.height / 2;

            const distanceFromCenter = Math.sqrt(
                Math.pow(centerDungeonX - roomCenterX, 2) +
                Math.pow(centerDungeonY - roomCenterY, 2)
            );

            // Bonus for rooms closer to center
            score -= distanceFromCenter * 0.5;

            return { room, score };
        });

        // Sort by score (highest first)
        roomsWithScores.sort((a, b) => b.score - a.score);

        // Return the best room
        return roomsWithScores[0].room;
    }

    /**
     * Finds the most suitable room for placing stairs by scoring rooms based on their distance
     * from the starting room and their size.
     *
     * @param {Room} startRoom - The starting room to measure distances from
     * @returns {Room} The room with the highest score based on distance from start and size
     *
     * @description
     * Scoring criteria:
     * - Base score is the euclidean distance from the start room's center
     * - Bonus points added for room size (10% of room area)
     */
    findBestStairsRoom(startRoom) {
        // Look for rooms far from player start
        const startRoomCenterX = startRoom.x + startRoom.width / 2;
        const startRoomCenterY = startRoom.y + startRoom.height / 2;

        const roomsWithScores = this.rooms.map((room, index) => {
            // Calculate distance from start room
            const roomCenterX = room.x + room.width / 2;
            const roomCenterY = room.y + room.height / 2;

            const distanceFromStart = Math.sqrt(
                Math.pow(startRoomCenterX - roomCenterX, 2) +
                Math.pow(startRoomCenterY - roomCenterY, 2)
            );

            // Score prioritizes distance from start
            let score = distanceFromStart;

            // Bonus for larger rooms
            score += room.getArea() * 0.1;

            return { room, score };
        });

        // Sort by score (highest first)
        roomsWithScores.sort((a, b) => b.score - a.score);

        // Return the best room
        return roomsWithScores[0].room;
    }

    /**
     * Checks if the given coordinates are within the valid bounds of the dungeon area.
     * Valid positions are within the inner area of the dungeon, excluding the border.
     * @param {number} x - The x coordinate to check
     * @param {number} y - The y coordinate to check
     * @returns {boolean} True if position is valid, false otherwise
     */
    isValidPosition(x, y) {
        return x >= this.borderSize &&
               x < this.width - this.borderSize &&
               y >= this.borderSize &&
               y < this.height - this.borderSize;
    }
}

export default Dungeon;
