export default class BombExplosion extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y, id) {
    super(scene, x, y, 'bomb-explosion');
    this.playerId = id;

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

    this.overlap = scene.physics.add.overlap(scene.bots, this, this.boom, null, this);
  }

  boom(player, bomb) {
    let angle = Math.atan2(player.y - bomb.y, player.x - bomb.x);
    let force = (100 - Phaser.Math.Distance.Between(player.x, player.y, bomb.x, bomb.y)) * 100;
    const dx = Math.cos(angle) * force;
    const dy = Math.sin(angle) * force;
    player.kill(bomb.playerId, dx, dy);
    this.overlap.active = false;
  }
}