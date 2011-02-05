function Bot(botname) {
	this.name = botname;

	this.x;
	this.y;
	this.angle;
	this.health;
	this.bullets;
	this.canShoot;

	this.state = { world: {}, bots: {}, bullets: {} };
};
