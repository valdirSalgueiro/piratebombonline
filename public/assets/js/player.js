import Bomb from './bomb.js'

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, enemy = false) {
    super(scene, x, y, 'player');

    scene.add.existing(this);

    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.foreground);
    this.body.setDrag(1000, 0)
      .setMaxVelocity(300, 1000);

    if (enemy)
      return;

    this.scene = scene;
    this.jumping = 0;
    this.oldGround = 0;
    this.fireTimer = 9999;

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
      a: A,
    });
  }

  die(dx, dy) {
    this.body.setAccelerationX(0);
    this.body.velocity.x += dx * 10;
    this.body.velocity.y += dy;
  }

  kill(killerId, dx, dy) {
    this.die(dx, dy);

    if (this.scene.isPlayerDead)
      return;

    this.play("player-dead", true);
    this.scene.isPlayerDead = true;
    this.scene.time.addEvent({
      delay: 5000,
      //delay: 500,
      callback: this.respawn,
      callbackScope: this,
      loop: false
    });
    this.scene.socket.emit('playerDead', killerId, dx, dy);
  }

  respawn() {
    const spawnPoint = this.scene.spawnPoints[Math.floor(Math.random() * (this.scene.spawnPoints.length - 1))];
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.scene.isPlayerDead = false;
  }

  shoot() {
    new Bomb(this.scene, this.body.x, this.body.y, this.playerId);
    this.scene.socket.emit('playerShoot', this.body.x, this.body.y);
  }

  update(delta) {
    const { keys, body } = this;
    const onGround = body.blocked.down;
    const acceleration = onGround ? 600 : 200;

    if (keys.left.isDown) {
      this.body.setAccelerationX(-acceleration);
      this.setFlipX(true);
    } else if (keys.right.isDown) {
      this.body.setAccelerationX(acceleration);
      this.setFlipX(false);
    } else {
      this.body.setAccelerationX(0);
    }

    if (this.fireTimer > 1000 && keys.a.isDown) {
      this.shoot();
      this.fireTimer = 0;
    }

    if ((onGround || (this.jumping === 1)) && (this.scene.input.keyboard.checkDown(keys.up, 500))) {
      this.body.setVelocityY(-700);
      this.jumping += 1;
    }

    if (onGround) {
      if (!this.oldGround)
        this.jumping = 0;
      if (this.body.velocity.x !== 0) {
        this.play("player-run", true);
      }
      else {
        this.play("player-idle", true);
      }
    } else {
      if (this.body.velocity.y < 0) {
        this.play("player-jump", true);
      }
      else {
        this.play("player-fall", true);
      }
    }
    this.oldGround = onGround;
    this.fireTimer += delta;
  }
}
