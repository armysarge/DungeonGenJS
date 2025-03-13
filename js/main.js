import SceneManager from './classes/SceneManager.js';
import Dungeon from './classes/Dungeon.js';
import DungeonRenderer from './classes/DungeonRenderer.js';

const sceneManager = new SceneManager();
const dungeon = new Dungeon(50, 50);
const dungeonRenderer = new DungeonRenderer(sceneManager, dungeon);

function init() {
    dungeon.generateDungeon(); // Generate the dungeon layout
    dungeonRenderer.createDebugControls(); // Add debug controls
    dungeonRenderer.render2D();
}

function animate() {
    requestAnimationFrame(animate);
    dungeonRenderer.update(); // Update the rendering
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});

Object.assign(globalThis, {
    dungeon,
    dungeonRenderer
});