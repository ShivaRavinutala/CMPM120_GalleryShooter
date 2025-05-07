
class MainGame extends Phaser.Scene {
    curve;

    constructor() {
        super("mainGame");
        this.my = { sprite: {} };
        this.items = []; // Active emitted sprites
        this.frameTime = 0;
        this.caveCount = this.randomCaveCount();;
        this.caveArray = [];
        this.difficulty = (Math.trunc(((1 + (this.caveCount)/15)) * 100))/100;
        this.enemyWavesArray = [];
        this.currentCave = 0;
        this.activeEnemies = [];
        this.currentRow = 0;
        this.health = [1, 1, 1, 1];
        this.healthIndex = 3;
        this.bulletCooldown = 15;
        this.bulletCooldownCounter = 0;
        this.healthSprite = []
        this.scoreText;
        this.score = 0;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("colored_tiles", "colored_packed.png");
        //this.load.image("colored_tiles_transparent", "colored-transparent_packed.png");
        this.load.image("arachnid", "arachnid.png");
        this.load.image("skeleton", "skeleton.png");
        this.load.image("ghoul", "ghoul.png");
        this.load.image("slime_monster", "slime_monster.png");
        this.load.image("troll", "troll.png");
        this.load.json('mapSections', 'MapSections.json');
        this.load.audio('soundtrack', 'soundtrack_cmpm120.wav');
        this.load.audio('explosion', 'explosion.wav');
        this.load.audio('hurt', 'hitHurt.wav');

        this.load.image('dynamite', 'dynamite.png');
        this.load.image('bomb', 'bomb.png');
        this.load.image('main_character', 'main_character.png');

        this.load.image('full_heart', 'full_heart.png');
        this.load.image('half_heart', 'half_heart.png');
        this.load.image('empty_heart', 'empty_heart.png');
    }

    create() {
        let my = this.my;
        //my.sprite.body = this.add.sprite(400, 450, "mainCharacter");

        // Key setup
        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // cave generation
        const presets = this.cache.json.get('mapSections');
        console.log(presets);
        const quadrantSize = presets.quadrantSize;
        const tileSize = presets.tileSize;

        const mapWidth = quadrantSize * 2;
        const mapHeight = quadrantSize * 2;

        for (let i = 0; i < this.caveCount; i++) {
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
            layer.visible = false;
            layer.setScale(3.0);
            this.caveArray.push(layer);
        }

        // enemy wave generation
        this.enemyWavesArray = this.generateEnemyWaves(this.difficulty, this.caveCount);

        my.sprite.body = this.add.sprite((48*8), (12*48 + 24), "main_character");
        my.sprite.body.setScale(3.0);
        

        console.log(this.caveArray[this.caveArray.length]);

        this.sound.play('soundtrack', {
            loop: true,
            volume: 0.5
        });

        this.scoreText = this.add.text((48*5 + 24), (15*48), "High Score: " + this.score, {
            fontFamily: 'PixelFont',
            fontSize: '20px',
            color: '#ffffff'
        });
    }

    update(time, delta) {
        let my = this.my;
        let moveSpeed = 5;

        this.bulletCooldownCounter--;
        this.frameTime += delta;

        if (this.activeEnemies.length == 0) {
                this.currentCave++;
                if (this.healthIndex != this.health.length) {
                    for (let i = this.healthIndex; i < this.healthIndex+1; i++) {
                        this.health[i] = 1;
                    }
                }

                this.healthIndex = this.health.length-1;
                if (this.currentCave == (this.caveArray.length)+1) {
                    this.scene.start("winScene");
                }
                this.caveArray[this.currentCave].visible = true;
                console.log("Cave Number: " + (this.currentCave) + "/" + (this.caveArray.length - 1));

                this.caveArray[this.currentCave - 1].visible = false;

                let waves = this.enemyWavesArray[this.currentCave];
                let startY = 264 + (48 * 2);
                let rowSpacing = 48;
                let colSpacing = 48;

                for (let row = 0; row < waves.length; row++) {
                    let wave = waves[row];
                    let y = startY - row * rowSpacing;
                    let rowArray = [];
                
                    for (let col = 0; col < wave.length; col++) {
                        let x = 72 + (48 * 5) + col * colSpacing;
                        let enemyType = "";
                
                        if (wave[col] == 1) {
                            enemyType = "arachnid";
                        } else if (wave[col] == 2) {
                            enemyType = "skeleton";
                        } else if (wave[col] == 3) {
                            enemyType = "ghoul";
                        } else if (wave[col] == 4) {
                            enemyType = "slime_monster";
                        } else if (wave[col] == 5) {
                            enemyType = "troll";
                        }
                
                        // Store only the sprite in activeEnemies
                        let enemySprite = this.add.sprite(x, y, enemyType);
                        enemySprite.setScale(3.0);
                
                        rowArray.push(enemySprite);  // Store only the sprite in the array
                    }
                    this.activeEnemies.push(rowArray);
                }            

                for (let i = this.items.length - 1; i >= 0; i--) {
                    let item = this.items[i];
                    item.destroy();
                    this.items.splice(i, 1);
                }
                this.updateHearts();
        }

        if (this.frameTime > 33.33) {
            this.frameTime = 0;

            // Move character
            if (this.aKey.isDown) {
                my.sprite.body.x -= moveSpeed;
            }

            if (this.dKey.isDown) {
                my.sprite.body.x += moveSpeed;
            }

            // Emit coin on spacebar press
            if (this.bulletCooldownCounter < 0) {
                if (this.spaceKey.isDown) {
                //if (this.bulletCooldownCounter < 0) {
                    let randInt = Math.floor(Math.random() * 2);
                    let item;
                    if (randInt == 0) {
                        item = this.add.sprite(my.sprite.body.x, my.sprite.body.y, "dynamite");
                    } else if (randInt == 1) {
                        item = this.add.sprite(my.sprite.body.x, my.sprite.body.y, "bomb");
                    }
                    
                    item.setScale(3.0);
                    this.items.push(item);
                    this.bulletCooldownCounter = this.bulletCooldown;
                    this.sound.play('explosion', {
                        volume: 0.3
                    });
                }
            }

            // Move emitted coins upward
            for (let i = this.items.length - 1; i >= 0; i--) {
                let item = this.items[i];
                item.y -= 10; // speed of upward travel

                // Remove coin if off-screen
                if (item.y < -item.height) {
                    item.destroy(); // clean up sprite
                    this.items.splice(i, 1); // remove from array
                }
            }

            // Prevent character from leaving screen
            if (my.sprite.body.x > 480-24) {
                my.sprite.body.x = 480-24;
            } else if (my.sprite.body.x < 288+24) {
                my.sprite.body.x = 288+24;
            }

            for (let j = 0; j < this.activeEnemies[this.currentRow].length; j++) {
                let enemy = this.activeEnemies[this.currentRow][j];
                enemy.y += 6;
                if (enemy.y >= 768) {
                    this.activeEnemies[this.currentRow].splice(j, 1);
                    enemy.destroy();
                }
            }
        }

        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (this.activeEnemies[this.currentRow].length != 0) {
                for (let j = 0; j < this.activeEnemies[this.currentRow].length; j++) {
                    let enemy = this.activeEnemies[this.currentRow][j];
                    if (this.collides(enemy, item)) {
                        this.items.splice(i,1);
                        this.activeEnemies[this.currentRow].splice(j,1);
                        enemy.destroy();
                        item.destroy();
                        this.score+=Math.floor((Math.random() * 20) + 10)
                        this.updateScore();
                    }
                }
            }
        }

        if (this.activeEnemies[this.currentRow].length != 0) {
            for (let j = 0; j < this.activeEnemies[this.currentRow].length; j++) {
                let enemy = this.activeEnemies[this.currentRow][j];
                if (this.collides(enemy, my.sprite.body)) {
                    this.activeEnemies[this.currentRow].splice(j,1);
                    enemy.destroy();
                    this.health[this.healthIndex] -= 0.5;
                    console.log(this.health);
                    this.updateHearts();
                    this.sound.play('hurt', {
                        volume: 0.6
                    });
                }
            }
        }

        if (this.health[this.healthIndex] == 0) {
            this.healthIndex--;
        }

        if (this.healthIndex == -1) {
            this.scene.start("loseScene");
        }

        if (this.activeEnemies[this.currentRow].length == 0) {
            this.currentRow++;
        }

        let allCleared = true;
        for (let row of this.activeEnemies) {
            if (row.length > 0) {
                allCleared = false;
                break;
            }
        }

        if (allCleared && this.activeEnemies.length > 0) {
            this.currentRow = 0;
            this.activeEnemies = [];
        }
    }

    randomCaveCount() {
        return Math.floor(Math.random() * (15 - 10 + 1) + 10) + 1;
    }

    pastePreset(mapLayer, preset, startX, startY) {
        for (let y = 0; y < preset.tiles.length; y++) {
            for (let x = 0; x < preset.tiles[y].length; x++) {
                const tileIndex = preset.tiles[y][x];
                mapLayer.putTileAt(tileIndex, startX + x, startY + y);
            }
        }
    }

    generateEnemyWaves(difficulty, caveCount) {
        const caves = [];

        const difficultyMultiplier = (difficulty - 1.66) / (2.0 - 1.66);

        const rampStrength = 1 + (1 - (caveCount - 10) / 5);
        const rampRate = difficultyMultiplier * rampStrength;

        const enemyWeightsByDifficulty = (level) => {
            const maxEnemy = 5;
            const weights = [];
            for (let i = 1; i <= maxEnemy; i++) {
                const weight = Math.max(0, 1 - Math.abs(i - level) / 2);
                weights.push(weight);
            }
            return weights;
        };

        const weightedRandom = (weights) => {
            const sum = weights.reduce((a, b) => a + b, 0);
            const rand = Math.random() * sum;
            let acc = 0;
            for (let i = 0; i < weights.length; i++) {
                acc += weights[i];
                if (rand < acc) return i + 1;
            }
            return weights.length;
        };
    
        
        for (let i = 0; i < caveCount; i++) {
            const caveDifficulty = 1 + i * (rampRate / caveCount) * 4;
            const weights = enemyWeightsByDifficulty(caveDifficulty);
            const waves = [];
    
            for (let w = 0; w < 4; w++) {
                const wave = [];
                const enemiesInWave = Math.floor(Math.random() * 3) + 2;
                for (let e = 0; e < enemiesInWave; e++) {
                    wave.push(weightedRandom(weights));
                }
                waves.push(wave);
            }
    
            caves.push(waves);
        }
    
        return caves;
    }

    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateHearts() {
        let healthX = (48*5 + 24);
        let healthY = (14*48);
        for (let i = 0; i < this.health.length; i++) {
            healthX+=48;
            let heartType = "";
            if (this.health[i] == 0) {
                heartType = "empty_heart";
            } else if (this.health[i] == 0.5) {
                heartType = "half_heart";
            } else if (this.health[i] == 1) {
                heartType = "full_heart";
            }
            let heart = this.add.sprite(healthX, healthY, heartType);
            heart.setScale(3.0);
            if (this.healthSprite[i]) {
                this.healthSprite[i].destroy();
            }

            this.healthSprite[i] = heart;
        }
    }

    updateScore() {
        this.scoreText.destroy();
        this.scoreText = this.add.text((48*5 + 24), (15*48), "High Score: " + this.score, {
            fontFamily: 'PixelFont',
            fontSize: '20px',
            color: '#ffffff'
        });
    }
    
}
