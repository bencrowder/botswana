var Destroyer = function() {};

Destroyer.prototype = new Bot("Destroyer");

Destroyer.prototype.setup = function() {
	this.clicks = 0;			// keep track of how many clicks
	this.opponent = -1;
	this.speed = 2;
	this.safety = 7;
};

Destroyer.prototype.getDirection = function() {
	// simplified path finding algorithm using potential fields.
	// returns a target angle for the bot to point.
	var opponent = this.state.bots[this.opponent];
	var targetAngle = this.angle;
	var dist = distanceToPoint(this.x, this.y, opponent.x, opponent.y);
	var angle = normalizeAngle(angleToPoint(this.x, this.y, opponent.x, opponent.y));
	var strength = 5;
	var dx = 0;
	var dy = 0;

	// attractive potential field to opponent
	if (this.radius <= dist && dist <= this.safety * this.radius) {
		dx = strength * (dist - this.radius) * Math.cos(angle);
		dy = strength * (dist - this.radius) * Math.sin(angle);
	} else if (dist > this.safety * this.radius) {
		dx = strength * this.safety * Math.cos(angle);
		dy = strength * this.safety * Math.sin(angle);
	}

	// repulsive potential field from obstacles
	var repelStrength = 2;
	obstacles = server.getObstacles();
	for (i in obstacles) {
		var obs = obstacles[i];
		obsX = obs.x + (obs.width / 2);
		obsY = obs.y + (obs.height / 2);
		obsR = distanceToPoint(obsX, obsY, obs.x, obs.y);
		var dist = distanceToPoint(this.x, this.y, obsX, obsY);
		var angle = normalizeAngle(angleToPoint(this.x, this.y, obsX, obsY));
		if (dist < obsR) {
			dx += (-1.0 * Math.cos(angle)) * 100000000;
			dy += (-1.0 * Math.sin(angle)) * 100000000;
		} else if (obsR <= dist && dist <= (3 * this.radius) + obsR) {
			dx += -1.0 * repelStrength * (3 * this.radius + obsR - dist) * Math.cos(angle);
			dy += -1.0 * repelStrength * (3 * this.radius + obsR - dist) * Math.sin(angle);
		}
	}

	// was there a change in my location
	if (dx != 0 || dy != 0) {
		targetAngle = normalizeAngle(angleToPoint(this.x, this.y, this.x + dx, this.y + dy));
	}
	return targetAngle;
};

Destroyer.prototype.run = function() {
	this.clicks++;
	var action = 'wait';
	// get the opponent's information
	if (this.opponent == -1) {
		for (i in this.state.bots) {
			var bot = this.state.bots[i];
			if (bot.id != this.id) {
				this.opponent = i;
			}
		}
	}

	// to I have a target opponent selected
	if (this.opponent >= 0) {
		var target = this.state.bots[this.opponent];
		var target_angle = this.getDirection();
		var dir = this.angle - target_angle;
		var dist = distanceToPoint(this.x, this.y, target.x, target.y);

		// if I am hurt bad and my health is less than my opponents, retreat
		if (this.health < 50 && this.health < this.state.bots[this.opponent].health) {
			if (this.canShoot) {
				action = 'fire';
			} else if (this.clicks % 5 == 0) {
				action = 'left';
			} else {
				action = 'backward';
			}
		} else {
			if (dir > 0.05) {
				action = 'right';
			} else if (dir < -0.05) {
				action = 'left';
			} else {
				if (this.canShoot) {
					action = 'fire';
				} else {
					action = 'forward';
				}
			}
		}
	}
	return {'command': action, 'payload': {}}
};

var destroyer = new Destroyer();
destroyer.className = "Destroyer";

server.registerBotScript(destroyer);
