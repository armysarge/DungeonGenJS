/**
 * Represents a corridor connecting two points in a dungeon.
 * The corridor follows an L-shaped path, either going horizontal then vertical,
 * or vertical then horizontal, determined randomly.
 *
 * @class
 */
class Corridor {
    /**
     * Creates a new Corridor instance that connects two points in the dungeon.
     * @constructor
     * @param {Object} start - The starting coordinates of the corridor.
     * @param {number} start.x - The x-coordinate of the start position.
     * @param {number} start.y - The y-coordinate of the start position.
     * @param {Object} end - The ending coordinates of the corridor.
     * @param {number} end.x - The x-coordinate of the end position.
     * @param {number} end.y - The y-coordinate of the end position.
     * @param {Object} dungeon - The dungeon instance this corridor belongs to.
     * @property {Array<Object>} path - Array of points that make up the corridor's path.
     * @property {Object} doorPositions - Object containing start and end door positions.
     */
    constructor(start, end, dungeon) {
        this.start = start;
        this.end = end;
        this.dungeon = dungeon;
        this.path = [];
        this.doorPositions = { start: null, end: null };

        // Create the path points when initialized
        // Make doorway positions part of the path
        this.path.push({ x: this.start.x, y: this.start.y });

        // Calculate the main path - use the dungeon's random function
        if (this.dungeon.random() > 0.5) {
            this.generateHorizontalVerticalPath();
        } else {
            this.generateVerticalHorizontalPath();
        }

        // Add the end door position
        this.path.push({ x: this.end.x, y: this.end.y });
    }

    /**
     * Generates a path from the start point to the end point using horizontal and vertical segments.
     * The path first moves horizontally from the start point to the end point's x-coordinate,
     * then vertically to the end point's y-coordinate.
     * The path consists of a series of points stored in the path array property.
     * Each point is represented as an object with x and y coordinates.
     *
     * @returns {void}
     * @memberof Corridor
     */
    generateHorizontalVerticalPath() {
        let currentX = this.start.x;
        const horizontalEndX = this.end.x;
        const verticalY = this.end.y;

        // Add points for the horizontal segment
        while (currentX !== horizontalEndX) {
            this.path.push({ x: currentX, y: this.start.y });
            currentX += this.start.x < horizontalEndX ? 1 : -1;
        }

        // Add points for the vertical segment
        let currentY = this.start.y;
        while (currentY !== verticalY) {
            this.path.push({ x: this.end.x, y: currentY });
            currentY += this.start.y < verticalY ? 1 : -1;
        }

        // Add the final point
        this.path.push({ x: this.end.x, y: this.end.y });
    }

    /**
     * Generates a path from start point to end point using vertical-then-horizontal movement.
     * The path first moves vertically from the start point to the target y-coordinate,
     * then moves horizontally to reach the end point.
     * Each point along the path is stored in the path array as {x, y} coordinates.
     * @method generateVerticalHorizontalPath
     * @returns {void}
     */
    generateVerticalHorizontalPath() {
        let currentY = this.start.y;
        const verticalEndY = this.end.y;
        const horizontalX = this.end.x;

        // Add points for the vertical segment
        while (currentY !== verticalEndY) {
            this.path.push({ x: this.start.x, y: currentY });
            currentY += this.start.y < verticalEndY ? 1 : -1;
        }

        // Add points for the horizontal segment
        let currentX = this.start.x;
        while (currentX !== horizontalX) {
            this.path.push({ x: currentX, y: this.end.y });
            currentX += this.start.x < horizontalX ? 1 : -1;
        }

        // Add the final point
        this.path.push({ x: this.end.x, y: this.end.y });
    }
}

export default Corridor;