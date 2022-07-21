import Phaser from 'phaser'

const level = [
	[4, 2, 6, 3],
	[7, 0, 1, 5],
	[3, 1, 4, 6],
	[0, 5, 7, 2]
]

export default class MemoryGameScene extends Phaser.Scene
{
	constructor() {
			super('memory-game-scene')
	}

    init() {
        this.halfHeight = this.scale.height/2
        this.halfWidth = this.scale.width/2       
        this.boxGroup = undefined
        this.player = undefined
		this.cursors = this.input.keyboard.createCursorKeys()
        this.activeBox = undefined
        this.itemsGroup = undefined
        this.selectedBoxes = []
        this.matchesCount = 0
        this.countdownTimer = 30
		this.timerLabel = undefined
		this.timedEvent = undefined
    }

	preload() {
        this.load.image('bg', 'images/bg.png')
        this.load.spritesheet('tilesheet','images/sokoban_tilesheet.png', {
            frameWidth: 64
        })

		this.load.spritesheet('player','https://i.ibb.co/QNkxQmK/player.png', {
            frameWidth: 96, frameHeight:128
        })
        
		this.load.image('picture1', 'https://i.ibb.co/X7fZVBY/picture1.png')
	    this.load.image('picture2', 'https://i.ibb.co/xCmS9N9/picture2.png')
	    this.load.image('picture3', 'https://i.ibb.co/mGfnKnZ/picture3.png')
	    this.load.image('picture4', 'https://i.ibb.co/Wnr6cZn/picture4.png')
	    this.load.image('picture5', 'https://i.ibb.co/1Lrs5Wz/picture5.png')
	    this.load.image('picture6', 'https://i.ibb.co/Kb6sK0B/picture6.png')
	    this.load.image('picture7', 'https://i.ibb.co/GQmwwxN/picture7.png')
	    this.load.image('bom', 'https://i.ibb.co/ZT1G5Bp/bom.png')
				
    }

    create() {
       // this.add.image(this.halfWidth, 150, 'bg').setScale(3)
        this.boxGroup = this.physics.add.staticGroup()
        this.createBoxes()
        this.player = this.createPlayer()

        this.physics.add.collider(this.player, this.boxGroup, this.handlePlayerBoxCollide, undefined, this)
        this.itemsGroup = this.add.group()

        this.timerLabel = this.add.text(this.halfWidth, 16, null)
		
        this.timedEvent = this.time.addEvent({
            delay: 1000,
            callback: this.gameOver,
            callbackScope: this,
            loop: true
        })
    }

    update() {
        this.movePlayer(this.player)

        this.children.each(c => {
			// @ts-ignore
			const child = c

			if (child.getData('sorted'))
			{
				return
			}

			child.setDepth(child.y)
		})

        this.updateActiveBox()

        this.timerLabel.setStyle({
			fontSize: 60,
			fill : '#ffffff',
			fontStyle: 'bold',
			align : 'center'		
		}).setText(this.countdownTimer)

    }

    createBoxes()
	{
		const width = this.scale.width
		let xPer = 0.20
		let y = 150
		for (let row = 0; row < 4; ++row)
		{
			for (let col = 0; col < 4; ++col)
			{
				this.boxGroup.get(width * xPer, y, 'tilesheet', 6)
                    .setSize(64, 32)
					.setOffset(0, 32)
                    .setData('itemType', level[row][col])

				xPer += 0.20
			}

			xPer = 0.20
			y += 150
		}
	}

    createPlayer()
	{
		const player = this.physics.add.sprite(this.halfWidth, this.halfHeight + 30, 'tilesheet')
			.setSize(40, 16)
			.setOffset(12, 38)
		player.setCollideWorldBounds(true)

		this.anims.create({
			key: 'standby',
			frames: [{ key: 'player', frame: 3 }]
		})

		this.anims.create({
			key: 'down',
			frames: this.anims.generateFrameNumbers('player', { start: 44, end: 44 }),
			frameRate: 10,
			repeat: -1
		})

		this.anims.create({
			key: 'up',
			frames: this.anims.generateFrameNumbers('player', { start: 5, end: 6 }),
			frameRate: 10,
			repeat: -1
		})

		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers('player', { start: 10, end: 10 }),
			frameRate: 10,
			repeat: -1
		})

		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers('player', { start: 24, end: 26 }),
			frameRate: 10,
			repeat: -1
		})

		return player		
	}

    movePlayer(player)
	{
        if (!this.player.active)
		{
			return
		}

		const speed = 200

		if (this.cursors.left.isDown)
		{
			this.player.setVelocity(-speed, 0)
			this.player.anims.play('left', true)
		}
		else if (this.cursors.right.isDown)
		{
			this.player.setVelocity(speed, 0)
			this.player.anims.play('right', true)
		}
		else if (this.cursors.up.isDown)
		{
			this.player.setVelocity(0, -speed)
			this.player.anims.play('up', true)
		}
		else if (this.cursors.down.isDown)
		{
			this.player.setVelocity(0, speed)
			this.player.anims.play('down', true)
		}
		else
		{
			this.player.setVelocity(0, 0)
			this.player.anims.play('standby')	
		}

        const spaceJustPressed = Phaser.Input.Keyboard.JustUp(this.cursors.space)
		if (spaceJustPressed && this.activeBox)
		{
			this.openBox(this.activeBox)

			this.activeBox.setFrame(7)
			this.activeBox = undefined
		}
	}

    handlePlayerBoxCollide(player, box)
	{		
        const opened = box.getData('opened')
		
		if (opened)
		{
			return
		}

		if (this.activeBox)
		{
			return
		}

		this.activeBox = box
		this.activeBox.setFrame(9)

        
	}

    updateActiveBox()
	{
		if (!this.activeBox)
		{
			return
		}

		const distance = Phaser.Math.Distance.Between(
			this.player.x, this.player.y,
			this.activeBox.x, this.activeBox.y
		)

		if (distance < 64)
		{
			return
		}

		this.activeBox.setFrame(7)
		this.activeBox = undefined
	}

    openBox(box)
	{
		if(!box)
		{
			return
		}

		const itemType = box.getData('itemType')
		
		/** @type {Phaser.GameObjects.Sprite} */
		let item

		switch (itemType)
		{
			case 0:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('bom')
				break

			case 1:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture1')
				break

			case 2:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture2')
				break

			case 3:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture3')
				break

			case 4:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture4')
				break

			case 5:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture5')
				break	
			
			case 6:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture6')
				break	

			case 7:
				item = this.itemsGroup.get(box.x, box.y)
				item.setTexture('picture7')
				break	
		}

		if (!item)
		{
			return
		}

		box.setData('opened', true)		

        item.setData('sorted', true)
		item.setDepth(2000)

		item.setActive(true)
		item.setVisible(true)

		item.scale = 0
		item.alpha = 0

        this.selectedBoxes.push({ box, item })

		this.tweens.add({
			targets: item,
			y: '-=50',
			alpha: 1,
			scale: 1,
			duration: 500,		
            onComplete: () => {
				if (itemType === 0)
				{
					this.handleBearSelected()
					return
				}

				if (this.selectedBoxes.length < 2)
				{
					return
				}

				this.checkForMatch()
			}	
		})
	}

    handleBearSelected()
	{
		const { box, item } = this.selectedBoxes.pop()

		item.setTint(0xff0000)
		box.setFrame(20)

		this.player.active = false
		this.player.setVelocity(0, 0)

		this.time.delayedCall(1000, () => {
			item.setTint(0xffffff)
			box.setFrame(7)
			box.setData('opened', false)

			this.tweens.add({
				targets: item,
				y: '+=50',
				alpha: 0,
				scale: 0,
				duration: 300,
				onComplete: () => {
					this.player.active = true
				}
			})
		})
	
	}

    checkForMatch()
	{
		const second = this.selectedBoxes.pop()
		const first = this.selectedBoxes.pop()

		if (first.item.texture !== second.item.texture)
		{
			this.tweens.add({
				targets: [first.item, second.item],
				y: '+=50',
				alpha: 0,
				scale: 0,
				duration: 300,
				delay: 1000,
				onComplete: () => {
					this.itemsGroup.killAndHide(first.item)
					this.itemsGroup.killAndHide(second.item)

					first.box.setData('opened', false)
					second.box.setData('opened', false)
				},
			})
			
			return
		}

        ++this.matchesCount
		console.log(this.matchesCount)

        this.time.delayedCall(1000, () => {
			first.box.setFrame(8)
			second.box.setFrame(8)

            if (this.matchesCount >= 2)
			{ 
				this.player.active = false
				this.player.setVelocity(0, 0)

                this.add.text(this.halfWidth, 40 , 'You Win!', {
					fontSize: 60,
					fill : '#ffffff',
					fontStyle: 'bold',
					align : 'center'		
				}).setOrigin(0.5)
			

				this.countdownTimer = undefined
            }
        })
	}	

    gameOver()
    {
        this.countdownTimer -= 1
        if (this.countdownTimer == 0) {
			
			// this.scene.start('game-over-scene')
			this.add.text(this.halfWidth, 40, 'You Lose!', {
				fontSize: 60,
				fill : '#ffffff',
				fontStyle: 'bold',
				align : 'center'		
			}).setOrigin(0.5)
			this.countdownTimer = undefined
			this.player.active = false
			this.player.setVelocity(0, 0)
        }
    }
}
