
import Trap from './Trap.js';

/**
 * Represents a door in the dungeon.
 * @class
 * @property {Object} tile - The tile where the door is located.
 * @property {Object} dungeon - The dungeon instance this door belongs to.
 * @property {Object|null} room - The room this door is connected to (set during placement).
 * @property {boolean} locked - Whether the door is locked.
 * @property {boolean} trapped - Whether the door is trapped.
 * @property {string} color - The color representation of the door.
 * @property {string} facing - The direction the door is facing ("north", "south", "east", "west").
 * @property {Object} [trap] - The trap instance if the door is trapped.
 */
class Door{
    /**
     * Creates a new Door instance.
     * @constructor
     * @param {Tile} tile - The tile where the door is located.
     * @param {Dungeon} dungeon - The dungeon instance this door belongs to.
     * @property {Dungeon} dungeon - Reference to the parent dungeon.
     * @property {Tile} tile - The tile containing this door.
     * @property {Room|null} room - The room this door belongs to (set during placement).
     * @property {boolean} locked - Whether the door is locked.
     * @property {boolean} trapped - Whether the door is trapped.
     * @property {string} color - The color used to render the door.
     * @property {string} facing - The direction the door faces ("north" by default).
     * @property {Trap} [trap] - The trap instance if the door is trapped.
     */
    constructor(tile, dungeon) {
        this.dungeon = dungeon;
        this.tile = tile;
        this.room = null; // Will be set when placed
        this.locked = this.rollLocked();
        this.trapped = this.rollTrapped();
        this.color = '#8B4513'; // Brown color
        this.facing = "north"; // Default, will be overwritten during placement

        if (this.trapped)
            this.trap = new Trap(this.dungeon);
    }

    /**
     * Returns the appropriate symbol for the door based on its facing direction
     * @returns {string} A symbol representing the door's orientation:
     *                   "—" for north/south facing doors (horizontal)
     *                   "|" for east/west facing doors (vertical)
     *                   "+" as default/fallback symbol
     */
    getSymbol() {
        switch (this.facing) {
            case "north":
            case "south":
                return "—"; // Horizontal door
            case "east":
            case "west":
                return "|"; // Vertical door
            default:
                return "+"; // Default door symbol
        }
    }

    /**
     * Determines if the door is trapped based on a random chance.
     * @returns {boolean} Returns true if the door is trapped (10% chance), false otherwise.
     */
    rollTrapped() {
        return this.dungeon.random() < 0.1;
    }

    /**
     * Determines if the door should be locked based on a random probability.
     * @returns {boolean} Returns true with a 30% probability, indicating the door is locked.
     */
    rollLocked() {
        return this.dungeon.random() < 0.3;
    }

    /**
     * Activates a trap on the door if the door is trapped.
     * @param {Player} player - The player who triggered the trap.
     */
    sprungTrap(player) {
        if (this.trapped)
            this.trap.activate(player);
    }

    /**
     * Sets the door's locked state to true.
     * @method
     */
    lock() {
        this.locked = true;
    }

    /**
     * Unlocks the door by setting its locked state to false.
     */
    unlock() {
        this.locked = false;
    }
}

export default Door;