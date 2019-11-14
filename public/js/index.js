/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tileset by 0x72 under CC-0, https://0x72.itch.io/16x16-industrial-tileset
 */

import PlatformerScene from "./platformer-scene.js";

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 960,
  parent: "content",
  pixelArt: true,
  backgroundColor: "#1d212d",
  scene: PlatformerScene,
  /*
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'flex-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  */
  physics: {
    default: "arcade",
    arcade: {
      //debug: true,
      gravity: { y: 1700 }
    }
  }
};

const game = new Phaser.Game(config);
