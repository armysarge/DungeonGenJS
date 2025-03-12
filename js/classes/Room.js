/**
 * Represents a room in a dungeon with position, dimensions, and connectivity status.
 * @class
 */
class Room {
    /**
     * Creates a new Room instance.
     * @constructor
     * @param {number} x - The x-coordinate of the room's top-left corner.
     * @param {number} y - The y-coordinate of the room's top-left corner.
     * @param {number} width - The width of the room.
     * @param {number} height - The height of the room.
     * @param {Object} dungeon - Reference to the parent dungeon object.
     */
    constructor(x, y, width, height, dungeon) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dungeon = dungeon; // Reference to the parent dungeon
        this.connected = false;
    }

    /**
     * Gets the center coordinates of the room.
     * @returns {{x: number, y: number}} The center coordinates.
     */
    getCenter() {
        return {
            x: this.x + Math.floor(this.width / 2),
            y: this.y + Math.floor(this.height / 2)
        };
    }

    /**
     * Calculates the area of the room.
     * @returns {number} The area of the room.
     */
    getArea() {
        return this.width * this.height;
    }

    /**
     * Checks if this room intersects with another room.
     * @param {Room} room - The room to check intersection with.
     * @returns {boolean} True if rooms intersect, false otherwise.
    */
    intersects(room) {
        return this.x < room.x + room.width &&
            this.x + this.width > room.x &&
            this.y < room.y + room.height &&
            this.y + this.height > room.y;
    }

    /**
     * Gets the boundary coordinates of the room.
     * @returns {{left: number, right: number, top: number, bottom: number}} The boundary coordinates.
    */
    getBoundary() {
        return {
            left: this.x,
            right: this.x + this.width - 1,
            top: this.y,
            bottom: this.y + this.height - 1
        };
    }

    /**
     * Checks if a point is inside the room (including walls).
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @returns {boolean} True if point is inside room, false otherwise.
     */
    containsPoint(x, y) {
        return x >= this.x && x < this.x + this.width &&
               y >= this.y && y < this.y + this.height;
    }

    /**
     * Checks if a point is on the room's edge.
     * @param {number} x - The x-coordinate of the point.
     * @param {number} y - The y-coordinate of the point.
     * @returns {boolean} True if point is on room's edge, false otherwise.
     */
    isOnEdge(x, y) {
        return (x === this.x || x === this.x + this.width - 1) &&
               (y >= this.y && y < this.y + this.height) ||
               (y === this.y || y === this.y + this.height - 1) &&
               (x >= this.x && x < this.x + this.width);
    }
}

export default Room;