import Player from "./player.js";
import Bomb from './bomb.js'

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
    this.load.audio('bgm', '../assets/sfx/Nario - The Tale of a Pirate.mp3');
  }

  create() {
    this.socket = io();
    this.isPlayerDead = false;
    this.elapsedTime = 0;
    this.mute = false;

    this.inputMessage = document.getElementById('inputMessage');
    this.messages = document.getElementById('messages');

    const map = this.make.tilemap({ key: "map" });
    const tiles = map.addTilesetImage("Tile-Sets (64-64)", "tiles");

    map.createStaticLayer("background", tiles);
    this.foreground = map.createStaticLayer("foreground", tiles);
    this.foreground.setCollisionByProperty({ collides: true });


    this.spawnPoints = map.filterObjects("Objects", obj => obj.name === "Spawn Point");
    const spawnPoint = this.spawnPoints[Math.floor(Math.random() * (this.spawnPoints.length - 1))];
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

    this.musicText = this.add
      .text(16, 100, "Mute music", {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      }).setInteractive()
      .on('pointerdown', () => {
        this.mute = !this.mute;
        bgm.setMute(this.mute);
        this.musicText.setText(!this.mute ? "Mute music" : "Unmute music");
      });

    this.highScore = this.add
      .text(this.cameras.main.width - 400, 16, "", {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff"
      })
      .setScrollFactor(0);

    this.players = this.add.group();
    this.players.add(this.player);

    this.createConnectionCallbacks();

    window.addEventListener('keydown', event => {
      if (event.which === 13) {
        this.sendMessage();
      }
      if (event.which === 32) {
        if (document.activeElement === this.inputMessage) {
          this.inputMessage.value = this.inputMessage.value + ' ';
        }
      }
    });

    var bgm = this.sound.add('bgm', { volume: 0.4 });
    bgm.setLoop(true);
    bgm.play();
  }

  update(time, delta) {
    if (!this.isPlayerDead) {
      this.player.update(delta);
      this.elapsedTime += delta;
      if (this.elapsedTime > 50) {
        this.socket.emit('playerMovement', { dx: this.player.body.velocity.x, dy: this.player.body.velocity.y, x: this.player.x, y: this.player.y, flipX: this.player.flipX, animation: this.player.anims.currentAnim.key });
        this.elapsedTime = 0;
      }
    }
  }

  addOtherPlayers(playerInfo) {
    //const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, 'player');
    const otherPlayer = new Player(this, playerInfo.x, playerInfo.y, true);
    otherPlayer.setTint(Math.random() * 0xffffff);
    otherPlayer.setVisible(false);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.name = playerInfo.name;
    otherPlayer.kills = playerInfo.kills;
    otherPlayer.deaths = playerInfo.deaths;
    this.players.add(otherPlayer);
  }

  createConnectionCallbacks() {
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId !== this.socket.id) {
          this.addOtherPlayers(players[id]);
          console.log('new player[1] ' + players[id].playerId);
        }
        else {
          this.player.playerId = this.socket.id;
          this.player.kills = 0;
          this.player.deaths = 0;
          console.log('my id ' + this.socket.id);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('newPlayer', function (playerInfo) {
      this.addOtherPlayers(playerInfo);
    }.bind(this));

    this.socket.on('disconnect', function (playerId) {
      this.players.getChildren().forEach(function (player) {
        if (playerId === player.playerId) {
          player.destroy();
          this.players.remove(player);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('score', function (players) {
      let highScoreText = 'Name/Kills/Deaths\n';
      players.sort((a, b) => a.score - b.score);
      players.forEach(function (player) {
        highScoreText += `${player.name}/${player.kills}/${player.deaths} \n`;
      }.bind(this));
      this.highScore.setText(highScoreText);
    }.bind(this));

    this.socket.on('playerMoved', function (playerInfo) {
      this.players.getChildren().forEach(function (player) {
        if (playerInfo.playerId === player.playerId) {
          player.flipX = playerInfo.flipX;
          player.body.setVelocity(playerInfo.dx, playerInfo.dy);
          player.setPosition(playerInfo.x, playerInfo.y);
          player.play(playerInfo.animation, true);
          player.currentAnim = playerInfo.animation;

          player.setVisible(true);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('playerDead', function (killerId, dx, dy) {
      this.players.getChildren().forEach(function (player) {
        if (killerId === player.playerId) {
          player.play('player-dead');
          player.die(dx, dy);
        }
      }.bind(this));
    }.bind(this));

    this.socket.on('playerShoot', function (data) {
      new Bomb(this, data.x, data.y, data.id);
    }.bind(this));

    this.socket.on('new message', (data) => {
      const usernameSpan = document.createElement('span');
      const usernameText = document.createTextNode(data.username);
      usernameSpan.className = 'username';
      usernameSpan.appendChild(usernameText);

      const messageBodySpan = document.createElement('span');
      const messageBodyText = document.createTextNode(data.message);
      messageBodySpan.className = 'messageBody';
      messageBodySpan.appendChild(messageBodyText);

      const messageLi = document.createElement('li');
      messageLi.setAttribute('username', data.username);
      messageLi.append(usernameSpan);
      messageLi.append(messageBodySpan);

      this.addMessageElement(messageLi);
    });
  }

  addMessageElement(el) {
    this.messages.append(el);
    this.messages.lastChild.scrollIntoView();
  }

  sendMessage() {
    let message = this.inputMessage.value;
    if (message) {
      this.inputMessage.value = '';
      //post      
    }
  }
}
