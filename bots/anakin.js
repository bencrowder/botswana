var Ani = function() {};

Ani.prototype = new Bot();

Ani.prototype.setup = function() {
	this.timer = 0;
	this.movements = ['strafe-right', 'strafe-left', 'forward', 'backward'];
	this.formation = this.id % 2;
};

Ani.prototype.getBotById = function(id) {
	for (i in this.state.bots) {
		if (this.state.bots[i].id == id) return this.state.bots[i];
	}
	return undefined;
};

Ani.prototype.getOpponentBots = function() {
	op = [];
	for (i in this.state.bots) {
		if (this.name != this.state.bots[i].name) {
			op.push(this.state.bots[i]);
		}
	}
	return op;
};

Ani.prototype.getTeamBots = function() {
	team = [];
	for (i in this.state.bots) {
		if (this.name == this.state.bots[i].name) {
			team.push(this.state.bots[i]);
		}
	}
	return team;
};

Ani.prototype.avoidCircle = function(radius, x, y, repelStrength) {
	radius -= 5;
	var dist = this.myDistanceToPoint(x, y);
	var angle = server.helpers.normalizeAngle(server.helpers.angleToPoint(this.x, this.y, x, y));
	angle += (Math.PI / 2);
	var dx = 0;
	var dy = 0;

	if (dist <= radius) {
		dx = (-1.0 * Math.cos(angle)) * 100000000;
		dy = (-1.0 * Math.sin(angle)) * 100000000;
	} else if (dist > radius && dist <= (2 * this.radius) + radius) {
		dx = -1.0 * repelStrength * (2 * this.radius + radius - dist) * Math.cos(angle);
		dy = -1.0 * repelStrength * (2 * this.radius + radius - dist) * Math.sin(angle);
	}

	return [dx, dy];
};

Ani.prototype.acquireTarget = function() {
	if (typeof this.state.payload.targets == 'undefined') {
		this.state.payload.targets = {}
	}
	target = this.getBotById(this.state.payload.targets[this.id]);
	if (target == undefined) {
		opp = this.getOpponentBots();
		closeness = 10000;
		for (i in opp) {
			dist = this.myDistanceToPoint(opp[i].x, opp[i].y);
			if (dist < closeness) {
				target = opp[i];
				closeness = dist;
			}
		}
	}
	this.state.payload.targets[this.id] = target.id;
	return target;
};

Ani.prototype.avoidBullets = function() {
	var dx = 0;
	var dy = 0;
	for (i in this.state.weapons) {
		var bullet = this.state.weapons[i];
		if (bullet.owner != this.id && this.myDistanceToPoint(bullet.x, bullet.y) < 50) {
			deltas = this.avoidCircle(10, bullet.x, bullet.y, 25);
			dx += deltas[0];
			dy += deltas[1];
		}
	}
	return [dx, dy];
};

Ani.prototype.avoidTeammates = function() {
	var dx = 0;
	var dy = 0;
	var team = this.getTeamBots();
	for (i in team) {
		var bot = team[i];
		dist = this.myDistanceToPoint(bot.x, bot.y);
		if (bot.id != this.id && dist < 20 + bot.radius + this.radius) {
			deltas = this.avoidCircle(bot.radius, bot.x, bot.y, 5);
			dx += deltas[0];
			dy += deltas[1];
		}
	}
	return [dx, dy];
};

Ani.prototype.run = function() {
	this.timer++;
	target = undefined;

	var rtnCommand = 'wait';
	// get the opponent's information
	target = this.acquireTarget();

	// have I collided with a bot?
	this.collided = false;
	if (this.collisions.length > 0) {
		for (i in this.collisions) {
			if (this.collisions[i].type != 'bot')
				this.collided = true;
		}
	}

	var avoidBullets = this.avoidBullets();
	var avoidMates = this.avoidTeammates();
	var avoid = [avoidBullets[0] + avoidMates[0], avoidBullets[1] + avoidMates[1]]
	var avoidDir = this.getDirection({'x': avoid[0], 'y': avoid[1]}, 0.1);

	// if I need to avoid bullets or teammates, strafe-left or right
	if (avoid[0] != 0 && avoid[1] != 0 && avoidDir.command != 'forward' && avoidDir.command != 'wait') {
		var behindMe = this.angle - Math.PI;
		if (avoidDir.command == 'right')
			rtnCommand = 'strafe-right';
		else
			rtnCommand = 'strafe-left';
	}

	// if I'm a formation 1 bot, backup and fire
	if (this.formation == 1) {
		dir = this.getDirection(target, 0.05);
		dist = this.myDistanceToPoint(target.x, target.y);

		if (dir.command != 'forward') {
			rtnCommand = dir.command;
		} else if (this.canShoot && this.weapons.bullet > 0) {
			rtnCommand = "fire";
		} else if (rtnCommand == 'wait' && !this.collided) {
			rtnCommand = 'backward';
		} else if (this.collided) {
			rtnCommand = 'forward';
		}

		// random movement every 10 ticks
		if (this.timer % 10 == 0)
			rtnCommand = this.movements[Math.floor(Math.random() * this.movements.length)];
		return {'command': rtnCommand, 'team': this.state.payload};
	}

	// if my health is less than 25, become a formation 1 bot
	if (this.health	< 25)
		this.formation = 1;

	// not a formation 1 bot and have a target
	if (target != undefined) {
		dir = this.getDirection(target, 0.05);
		dist = this.myDistanceToPoint(target.x, target.y);

		if (dir.command != 'forward') {
			// if target is not in front of me, do what it takes to get there.
			rtnCommand = dir.command;
		} else if (this.canShoot && this.weapons.bullet > 0) {
			// if the target is in front and I can show and I have bullets to shoot, shoot!
			rtnCommand = "fire";
		} else if (target.health <= this.health) {
			// if the targets health is less than my own, attack!
			rtnCommand = "forward";
		} else if (rtnCommand == 'wait' && dist < 150 && target.health > this.health) {
			// move backwards, if the target is close enough and it's health is greater than my own.
			rtnCommand = "backward";
		}
	} 
	
	// random movement, keep them guessing
	if (this.timer % 10 == 0)
		rtnCommand = this.movements[Math.floor(Math.random() * this.movements.length)];

	// just move backwards every now and then
	if (rtnCommand != 'fire' && this.timer % 30 == 0)
		rtnCommand = 'backward';

	return {'command': rtnCommand, 'team': this.state.payload};
};

server.registerBotScript("Anakin");
