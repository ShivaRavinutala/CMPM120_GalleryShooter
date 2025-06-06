// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 768,
    height: 768,
    scene: [MainMenu, MainGame, Win, Lose],
    fps: { forceSetTimeOut: true, target: 30 }
}

const game = new Phaser.Game(config);