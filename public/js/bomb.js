import BombExplosion from './bombexplosion.js'

export default class Bomb extends Phaser.Physics.Arcade.Sprite {

  constructor (scene, x, y)
  {
      super(scene, x, y, 'bomb');
      this.scene = scene;

      const anims = scene.anims;
      anims.create({
        key: "bomb-idle",
        frames: anims.generateFrameNumbers("bomb", { start: 0, end: 10 }),
        frameRate: 20,
        repeat: -1
      });
      this.play('bomb-idle');

      scene.add.existing(this);
      scene.physics.add.existing(this);
      scene.physics.add.collider(this, scene.foreground);
      
      scene.time.addEvent({
        delay: 1000,
        callback: this.explode,
        callbackScope: this,
        loop: false
      });

      this.setCircle(15, 0, 20);
  }

  explode(){
    new BombExplosion(this.scene, this.x, this.y);
    this.destroy();
  }
}