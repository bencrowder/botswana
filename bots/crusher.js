var CrusherBot = function() {};

CrusherBot.prototype = new Bot("Crusher");

CrusherBot.prototype.setup = function() {
	this.timer = 0;			// keep track of how many clicks
};

CrusherBot.prototype.run = function() {
	// get the opponent's information
	for (i in bots) {
		var bot = bots[i];
		if (bot.name != this.name) {
			ox = bot.x;
			oy = bot.y;
			opponent_angle = bot.angle;
		}
	}

	this.timer++;

	if (this.timer % 10 == 0) {
		target_angle = normalizeAngle(angleToPoint(this.x, this.y, ox, oy));

		if (this.angle > target_angle) {
			return "right";
		} else {
			return "left";
		}
	} else {
		return "forward";
	}
};

var crusherbot = new CrusherBot();

registerBot(crusherbot);
