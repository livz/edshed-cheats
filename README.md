# EdShed Game Cheats

A collection of browser-based cheat scripts for [EdShed](https://play.edshed.com), the educational platform behind Spelling Shed and MathShed. Each script is a self-contained userscript compatible with [Tampermonkey](https://www.tampermonkey.net) and [Userscripts for Safari](https://apps.apple.com/app/userscripts/id1463298887).

---

## How these were built

EdShed's games run on **[Phaser](https://phaser.io)**, a popular open-source HTML5 game framework that renders to a `<canvas>` element. The game logic lives entirely in the browser as compiled/minified JavaScript.

The UI shell around the canvas is built with **Vue 2**, which means the game state (health, currency, unlocked units) is exposed on Vue component instances accessible via `element.__vue__` in the browser console. By tracing the data flow from the Vue overlay down to the underlying Phaser scene object, it's possible to intercept property reads and writes using `Object.defineProperty` — locking values at a desired floor without the game ever knowing.

Each script injects a floating control panel into the page and polls for the game component to appear, making it resilient to SPA navigation (navigating away and back re-attaches automatically).

---

## Phaser

[Phaser](https://phaser.io) is an open-source 2D game framework for the web, built on WebGL and Canvas. It handles physics, tilemaps, animations, asset loading, and scene management. Game state is typically stored directly on `Phaser.Scene` subclass instances, making it straightforward to access once you locate the active scene via `game.scene.scenes`.

---

## Scripts

### 🐝 BeeSieged — `beesieged/edshed-cheats.user.js`

**Game:** The tower-defence game embedded in EdShed, where you place bee units to defend against incoming bug enemies. Currency is called *pollen*; you lose when health reaches zero.

**Cheats included:**

| Cheat | How it works |
|---|---|
| **Infinite Pollen** | Uses `Object.defineProperty` on `scene.money` to intercept every write. Any time the game tries to deduct pollen, the setter enforces a configurable floor (default 9,999). |
| **Infinite Health** | Same technique on `scene.health`, damage writes are intercepted and the value is never allowed to drop below 9,999. |
| **Unlock All Units** | The Vue component stores unlocked units as `gameComp.unitsUnlocked` as an array of `{ key, unlockedThisSession }` objects. Replacing it with the full unit list immediately removes all lock icons from the sidebar. |

**PIN lock:** The panel is protected by a configurable 4-digit PIN (change the `SECRET_PIN` constant at the top of the script) so younger players cannot access the cheats themselves.

**SPA resilience:** The script continuously watches for the game component rather than polling once. If you navigate away and back, it detects the stale scene reference, resets, and re-attaches, reapplying any cheats that were active.

---

## Adding a new script

1. Create a subfolder named after the game (e.g. `mathshed/`)
2. Add your `.user.js` file
3. Document it in this README under **Scripts**
