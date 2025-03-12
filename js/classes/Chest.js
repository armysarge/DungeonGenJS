import Item from "./Item.js";

/**
 * Represents a chest in the dungeon that can contain loot and be locked/unlocked
 */
class Chest{
    /**
     * Creates a new Chest instance
     * @param {Object} dungeon - The dungeon instance this chest belongs to
     * @param {boolean} locked - Whether the chest is locked
     * @param {string} quality - The quality level of the chest ("common", "uncommon", "rare", "epic", "legendary")
     * @param {Object} room - The room instance this chest is located in
     * @param {number} x - The x coordinate of the chest
     * @param {number} y - The y coordinate of the chest
     */
    constructor(dungeon, locked, quality, room, x, y) {
        this.x = x;
        this.y = y;
        this.room = room;
        this.loot = [];
        this.quality = quality;
        this.dungeon = dungeon;
        if (this.quality == "")
            this.quality = this.rollQuality();
        this.locked = locked;
        if (this.locked == "")
            this.locked = this.rollLocked();
        this.generateLoot();
    }

    /**
     * Gets the color associated with the chest's quality level
     * @returns {string} The color name corresponding to the chest's quality
     */
    getChestColor() {
        switch (this.quality) {
            case "common":
                return "brown";
            case "uncommon":
                return "green";
            case "rare":
                return "blue";
            case "epic":
                return "purple";
            case "legendary":
                return "orange";
        }
    }

    /**
     * Sets the type of the chest
     * @param {string} type - The type to set for the chest
     */
    setType(type){
        this.type = type;
    }

    /**
     * Adds an item to the chest's loot
     * @param {Object} item - The item to add to the chest
     */
    addLoot(item) {
        this.loot.push(item);
    }

    /**
     * Removes an item from the chest's loot
     * @param {Object} item - The item to remove from the chest
     */
    removeLoot(item) {
        this.loot = this.loot.filter(i => i !== item);
    }

    /**
     * Determines if the chest should be locked based on its quality
     * @returns {boolean} True if the chest should be locked, false otherwise
     */
    rollLocked() {

        //epic and legendary chests are always locked
        if (this.quality === "epic" || this.quality === "legendary")
            return true;

        return this.dungeon.random() < 0.3;
    }

    /**
     * Randomly determines the quality of the chest
     * @returns {string} The quality level ("common", "uncommon", "rare", "epic", or "legendary")
     */
    rollQuality() {
        const qualities = ["common", "uncommon", "rare", "epic", "legendary"];

        //each quality has a different chance of being rolled
        const roll = this.dungeon.random();
        if (roll < 0.5) return qualities[0]; // common
        if (roll < 0.7) return qualities[1]; // uncommon
        if (roll < 0.85) return qualities[2]; // rare
        if (roll < 0.95) return qualities[3]; // epic
        if (roll < 1) return qualities[4]; // legendary
    }

    /**
     * Generates random loot for the chest based on its quality
     */
    //based on the quality of the chest, roll a random item type/s
    generateLoot(){
        let itemCount = 2;
        switch(this.quality){
            case "uncommon":
                itemCount = 4;
                break;
            case "rare":
                itemCount = 6;
                break;
            case "epic":
                itemCount = 8;
                break;
            case "legendary":
                itemCount = 10;
                break;
        }

        itemCount = Math.floor(this.dungeon.random() * itemCount) + 1;

        for (let i = 0; i < itemCount; i++) {
            const newItem = new Item(this.dungeon, "");
            this.loot.push(newItem);
            if(this.dungeon.debug)console.log(`Generated item of type: ${newItem.type}`);
        }
    }

    /**
     * Opens the chest and transfers items to the player if not locked
     * @param {Object} player - The player attempting to open the chest
     */
    open(player) {
        if (this.locked) {
            console.log("The chest is locked! You need to unlock it first.");
            return;
        }
        // Transfer items to player
        this.items.forEach(item => {
            player.addItem(item);
            this.removeItem(item);
        });
    }

    /**
     * Unlocks the chest
     */
    unlock() {
        this.locked = false;
    }

    /**
     * Checks if the chest is locked
     * @returns {boolean} True if the chest is locked, false otherwise
     */
    isLocked() {
        return this.locked;
    }
}

export default Chest;