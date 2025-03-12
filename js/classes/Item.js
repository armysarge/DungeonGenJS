/**
 * Represents an item in the dungeon that can be collected and used by the player.
 * Items can be keys, gold, weapons, armor, potions, or scrolls.
 */
class Item {
    /**
     * Creates a new Item instance.
     * @param {Object} dungeon - The dungeon instance this item belongs to
     * @param {string} type - The type of item. If empty, a random type will be assigned
     * @param {number} [modifier] - Modifier used for gold value calculation
     */
    constructor(dungeon, type, modifier) {
        this.type = type;
        this.dungeon = dungeon;

        if (this.type === "") {
            this.type = this.rollType();
        }

        if (this.type === "gold") {
            this.amount = this.rollGoldValue(modifier);
        }

        if (this.type === "doorKey" || this.type === "chestKey") {
            this.keyId = null; // Will be set when placed
        }
    }

    /**
     * Gets the display color for the item based on its type
     * @returns {string} The hex color code for the item
     */
    getItemColor() {
        switch(this.type) {
            case "doorKey": return "#FFD700"; // Gold
            case "chestKey": return "#C0C0C0"; // Silver
            case "gold": return "#FFD700"; // Gold
            case "weapon": return "#A52A2A"; // Brown
            case "armor": return "#708090"; // Slate gray
            case "potion": return "#FF0000"; // Red
            case "scroll": return "#F5F5DC"; // Beige
            default: return "#FFFFFF"; // White
        }
    }

    /**
     * Generates a random gold value for gold type items
     * @param {number} [modifier=10] - Modifier to affect the gold value range
     * @returns {number} The randomly generated gold value
     */
    rollGoldValue(modifier){
        if (typeof modifier === 'undefined') modifier = 10;
        return Math.floor(this.dungeon.random() * modifier) + 1;
    }

    /**
     * Randomly selects an item type from available options
     * @returns {string} The randomly selected item type
     */
    rollType() {
        const types = ["weapon", "armor", "potion", "scroll", "gold"];
        return types[Math.floor(this.dungeon.random() * types.length)];
    }

    /**
     * Handles the usage of the item by the player
     * @param {Object} player - The player using the item
     */
    use(player) {
        switch(this.type) {
            case "doorKey":
                console.log(`Player used door key to unlock door ${this.keyId}`);
                break;
            case "chestKey":
                console.log(`Player used chest key to unlock chest ${this.keyId}`);
                break;
            default:
                console.log(`Player used a ${this.type}.`);
        }
    }
}

export default Item;