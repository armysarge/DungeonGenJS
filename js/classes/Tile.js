import Floor from './Floor.js';
import Wall from './Wall.js';
import Door from './Door.js';
import Chest from './Chest.js';
import Corridor from './Corridor.js';
import Creature from './Creature.js';
import Item from './Item.js';

/**
 * Represents a tile in the dungeon.
 * @class
 * @property {string} type - The type of the tile (border, floor, wall, door, chest, corridor, creature, item)
 * @property {Object} obj - The object associated with the tile (Floor, Wall, Door, Chest, Corridor, Creature, or Item instance)
 * @property {string} [color] - The color of the tile (only for border and default types)
 */
class Tile {
    /**
     * Creates a new Tile instance.
     * @constructor
     * @param {string} type - The type of tile ('border', 'floor', 'wall', 'door', 'chest', 'corridor', 'creature', 'item').
     * @param {Object} dungeon - The dungeon instance this tile belongs to.
     * @property {string} type - The type of the tile.
     * @property {string} [color] - The color of the tile (for border and default types).
     * @property {Object} [obj] - The object instance associated with the tile (Floor, Wall, Door, Chest, Corridor, Creature, or Item).
     */
    constructor(type, dungeon) {
        this.type = type;
        switch (type) {
            case 'border':
                this.color = 'gray';
                break;
            case 'floor':
                this.obj = new Floor(this, dungeon);
                break;
            case 'wall':
                this.obj = new Wall(this, dungeon);
                break;
            case 'door':
                this.obj = new Door(this, dungeon);
                break;
            case 'chest':
                this.obj = new Chest(dungeon, false, "", null, 0, 0);
                break;
            case 'corridor':
                this.obj = new Corridor({ x: 0, y: 0 }, { x: 0, y: 0 }, dungeon);
                break;
            case 'creature':
                this.obj = new Creature(dungeon, "", "");
                break;
            case 'item':
                this.obj = new Item(dungeon, "", "");
                break;
            default:
                this.color = 'black';
        }
    }

    /**
     * Sets the type of the tile.
     * @param {string} newType - The new type to assign to the tile.
     */
    setType(newType) {
        this.type = newType;
    }

    /**
     * Gets the type of the tile
     * @returns {string} The type of the tile
     */
    getType() {
        return this.type;
    }

    /**
     * Determines if the tile can be traversed.
     * @returns {boolean} True if the tile is not a wall, false otherwise.
     */
    isPassable() {
        return this.type !== 'wall' && this.type !== 'border' && this.type !== 'door';
    }

    /**
     * Gets the object associated with the tile.
     * @returns {Object} The object associated with the tile.
     */
    getObject() {
        return this.obj;
    }
}

export default Tile;