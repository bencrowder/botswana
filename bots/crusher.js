var CrusherBot = function() {};
CrusherBot.prototype = new Bot("Crusher");
CrusherBot.prototype.setup = function() {
	this.timer = 0;			// keep track of how many clicks
};
CrusherBot.prototype.run = function() {
	this.timer++;
	target = undefined;
	// get the opponent's information
	for (i in this.state.bots) {
		var bot = this.state.bots[i];
		if (bot.id != this.id) {
			target = bot;
		}
	}
	if (this.hitByBullet) {
		if (this.timer % 5 == 0) {
			return "left";
		} else {
			return "backward";
		}
	}

	if (target != undefined) {
		target_angle = normalizeAngle(angleToPoint(this.x, this.y, target.x, target.y));
		dir = this.angle - target_angle;
		dist = distanceToPoint(this.x, this.y, target.x, target.y);

		if (dir > 0.05) {
			return "right";
		} else if (dir < -0.05) {
			return "left";
		} else {
			if (this.timer % 15 == 0 && dist < 7 * this.radius) {
				return "fire";
			} else if (this.timer % 15 == 0) {
				return "fire";
			} else if (dist < 7 * this.radius) {
				return "wait";
			} else {	
				return "forward";
			}
		}
	} else {
		return "wait";
	}
};

var crusherbot = new CrusherBot();
server.registerBot(crusherbot);
