import Item from "./Item.js";

/**
 * Represents a creature/monster in the dungeon game world
 * @class Creature
 * @property {string} type - The type/species of the creature
 * @property {number} health - Current health points of the creature
 * @property {boolean} asleep - Whether the creature is currently sleeping
 * @property {Array<Item>} loot - Items carried by the creature
 * @property {number} level - Experience level of the creature
 * @property {number} damage - Base damage the creature can deal
 * @property {number} armor - Armor class/defense rating
 * @property {boolean} hostile - Whether the creature is hostile by default
 */
class Creature {
    /**
     * Creates a new creature instance
     * @param {Dungeon} dungeon - Reference to the dungeon instance
     * @param {string} type - Type of creature (empty string for random)
     * @param {number} health - Initial health points (empty string for random)
     */
    constructor(dungeon, type, health) {
        this.type = type;
        this.dungeon = dungeon;
        this.level = 1;
        this.experience = 0;
        this.damage = 0;
        this.armor = 0;
        this.hostile = true;
        this.status = [];
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // milliseconds

        if (this.type == "")
            this.rollType();

        this.health = health;
        if (this.health == "")
            this.health = this.rollHealth();

        this.maxHealth = this.health;
        this.rollAsleep();
        this.loot = [];
        this.initializeStats();
        this.rollLoot();
    }

    /**
     * Randomly determines the creature type based on rarity
     * @private
     */
    rollType() {
        const roll = Mathis.dungeonth.random();
        if (roll < 0.4) {
            // Common monsters (40% chance)
            this.type = ["spider", "goblin"][Math.floor(this.dungeon.random() * 2)];
        } else if (roll < 0.7) {
            // Uncommon monsters (30% chance)
            this.type = ["skeleton","zombie"][Math.floor(this.dungeon.random() * 2)];
        } else if (roll < 0.9) {
            // Rare monster (20% chance)
            this.type = ["orc", "troll"][Math.floor(this.dungeon.random() * 2)];
        } else {
            // Very rare monsters (10% chance)
            this.type = ["whelp", "demon", "lich"][Math.floor(this.dungeon.random() * 3)];
        }

        //based on type, set health
        if (this.health == "")
            this.health = this.rollHealth();
    }

    /**
     * Calculates initial health based on creature type
     * @private
     * @returns {number} Initial health points
     */
    rollHealth() {
        switch (this.type) {
            case "spider":
                return Math.floor(this.dungeon.random() * 8) + 3; // 3-11 health
            case "goblin":
                return Math.floor(this.dungeon.random() * 10) + 5; // 5-15 health
            case "skeleton":
                return Math.floor(this.dungeon.random() * 10) + 10; // 10-20 health
            case "zombie":
                return Math.floor(this.dungeon.random() * 10) + 15; // 15-25 health
            case "orc":
                return Math.floor(this.dungeon.random() * 10) + 20; // 20-30 health
            case "troll":
                return Math.floor(this.dungeon.random() * 10) + 30; // 30-40 health
            case "whelp":
                return Math.floor(this.dungeon.random() * 15) + 35; // 35-50 health
            case "demon":
                return Math.floor(this.dungeon.random() * 20) + 45; // 45-65 health
            case "lich":
                return Math.floor(this.dungeon.random() * 25) + 60; // 60-85 health
            default:
                return 10;
        }
    }

    /**
     * Initializes creature stats based on type
     * @private
     */
    initializeStats() {
        switch (this.type) {
            case "spider":
                this.damage = 3;
                this.armor = 2;
                this.level = 1;
                break;
            case "goblin":
                this.damage = 4;
                this.armor = 3;
                this.level = 1;
                break;
            case "skeleton":
                this.damage = 6;
                this.armor = 4;
                this.level = 2;
                break;
            case "zombie":
                this.damage = 5;
                this.armor = 6;
                this.level = 2;
                break;
            case "orc":
                this.damage = 8;
                this.armor = 5;
                this.level = 3;
                break;
            case "troll":
                this.damage = 10;
                this.armor = 8;
                this.level = 4;
                break;
            case "whelp":
                this.damage = 12;
                this.armor = 10;
                this.level = 5;
                break;
            case "demon":
                this.damage = 15;
                this.armor = 12;
                this.level = 6;
                break;
            case "lich":
                this.damage = 20;
                this.armor = 15;
                this.level = 7;
                break;
        }
    }

    /**
     * Randomly generates loot for the creature based on its type
     * @private
     */
    rollLoot() {
        // Base gold amount based on creature level
        const baseGold = this.level * 10;
        const goldRoll = this.dungeon.random();

        switch (this.type) {
            case "spider":
                if (goldRoll < 0.3) this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * 0.5)));
                if (this.dungeon.random() < 0.4) this.loot.push(new Item(this.dungeon, "spider_venom"));
                break;
            case "goblin":
                this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * (0.8 + this.dungeon.random() * 0.4))));
                if (this.dungeon.random() < 0.3) this.loot.push(new Item(this.dungeon, "dagger"));
                if (this.dungeon.random() < 0.2) this.loot.push(new Item(this.dungeon, "leather_scrap"));
                break;
            case "skeleton":
                if (goldRoll < 0.4) this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * 1.2)));
                if (this.dungeon.random() < 0.4) this.loot.push(new Item(this.dungeon, "bone"));
                if (this.dungeon.random() < 0.3) this.loot.push(new Item(this.dungeon, "rusty_sword"));
                if (this.dungeon.random() < 0.1) this.loot.push(new Item(this.dungeon, "shield"));
                break;
            case "zombie":
                if (goldRoll < 0.5) this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * 1.5)));
                if (this.dungeon.random() < 0.4) this.loot.push(new Item(this.dungeon, "rotten_flesh"));
                if (this.dungeon.random() < 0.2) this.loot.push(new Item(this.dungeon, "leather_armor"));
                break;
            case "orc":
                this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * (1.5 + this.dungeon.random()))));
                if (this.dungeon.random() < 0.4) this.loot.push(new Item(this.dungeon, "battle_axe"));
                if (this.dungeon.random() < 0.3) this.loot.push(new Item(this.dungeon, "iron_armor"));
                if (this.dungeon.random() < 0.1) this.loot.push(new Item(this.dungeon, "health_potion"));
                break;
            case "troll":
                this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * (2 + this.dungeon.random()))));
                if (this.dungeon.random() < 0.5) this.loot.push(new Item(this.dungeon, "troll_hide"));
                if (this.dungeon.random() < 0.3) this.loot.push(new Item(this.dungeon, "club"));
                if (this.dungeon.random() < 0.2) this.loot.push(new Item(this.dungeon, "strength_potion"));
                break;
            case "whelp":
                this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * (2.5 + this.dungeon.random()))));
                if (this.dungeon.random() < 0.6) this.loot.push(new Item(this.dungeon, "dragon_scale"));
                if (this.dungeon.random() < 0.2) this.loot.push(new Item(this.dungeon, "fire_essence"));
                break;
            case "demon":
                this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * (3 + this.dungeon.random()))));
                if (this.dungeon.random() < 0.5) this.loot.push(new Item(this.dungeon, "demon_heart"));
                if (this.dungeon.random() < 0.3) this.loot.push(new Item(this.dungeon, "hellfire_essence"));
                if (this.dungeon.random() < 0.1) this.loot.push(new Item(this.dungeon, "demonic_weapon"));
                break;
            case "lich":
                this.loot.push(new Item(this.dungeon, "gold", Math.floor(baseGold * (4 + this.dungeon.random()))));
                if (this.dungeon.random() < 0.7) this.loot.push(new Item(this.dungeon, "soul_gem"));
                if (this.dungeon.random() < 0.4) this.loot.push(new Item(this.dungeon, "spellbook"));
                if (this.dungeon.random() < 0.2) this.loot.push(new Item(this.dungeon, "staff_of_power"));
                if (this.dungeon.random() < 0.1) this.loot.push(new Item(this.dungeon, "phylactery_shard"));
                break;
        }
    }

    /**
     * Gets the display color for the creature
     * @returns {string} Color name for rendering
     */
    getCreatureColor(){
        switch (this.type) {
            case "goblin":
                return "green";
            case "skeleton":
                return "white";
            case "zombie":
                return "gray";
            case "orc":
                return "brown";
            case "troll":
                return "darkgreen";
            case "whelp":
                return "red";
            case "demon":
                return "purple";
            case "lich":
                return "blue";
        }
    }

    /**
     * Determines if creature starts asleep
     * @private
     */
    rollAsleep() {
        this.asleep = this.dungeon.random() < 0.10;
    }

    /**
     * Adds an item to creature's loot
     * @param {Item} item - Item to add to loot
     */
    addLoot(item) {
        this.loot.push(item);
    }

    /**
     * Removes an item from creature's loot
     * @param {Item} item - Item to remove
     */
    removeLoot(item) {
        this.loot = this.loot.filter(i => i !== item);
    }

    /**
     * Attacks a player
     * @param {Player} player - Player to attack
     * @returns {boolean} Whether the attack was successful
     */
    attack(player) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) {
            return false;
        }

        const damage = Math.max(1, this.damage - Math.floor(player.armor / 2));
        player.takeDamage(damage);
        this.lastAttackTime = now;
        return true;
    }

    /**
     * Checks if creature is sleeping
     * @returns {boolean} Sleep status
     */
    isAsleep() {
        return this.asleep;
    }

    /**
     * Applies damage to the creature
     * @param {number} amount - Amount of damage to take
     * @returns {boolean} Whether the creature died
     */
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - Math.floor(this.armor / 2));
        this.health = Math.max(0, this.health - actualDamage);
        this.asleep = false; // Wake up when damaged
        return this.health <= 0;
    }

    /**
     * Heals the creature
     * @param {number} amount - Amount of health to restore
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Adds a status effect to the creature
     * @param {string} effect - Status effect to add
     * @param {number} duration - Duration in turns
     */
    addStatus(effect, duration) {
        this.status.push({ effect, duration });
    }

    /**
     * Updates status effects, called each turn
     */
    updateStatus() {
        this.status = this.status.filter(status => {
            status.duration--;
            return status.duration > 0;
        });
    }
}


export default Creature;