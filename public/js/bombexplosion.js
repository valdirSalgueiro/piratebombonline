export default class BombExplosion extends Phaser.Physics.Arcade.Sprite {

  constructor (scene, x, y)
  {
      super(scene, x, y, 'bomb-explosion');

      const anims = scene.anims;
      anims.create({
        key: "bomb-explosion",
        frames: anims.generateFrameNumbers("bomb-explosion", { start: 0, end: 9 }),
        frameRate: 20
      });
      
      scene.add.existing(this);    
      scene.physics.add.existing(this, true);  
      
      this.once('animationcomplete', () => {
        this.destroy();
      });
      this.play('bomb-explosion');

      this.overlap = scene.physics.add.overlap(scene.players, this, this.boom, null, this);
  }

  boom(player, bomb) {
      this.overlap.active = false;
  }
}