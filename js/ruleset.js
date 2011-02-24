/* Botswana */
/* by Ben Crowder and Chad Hansen */

function Ruleset(properties) {
	this.NUM_PLAYERS = properties.numPlayers;
	this.NUM_BOTS = properties.numBots;
	this.WORLD_WIDTH = properties.world.width;
	this.WORLD_HEIGHT = properties.world.height;

	this.BOT_ANGLE_STEP = properties.bots.angleStep;
	this.BOT_SPEED = properties.bots.speed;
	this.BOT_RADIUS = properties.bots.radius;

	this.BULLET_SPEED = properties.bullets.speed;
	this.BULLET_STRENGTH = properties.bullets.strength;
	this.BULLET_WAIT = properties.bullets.waitTime;
	this.BULLET_NUM_ALLOWED = properties.bullets.numAllowed;

	this.MINE_STRENGTH = properties.mines.stength;
	this.MINE_WAIT = properties.mines.waitTime;
	this.MINE_NUM_ALLOWED = properties.mines.numAllowed;
};

Ruleset.prototype.get = function(prop) {
	return eval('this.' + prop);
};
