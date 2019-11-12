export default class Player {
  constructor(scene, x, y) {
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

    this.sprite = scene.physics.add
      .sprite(x, y, "player", 0)
      .setDrag(1000, 0)
      .setMaxVelocity(300, 1000)
      .setSize(58, 48)
      .setOffset(0, 9);

    const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      up: UP,
      w: W,
      a: A,
      d: D
    });
  }

  freeze() {
    this.sprite.body.moves = false;
  }

  update() {
    const { keys, sprite } = this;
    const onGround = sprite.body.blocked.down;
    const acceleration = onGround ? 600 : 200;

    if (keys.left.isDown || keys.a.isDown) {
      sprite.setAccelerationX(-acceleration);
      sprite.setFlipX(true);
    } else if (keys.right.isDown || keys.d.isDown) {
      sprite.setAccelerationX(acceleration);
      sprite.setFlipX(false);
    } else {
      sprite.setAccelerationX(0);
    }

    if ((onGround || (this.jumping === 1)) && (Phaser.Input.Keyboard.JustDown(keys.up, 500) || this.scene.input.keyboard.checkDown(keys.w, 500))) {
      sprite.setVelocityY(-700);
      this.jumping += 1;
    }

    if (onGround) {
      if (!this.oldGround)
        this.jumping = 0;
      if (sprite.body.velocity.x !== 0) {
        sprite.anims.play("player-run", true);
      }
      else {
        sprite.anims.play("player-idle", true);

      }
    } else {
      if (sprite.body.velocity.y < 0) {
        sprite.anims.play("player-jump", true);
      }
      else {
        sprite.anims.play("player-fall", true);
      }
    }
    this.oldGround = onGround;
  }

  destroy() {
    this.sprite.destroy();
  }
}
