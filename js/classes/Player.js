/**
 * Represents a player in the dungeon game.
 * @class
 * @classdesc Handles player state including health, damage taking, healing, and position management.
 */
class Player {
    /**
     * Creates a new Player instance.
     * @param {number} health - The initial health points of the player.
     * @param {number} [x=0] - Initial x coordinate
     * @param {number} [y=0] - Initial y coordinate
     */
    constructor(health, x = 0, y = 0) {
        this.health = health;
        this.maxHealth = health;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.experience = 0;
        this.gold = 0;
        this.inventory = [];
        this.maxInventorySize = 20;
        this.equipped = {
            weapon: null,
            armor: null,
            shield: null,
            accessory: null
        };
        this.stats = {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            defense: 5,
            speed: 5
        };
        this.status = {
            poisoned: false,
            stunned: false,
            blessed: false
        };
    }

    /**
     * Reduces the player's health when taking damage from traps or other sources.
     * @param {number} amount - The amount of damage to be dealt.
     * @param {string} obj - The object that caused the damage.
     * @param {string} type - The type of damage being dealt.
     */
    takeDamage(amount, obj, type) {
        this.health -= amount;
        console.log(`${type} trap triggered on ${obj}! Player takes ${amount} damage.`);
    }

    /**
     * Increases the player's health by the specified amount.
     * @param {number} healAmount - The amount of health to restore.
     */
    heal(healAmount) {
        this.health += healAmount;
    }

    /**
     * Adds an item to the player's inventory if there's space
     * @param {Object} item - The item to add
     * @returns {boolean} Whether the item was successfully added
     */
    addToInventory(item) {
        if (this.inventory.length >= this.maxInventorySize) {
            console.log("Inventory is full!");
            return false;
        }
        this.inventory.push(item);
        return true;
    }

    /**
     * Removes an item from the inventory
     * @param {number} index - The inventory index of the item
     * @returns {Object|null} The removed item or null if invalid index
     */
    removeFromInventory(index) {
        if (index >= 0 && index < this.inventory.length) {
            return this.inventory.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Equips an item in the appropriate slot
     * @param {Object} item - The item to equip
     * @returns {Object|null} The previously equipped item or null
     */
    equipItem(item) {
        const slot = item.type;
        if (this.equipped.hasOwnProperty(slot)) {
            const oldItem = this.equipped[slot];
            this.equipped[slot] = item;
            return oldItem;
        }
        return null;
    }

    /**
     * Updates the player's position in the dungeon.
     * @param {number} newX - New x coordinate
     * @param {number} newY - New y coordinate
     * @param {Object} dungeon - The dungeon layout for collision detection
     * @returns {boolean} Whether the move was successful
     */
    updatePosition(newX, newY, dungeon) {
        if (dungeon.isValidMove(newX, newY)) {
            this.x = newX;
            this.y = newY;
            return true;
        }
        return false;
    }

    /**
     * Gains experience points and handles leveling up
     * @param {number} exp - Amount of experience to gain
     */
    gainExperience(exp) {
        this.experience += exp;
        const expNeeded = this.level * 100; // Simple level scaling
        if (this.experience >= expNeeded) {
            this.levelUp();
        }
    }

    /**
     * Handles the level up process
     */
    levelUp() {
        this.level++;
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.stats.strength += 2;
        this.stats.dexterity += 2;
        this.stats.intelligence += 2;
        this.stats.defense += 1;
        console.log(`Level up! Now level ${this.level}!`);
    }

    /**
     * Calculates the total damage output including equipment bonuses
     * @returns {number} The total damage
     */
    calculateDamage() {
        let baseDamage = this.stats.strength;
        if (this.equipped.weapon) {
            baseDamage += this.equipped.weapon.damage;
        }
        return baseDamage;
    }

    /**
     * Applies a status effect to the player
     * @param {string} effect - The status effect to apply
     * @param {number} duration - How long the effect lasts in turns
     */
    applyStatus(effect, duration) {
        if (this.status.hasOwnProperty(effect)) {
            this.status[effect] = true;
            setTimeout(() => {
                this.status[effect] = false;
            }, duration * 1000); // Convert turns to milliseconds
        }
    }

    /**
     * Checks if the player is still alive.
     * @returns {boolean} True if player's health is above 0, false otherwise.
     */
    isAlive() {
        return this.health > 0;
    }
}