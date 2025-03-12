import Trap from './Trap.js';

/**
 * Represents a floor tile in the dungeon
 * @class
 */
/**
 * Creates a new Floor instance
 * @constructor
 * @param {Object} tile - The tile object representing this floor's position
 * @param {Object} dungeon - The dungeon instance this floor belongs to
 * @property {Object} dungeon - Reference to the dungeon instance
 * @property {Object} tile - The tile object for this floor
 * @property {Object|null} item - Item placed on this floor tile
 * @property {boolean} trapped - Whether this floor tile contains a trap
 * @property {string} color - The color of the floor tile
 * @property {Object} [trap] - The trap instance if the floor is trapped
 */
class Floor{
    /**
     * Creates a new Floor instance.
     * @param {Tile} tile - The tile object associated with this floor.
     * @param {Dungeon} dungeon - The dungeon object this floor belongs to.
     * @constructor
     * @property {Dungeon} dungeon - Reference to the dungeon instance.
     * @property {Tile} tile - The tile object for this floor.
     * @property {Item|null} item - Item present on this floor, null if empty.
     * @property {boolean} trapped - Whether this floor is trapped.
     * @property {string} color - The color representation of this floor.
     * @property {Trap} [trap] - Trap instance if floor is trapped.
     */
    constructor(tile, dungeon){
        this.dungeon = dungeon;
        this.tile = tile;
        this.item = null;
        this.trapped = this.rollTrapped();
        this.color = 'white';

        if (this.trapped)
            this.trap = new Trap(this.dungeon);
    }

    /**
     * Sets an item on this floor tile.
     * @param {Item} item - The item to place on the floor.
     * @returns {void}
     */
    setItem(item) {
        this.item = item;
    }

    /**
     * Determines if a floor tile should be trapped based on random chance.
     * @returns {boolean} Returns true if the floor should be trapped (10% chance), false otherwise.
     */
    rollTrapped() {
        return this.dungeon.random() < 0.1;
    }

    /**
     * Activates the floor's trap when a player steps on it.
     * @param {Player} player - The player who triggered the trap.
     */
    sprungTrap(player) {
        if (this.trapped)
            this.trap.activate(player);
    }
}

export default Floor;