import Bomb from './bomb.js'

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    this.scene = scene;
    this.jumping = 0;
    this.oldGround = 0;

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
      frames: anims.generateFrameNumbers("player", { start: 50, end: 57 }),
      frameRate: 20,
      repeat: -1
    });
    anims.create({
      key: "player-dead",
      frames: anims.generateFrameNumbers("player", { start: 58, end: 67 }),
      frameRate: 20,
      repeat: -1
    });

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.foreground);    

    this.setDrag(1000, 0)
      .setMaxVelocity(300, 1000);

    const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      up: UP,
      a: A,
    });
  }

  freeze() {
    this.body.moves = false;
  }

  update() {
    const { keys, body } = this;
    const onGround = body.blocked.down;
    const acceleration = onGround ? 600 : 200;

    if (keys.left.isDown) {
      this.setAccelerationX(-acceleration);
      this.setFlipX(true);
    } else if (keys.right.isDown) {
      this.setAccelerationX(acceleration);
      this.setFlipX(false);
    } else {
      this.setAccelerationX(0);
    }

    if (Phaser.Input.Keyboard.JustDown(keys.a, 500)) {
      new Bomb(this.scene, this.body.x, this.body.y);
    }

    if ((onGround || (this.jumping === 1)) && (Phaser.Input.Keyboard.JustDown(keys.up, 500))) {
      this.setVelocityY(-700);
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
  }

  destroy() {
    this.this.destroy();
  }
}
