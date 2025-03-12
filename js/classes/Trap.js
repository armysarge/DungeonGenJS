/**
 * Represents a trap in the dungeon that can damage players.
 * @class
 * @property {object} dungeon - Reference to the dungeon instance containing this trap
 * @property {number} damage - Amount of damage the trap deals when activated
 * @property {string} type - The type of trap ("arrow", "spike", "fire", "poison", "pitfall", "frost", "arcane")
 * @property {boolean} sprung - Whether the trap has been activated
 * @property {number} difficulty - How difficult the trap is to detect and disarm (1-10)
 * @property {boolean} hidden - Whether the trap is currently concealed
 * @property {string} effect - Special effect the trap applies beyond damage
 * @property {number} duration - Duration of special effects in turns
 */
class Trap {
    /**
     * Creates a new Trap instance.
     * @constructor
     * @param {Dungeon} dungeon - The dungeon instance where the trap is located.
     * @param {number} [difficulty=0] - Optional difficulty override (0 means random)
     */
    constructor(dungeon, difficulty = 0) {
        this.dungeon = dungeon;
        this.sprung = false;
        this.hidden = true;

        // Determine trap difficulty (affects damage and detection)
        this.difficulty = difficulty || Math.floor(this.dungeon.random() * 10) + 1;

        // Set damage based on difficulty
        this.damage = 5 + Math.floor(this.difficulty * 1.5);

        // Determine trap type and special effects
        this.type = this.randomType();
        this.setEffectsByType();
    }

    /**
     * Randomly selects a trap type from an expanded list of options.
     * @returns {string} A random trap type
     * @memberof Trap
     * @method randomType
     */
    randomType() {
        const types = ["arrow", "spike", "fire", "poison", "pitfall", "frost", "arcane"];
        return types[Math.floor(this.dungeon.random() * types.length)];
    }

    /**
     * Sets special effects and additional properties based on trap type
     * @private
     */
    setEffectsByType() {
        this.effect = "none";
        this.duration = 0;

        switch (this.type) {
            case "arrow":
                // Arrows do direct damage with chance to cause bleeding
                if (this.dungeon.random() > 0.7) {
                    this.effect = "bleeding";
                    this.duration = Math.floor(this.difficulty / 3) + 1;
                }
                break;
            case "spike":
                // Spikes do high damage but no special effect
                this.damage += 3;
                break;
            case "fire":
                this.effect = "burning";
                this.duration = Math.floor(this.difficulty / 2) + 1;
                break;
            case "poison":
                this.damage = Math.floor(this.damage * 0.7); // Less immediate damage
                this.effect = "poisoned";
                this.duration = this.difficulty;
                break;
            case "pitfall":
                this.effect = "immobilized";
                this.duration = Math.floor(this.difficulty / 3) + 1;
                break;
            case "frost":
                this.effect = "slowed";
                this.duration = Math.floor(this.difficulty / 2) + 2;
                break;
            case "arcane":
                this.effect = "confused";
                this.duration = Math.floor(this.difficulty / 3) + 1;
                break;
        }
    }

    /**
     * Activates the trap, causing damage to the player and applying special effects
     * @param {Player} player - The player object that triggered the trap
     * @returns {object} Object containing damage dealt and effect applied
     */
    activate(player) {
        if (this.sprung) {
            return { damage: 0, effect: "none" };
        }

        const damageDealt = player.takeDamage(this.damage, this.type, "trap");

        // Apply special effects
        if (this.effect !== "none") {
            player.applyStatusEffect(this.effect, this.duration);
        }

        this.sprung = true;
        this.hidden = false;

        return { damage: damageDealt, effect: this.effect, duration: this.duration };
    }

    /**
     * Attempt to detect the trap
     * @param {Player} player - The player attempting to find the trap
     * @param {number} perceptionBonus - Any bonus to perception checks
     * @returns {boolean} Whether the trap was successfully detected
     */
    detect(player, perceptionBonus = 0) {
        if (!this.hidden) return true;

        const detectionThreshold = 10 + this.difficulty * 1.5;
        const detectionRoll = (player.perception || 10) + perceptionBonus +
                             Math.floor(this.dungeon.random() * 20) + 1;

        if (detectionRoll >= detectionThreshold) {
            this.hidden = false;
            return true;
        }
        return false;
    }

    /**
     * Attempt to disarm the trap
     * @param {Player} player - The player attempting to disarm the trap
     * @param {number} disarmBonus - Any bonus to disarm checks
     * @returns {object} Result object with success boolean and message
     */
    disarm(player, disarmBonus = 0) {
        if (this.sprung) {
            return { success: false, message: "This trap has already been triggered." };
        }

        const disarmThreshold = 8 + this.difficulty * 2;
        const disarmRoll = (player.dexterity || 10) + disarmBonus +
                          Math.floor(this.dungeon.random() * 20) + 1;

        if (disarmRoll >= disarmThreshold) {
            this.sprung = true;
            return { success: true, message: "You successfully disarm the trap." };
        } else if (disarmRoll <= this.difficulty) {
            // Critical failure triggers the trap
            const result = this.activate(player);
            return {
                success: false,
                message: `You failed badly! The trap triggers, dealing ${result.damage} damage.`,
                triggered: true,
                result: result
            };
        } else {
            return { success: false, message: "You failed to disarm the trap." };
        }
    }

    /**
     * Checks if the trap has been sprung (activated/triggered).
     * @returns {boolean} True if the trap has been sprung, false otherwise.
     */
    isSprung() {
        return this.sprung;
    }

    /**
     * Checks if the trap is currently hidden.
     * @returns {boolean} True if the trap is hidden, false if it's visible.
     */
    isHidden() {
        return this.hidden;
    }

    /**
     * Get description of the trap based on its visibility state
     * @returns {string} Description of the trap
     */
    getDescription() {
        if (this.hidden) {
            return "The floor looks suspicious here.";
        }

        if (this.sprung) {
            return `A triggered ${this.type} trap.`;
        }

        let description = `A dangerous ${this.type} trap`;

        switch (this.type) {
            case "arrow":
                description += " with poison-tipped darts ready to fire from the walls";
                break;
            case "spike":
                description += " with sharp metal spikes poised to spring from the floor";
                break;
            case "fire":
                description += " with hidden flame jets built into the floor";
                break;
            case "poison":
                description += " that will release toxic gas when triggered";
                break;
            case "pitfall":
                description += " disguised as normal flooring";
                break;
            case "frost":
                description += " that will spray freezing mist when activated";
                break;
            case "arcane":
                description += " glowing with magical runes";
                break;
        }

        return description + ".";
    }

    /**
     * Removes the trap from the dungeon.
     * This method handles the cleanup and deletion of the trap instance from the game environment.
     * @method
     * @memberof Trap
     */
    destroy() {
        // Remove the trap from the dungeon's trap collection
        if (this.dungeon.traps) {
            const index = this.dungeon.traps.indexOf(this);
            if (index > -1) {
                this.dungeon.traps.splice(index, 1);
            }
        }
    }
}

export default Trap;