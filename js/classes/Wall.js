/**
 * Represents a wall in the dungeon.
 * @class
 */
class Wall {
    /**
     * Creates a new Wall instance.
     * @constructor
     * @param {Object} tile - The tile object representing the wall's position.
     * @param {Object} dungeon - The dungeon object that contains this wall.
     * @property {Object} dungeon - Reference to the parent dungeon.
     * @property {Object} tile - The tile where this wall is located.
     * @property {boolean} illusion - Whether this wall is an illusion.
     * @property {string} color - The color of the wall.
     */
    constructor(tile, dungeon) {
        this.dungeon = dungeon;
        this.tile = tile;
        this.illusion = false;
        this.color = 'black';
    }

    /**
     * Sets the wall's illusion state to true.
     * @method
     * @memberof Wall
     */
    castIllusion(){
        this.illusion = true;
    }

    /**
     * Removes the illusion status from the wall
     * Sets the illusion property to false
     * @returns {void}
     */
    removeIllusion(){
        this.illusion = false;
    }

    /**
     * Check if the wall is illusory.
     * @returns {boolean} True if the wall is illusory, false otherwise.
     */
    isIllusory() {
        return this.illusion;
    }
}

export default Wall;