/* Botswana */
/* by Ben Crowder and Chad Hansen */

function Bot(botname) {
	this.name = botname;

	this.id;
	this.x;
	this.y;
	this.color;
	this.angle;				// in radians
	this.health;			// 0-100
	this.weapons = {};		// object with number of available ammo
	this.canShoot;			// boolean
	this.waitFire;			// clicks to wait before firing
	this.collided = false	// boolean
	this.hitByBullet;		// boolean
	this.radius;			// size of bot

	this.state = { world: {}, bots: [], weapons: [], items: [], obstacles: [] };

	this.copy = function(aBot) {
		this.id = aBot.id;
		this.x = aBot.x;
		this.y = aBot.y;
		this.color = aBot.color;
		this.angle = aBot.angle;	
		this.health = aBot.health;
		this.weapons = aBot.weapons;
		this.canShoot = aBot.canShoot;
		this.waitFire = aBot.waitFire;
		this.collided = aBot.collided;
		this.hitByBullet = aBot.hitByBullet;
		this.radius = aBot.radius;
		this.state = aBot.state;
	}
};
