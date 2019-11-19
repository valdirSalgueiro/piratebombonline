import Bomb from "./bomb.js";
import Input from "./input.js";

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, enemy = false) {
    super(scene, x, y, "player");

    scene.add.existing(this);

    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.foreground);
    this.body.setDrag(1000, 0).setMaxVelocity(300, 1000);

    if (enemy) return;

    this.scene = scene;
    this.jumping = 0;
    this.oldGround = 0;
    this.fireTimer = Infinity;
    this.jumpTimer = Infinity;
    this.dead = false;

    const anims = scene.anims;
    anims.create({
      key: "player-idle",
      frames: anims.generateFrameNumbers("player", { start: 0, end: 25 }),
      frameRate: 20,
      repeat: -1
    });
    anims.create({
      key: "player-run",
      frames: anims.generateFrameNumbers("player", { start: 26, end: 39 }),
      frameRate: 20,
      repeat: -1
    });
    anims.create({
      key: "player-jump",
      frames: anims.generateFrameNumbers("player", { start: 40, end: 44 }),
      frameRate: 20,
      repeat: -1
    });
    anims.create({
      key: "player-fall",
      frames: anims.generateFrameNumbers("player", { start: 45, end: 46 }),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player-hit",
      frames: anims.generateFrameNumbers("player", { start: 47, end: 54 }),
      frameRate: 20,
      repeat: -1
    });
    anims.create({
      key: "player-dead",
      frames: anims.generateFrameNumbers("player", { start: 55, end: 64 }),
      frameRate: 20
    });

    const { LEFT, RIGHT, UP, A } = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      up: UP,
      a: A
    });
  }

  die(dx, dy) {
    this.body.setAccelerationX(0);
    this.body.velocity.x += dx * 10;
    this.body.velocity.y += dy;
  }

  kill(killerId, dx, dy) {
    this.die(dx, dy);

    if (this.dead) return;

    this.play("player-dead", true);
    this.dead = true;
    this.scene.time.addEvent({
      delay: 5000,
      //delay: 500,
      callback: this.respawn,
      callbackScope: this,
      loop: false
    });
    this.scene.socket.emit("playerDead", this.playerId, killerId, dx, dy);
  }

  respawn() {
    const spawnPoint = this.scene.spawnPoints[
      Math.floor(Math.random() * (this.scene.spawnPoints.length - 1))
    ];
    this.x = spawnPoint.x;
    this.y = spawnPoint.y - 10;
    this.dead = false;
  }

  update(delta) {
    const { keys } = this;
    let direction = 0;
    direction |= keys.left.isDown ? Input.LEFT : 0;
    direction |= keys.right.isDown ? Input.RIGHT : 0;
    direction |= keys.up.isDown ? Input.UP : 0;
    direction |= keys.a.isDown ? Input.A : 0;

    this.updatePlayer(delta, direction);
  }

  updatePlayer(delta, direction) {
    if (this.dead) return;

    const { body } = this;
    const onGround = body.blocked.down;
    const acceleration = onGround ? 600 : 200;

    if (direction & Input.LEFT) {
      this.body.setAccelerationX(-acceleration);
      this.setFlipX(true);
    } else if (direction & Input.RIGHT) {
      this.body.setAccelerationX(acceleration);
      this.setFlipX(false);
    } else {
      this.body.setAccelerationX(0);
    }

    if (direction & Input.A) {
      if (this.fireTimer > 1000) {
        const centeredX = this.body.x + this.width / 2;
        new Bomb(this.scene, centeredX, this.body.y, this.playerId);
        this.scene.socket.emit("playerShoot", centeredX, this.body.y);
        this.fireTimer = 0;
      }
      this.fireTimer = 0;
    }

    if (direction & Input.UP) {
      if ((onGround || this.jumping === 1) && this.jumpTimer > 300) {
        this.body.setVelocityY(-700);
        this.jumping += 1;
        this.jumpTimer = 0;
      }
    }

    if (onGround) {
      if (!this.oldGround) {
        this.jumping = 0;
        this.jumpTimer = 0;
      }
      if (this.body.velocity.x !== 0) {
        this.play("player-run", true);
      } else {
        this.play("player-idle", true);
      }
    } else {
      if (this.body.velocity.y < 0) {
        this.play("player-jump", true);
      } else {
        this.play("player-fall", true);
      }
    }
    this.oldGround = onGround;
    this.fireTimer += delta;
    this.jumpTimer += delta;
  }
}
