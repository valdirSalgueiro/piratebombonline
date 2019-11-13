/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tileset by 0x72 under CC-0, https://0x72.itch.io/16x16-industrial-tileset
 */

import PhaserMatterCollisionPlugin from "./phaser-matter-collision-plugin/index.js";
import PlatformerScene from "./platformer-scene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "content",
  pixelArt: true,
  backgroundColor: "#1d212d",
  scene: PlatformerScene,
   physics: {
    default: "matter",
    matter: {
      gravity: { y: 1 } 
    }
  },
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin, // The plugin class
        key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
        mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision
      }
    ]
  }
};

const game = new Phaser.Game(config);
