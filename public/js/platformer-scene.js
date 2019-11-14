import Player from "./player.js";

/**
 * A class that extends Phaser.Scene and wraps up the core logic for the platformer level.
 */
export default class PlatformerScene extends Phaser.Scene {
  preload() {
    this.load.spritesheet(
      "player",
      "../assets/spritesheets/bombguy.png",
      {
        frameWidth: 58,
        frameHeight: 58
      }
    );

    this.load.spritesheet(
      "bomb",
      "../assets/spritesheets/bomb.png",
      {
        frameWidth: 32,
        frameHeight: 51
      }
    );

    this.load.spritesheet(
      "bomb-explosion",
      "../assets/spritesheets/bombexplosion.png",
      {
        frameWidth: 96,
        frameHeight: 108
      }
    );

    this.load.image("tiles", "../assets/tilesets/Tile-Sets (64-64).png");
    this.load.tilemapTiledJSON("map", "../assets/tilemaps/piratebomb.json");
  }

  create() {
    this.isPlayerDead = false;

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("Tile-Sets (64-64)", "tiles");

    map.createStaticLayer("background", tiles);
    this.foreground = map.createStaticLayer("foreground", tiles);
    this.foreground.setCollisionByProperty({ collides: true });


    this.spawnPoints = map.filterObjects("Objects", obj => obj.name === "Spawn Point");
    const spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length - 1)];
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.foreground.forEachTile(tile => {
      if (tile.index === 29 || tile.index === 30 || tile.index === 23 || tile.index === 24) {
        tile.setCollision(false, false, true, false);
      }
    });

    this.add
      .text(16, 16, "code: valdirSalgueiro\ngfx: pixelfrog", {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);

    this.players = this.add.group();
    this.players.add(this.player);
  }

  update(time, delta) {
    if (this.isPlayerDead) return;

    this.player.update();
  }
}
