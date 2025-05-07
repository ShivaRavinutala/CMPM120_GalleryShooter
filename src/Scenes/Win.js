class Win extends Phaser.Scene {
    constructor() {
        super("winScene");
        this.frameCount = 0;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("colored_tiles", "colored_packed.png");
        this.load.json('mapSections', 'MapSections.json');
    }

    create() {
        const presets = this.cache.json.get('mapSections');
        console.log(presets);
        const quadrantSize = presets.quadrantSize;
        const tileSize = presets.tileSize;

        const mapWidth = quadrantSize * 2;
        const mapHeight = quadrantSize * 2;

        let map = this.make.tilemap({
            width: mapWidth,
            height: mapHeight,
            tileWidth: tileSize,
            tileHeight: tileSize
            });
        let tileset = map.addTilesetImage('colored_tiles', null, tileSize, tileSize);
        let layer = map.createBlankLayer('WorldLayer', tileset);

        let tl = Phaser.Utils.Array.GetRandom(presets.presets.topLeft);
        let tr = Phaser.Utils.Array.GetRandom(presets.presets.topRight);
        let bl = Phaser.Utils.Array.GetRandom(presets.presets.bottomLeft);
        let br = Phaser.Utils.Array.GetRandom(presets.presets.bottomRight);

        this.pastePreset(layer, tl, 0, 0);
        this.pastePreset(layer, tr, quadrantSize, 0);
        this.pastePreset(layer, bl, 0, quadrantSize);
        this.pastePreset(layer, br, quadrantSize, quadrantSize);
        layer.visible = true;
        layer.setScale(3.0);
        layer.setAlpha(0.5)

        this.title = this.add.text(160, 160, "You Won", {
            fontFamily: 'PixelFont',
            fontSize: '48px',
            color: '#ffffff'
        });

        this.pressStart = this.add.text(30, 400, "Press Space to Go to Main Menu", {
            fontFamily: 'PixelFont',
            fontSize: '30px',
            color: '#ffffff'
        });

        this.nextScene = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        this.frameCount++;

        if (this.frameCount % 40 >= 30) {
            this.pressStart.visible = false;
        } else {
            this.pressStart.visible = true;
        }

        if (Phaser.Input.Keyboard.JustDown(this.nextScene)) {
            this.scene.start("mainMenu");
        }
    }

    pastePreset(mapLayer, preset, startX, startY) {
        for (let y = 0; y < preset.tiles.length; y++) {
            for (let x = 0; x < preset.tiles[y].length; x++) {
                const tileIndex = preset.tiles[y][x];
                mapLayer.putTileAt(tileIndex, startX + x, startY + y);
            }
        }
    }
}