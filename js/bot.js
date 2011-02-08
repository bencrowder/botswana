/* Botswana */
/* by Ben Crowder and Chad Hansen */

function Bot(botname) {
	this.name = botname;

	this.x;
	this.y;
	this.angle;				// in radians
	this.health;			// 0-100
	this.bullets;			// number of available bullets
	this.canShoot;			// boolean
	this.collided;			// boolean
	this.hitByBullet;		// boolean
	this.radius;			// size of bot

	this.state = { world: {}, bots: {}, bullets: {} };
};
