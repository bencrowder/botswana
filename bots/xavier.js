// Bot: Xavier
// Ruleset: default
// --------------------------------------------------

var Xavier = function() {};

Xavier.prototype = new Bot();

Xavier.prototype.setup = function() {
	this.target = undefined;
	this.strafe = 75;

	// Field stuff
	this.attrStrength = 8;
	this.safety = 9;
	this.repStrength = 4;
};


// Decide which bot to target
// --------------------------------------------------

Xavier.prototype.acquireTarget = function() {
	var target = undefined;
	var distance = 50000;	// Obscenely high number

	for (i in this.state.bots) {
		var bot = this.state.bots[i];

		// Only attack opposing bots
		if (bot.name != this.name) {
			// If I'm closer to this bot, make it my target
			if (this.myDistanceToPoint(bot.x, bot.y) < distance) {
				target = bot;
				this.state.payload.targets[this.id] = bot.id;

				distance = this.myDistanceToPoint(bot.x, bot.y);
			}
		}
	}

	return target;
}


// Check for collisions
// --------------------------------------------------

Xavier.prototype.checkCollisions = function(point) {
	var collision = false;
	var type = '';
	var object = undefined;

	var obstacles = server.getObstacles();
	var bots = server.getBots();

	// Check bots
	for (i in bots) {
		bot = bots[i];
		if (server.collisionBotWeapon(bot, point)) {
			collision = true;
			type = 'bot';
			object = bot;
			break;
		}
	}

	// Check obstacles
	if (!collision) {
		for (i in obstacles) {
			obstacle = obstacles[i];
			if (server.collisionObstacle(obstacle, point)) {
				collision = true;
				type = 'obstacle';
				object = obstacle;
				break;
			}
		}
	}

	// Check boundaries
	if (!collision && server.collisionBoundary(point)) {
		collision = true;
		type = 'boundary';
		object = undefined;
	}
	
	return { collision: collision, type: type, object: object };
}


// Starting at (x, y) and moving along angle, check for collisions
// Returns collision type and distance to first collision
// --------------------------------------------------

Xavier.prototype.distanceToCollision = function(x, y, angle) {
	var speed = 5;
	var newPoint = { x: x, y: y };
	var response = {};
	response.collision = false;

	while (!response.collision) {
		newPoint = server.helpers.calcVector(newPoint.x, newPoint.y, angle, speed);

		response = this.checkCollisions(newPoint);
	}

	distance = this.myDistanceToPoint(newPoint.x, newPoint.y);

	return { distance: distance, type: response.type, object: response.object };
}


// Run distanceToCollision for my bot
// --------------------------------------------------

Xavier.prototype.myDistanceToCollision = function() {
	// Start outside the bot
	var pos = server.helpers.calcVector(this.x, this.y, this.angle, this.radius + 1);

	return this.distanceToCollision(pos.x, pos.y, this.angle);
}


// Standard run function
// --------------------------------------------------

Xavier.prototype.run = function() {
	// Initialize command to return
	var command = '';

	if (typeof this.state.payload.targets == 'undefined') {
		this.state.payload.targets = {}
	};

	// Get the closest target
	this.target = this.acquireTarget();

	// Find out what's on my path
	var dtc = this.myDistanceToCollision(this.x, this.y, this.angle);

	// Use fields to get recommended command for moving close to target
	var dir = this.getDirection(this.target, 0.05);

	// Distance to target
	var dist = this.myDistanceToPoint(this.target.x, this.target.y);

	// Boolean: are we aiming at an enemy bot?
	var aimingAtEnemy = (dtc.type == 'bot' && dtc.object.name != this.name);

	// Boolean: are we aiming at an obstacle and it's fairly close?
	var aimingAtCloseObstacle = (dtc.type == 'obstacle' && dtc.distance < 150);

	// If the bot can shoot, and if we're aiming at an enemy or a close obstacle, shoot
	if (this.canShoot && this.weapons.bullet > 0 && (aimingAtEnemy || aimingAtCloseObstacle)) {
		command = 'fire';
	} else {
		// Turn left or right if that's what the field says
		if (dir.command != 'forward') {
			command = dir.command;
		} else {
			// If one of our team bots is in front of us, strafe right to get out from behind them
			if (dtc.type == 'bot' && dtc.object.name == this.name) {
				command = 'strafe-right';
			} else {
				// If we're far away, move close
				if (dist > 80) {
					command = 'forward';
				} else {	
					// Otherwise strafe
					command = (this.strafe > 50) ? "strafe-left" : "strafe-right";

					if (this.strafe > 0) {
						this.strafe--;
					} else {
						this.strafe = 100;
					}
				}
			}
		}
	}

	return { 'command': command, 'team': this.state.payload };
};

server.registerBotScript("Xavier");
