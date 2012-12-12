// Parent bot class
// --------------------------------------------------

function Bot() {
	this.name;
	this.id;
	this.x;
	this.y;
	this.color;
	this.angle;				// in radians
	this.radius;			// size of bot
	this.health;			// 0-100
	this.alive = true;		// is the bot alive

	this.weapons = {};		// object with number of available ammo
	this.canShoot;			// boolean
	this.waitFire;			// clicks to wait before firing

	this.collided = false	// boolean
	this.hitByBullet;		// boolean

	this.state = { world: {}, bots: [], weapons: [], items: [], obstacles: [] };


	// Setup (override)
	// --------------------------------------------------

	this.setup = function() {

	};


	// Run (override)
	// --------------------------------------------------

	this.run = function() {
		return { command: 'wait', team: {} };
	};


	// Pathfinding helper function, uses potential fields
	// --------------------------------------------------

	this.getDirection = function(target, threshold) {
		// Make sure the target is real
		if (target == undefined) {
			return { 'command': 'error', 'angle': 0 };
		}

		var targetAngle = this.angle;
		var dist = this.myDistanceToPoint(target.x, target.y);
		var angle = server.helpers.normalizeAngle(server.helpers.angleToPoint(this.x, this.y, target.x, target.y));
		var strength = (typeof this.attrStrength !== 'undefined') ? this.attrStrength : 5;
		var repelStrength = (typeof this.repStrength !== 'undefined') ? this.repStrength : 2;
		var threshold = (typeof threshold !== 'undefined') ? threshold : 0.05;
		var dx = 0;
		var dy = 0;

		if (typeof this.safety === 'undefined') {
			this.safety = 7;
		}

		// Attractive potential field to target
		if (this.radius <= dist && dist <= this.safety * this.radius) {
			dx = strength * (dist - this.radius) * Math.cos(angle);
			dy = strength * (dist - this.radius) * Math.sin(angle);
		} else if (dist > this.safety * this.radius) {
			dx = strength * this.safety * Math.cos(angle);
			dy = strength * this.safety * Math.sin(angle);
		}

		// Repulsive potential field from obstacles
		var obstacles = server.getObstacles();
		server.miniObstacles = [];

		for (i in obstacles) {
			var obs = obstacles[i];

			if ((obs.x != undefined && obs.y != undefined && obs.radius != undefined) || (obs.width == obs.height)) {
				// It's a circle type object
				var middleX = obs.x + Math.ceil(obs.width / 2);
				var middleY = obs.y + Math.ceil(obs.width / 2);

				radius = this.distanceToPoint(obs.x, obs.y, middleX , middleY) + 3;

				server.miniObstacles.push({ 'x': middleX, 'y': middleY, 'radius': radius });

				dxdy = this.avoidCircle(radius, middleX, middleY, repelStrength);

				dx += dxdy[0];
				dy += dxdy[1];
			} else if (obs.x != undefined && obs.y != undefined && obs.width != undefined && obs.height != undefined) {
				// It's a four-sided thing

				// Take the shortest dimension, halve it, and divide the larger dimension by that number.
				// That's the number of circles to draw along the larger dimension. Do the repulsion field stuff from those obstacles.

				var middle = Math.ceil(obs.width / 2);
				var radius = this.distanceToPoint(obs.x, obs.y, obs.x + middle, obs.y + middle) + 3;
				var propagate = 'height';
				var numMiniObs = Math.ceil(obs.height / middle);

				if (Math.ceil(obs.height / 2) < obs.width) {
					middle = Math.ceil(obs.height / 2);
					radius = this.distanceToPoint(obs.x, obs.y, obs.x + middle, obs.y + middle) + 3;
					propagate = 'width';
					numMiniObs = Math.ceil(obs.width / middle);
				}

				numMiniObs -= 2;

				for (i=0; i<=numMiniObs; i++) {
					var x = obs.x + middle;
					var y = obs.y + (middle * (i+1));

					if (propagate == 'width') {
						x = obs.x + (middle * (i+1));
						y = obs.y + middle;
					}

					server.miniObstacles.push({ 'x': x, 'y': y, 'radius': radius });

					dxdy = this.avoidCircle(radius, x, y, repelStrength);

					dx += dxdy[0];
					dy += dxdy[1];
				}
			} else { 
				// Something else entirely
				console.log("Shouldn't be here");
			}
		}

		// Was there a change in my location?
		if (dx != 0 || dy != 0) {
			targetAngle = server.helpers.normalizeAngle(server.helpers.angleToPoint(this.x, this.y, this.x + dx, this.y + dy));
		}

		targetAngle = server.helpers.normalizeAngle(targetAngle - this.angle);

		var command = 'right';

		if (targetAngle > Math.PI) {
			command = 'left';
		}

		if (targetAngle <= threshold || targetAngle >= ((2 * Math.PI) - threshold)) {
			command = "forward";
		}

		return { 'command': command, 'angle': targetAngle };
	}


	// Get bot's distance to a point
	// --------------------------------------------------

	this.myDistanceToPoint = function(x, y) {
		return server.helpers.distanceToPoint(this.x, this.y, x, y);
	}


	// Get a distance from one point to another
	// --------------------------------------------------

	this.distanceToPoint = function(x1, y1, x2, y2) {
		return server.helpers.distanceToPoint(x1, y1, x2, y2);
	}


	// Avoid circle (pathfinding)
	// --------------------------------------------------

	this.avoidCircle = function(radius, x, y, repelStrength) {
		var dist = this.myDistanceToPoint(x, y);
		var angle = server.helpers.normalizeAngle(server.helpers.angleToPoint(this.x, this.y, x, y));
		var dx = 0;
		var dy = 0;

		if (dist <= radius) {
			dx = (-1.0 * Math.cos(angle)) * 100000000;
			dy = (-1.0 * Math.sin(angle)) * 100000000;
		} else if (dist > radius && dist <= (3 * this.radius) + radius) {
			dx = -1.0 * repelStrength * (3 * this.radius + radius - dist) * Math.cos(angle);
			dy = -1.0 * repelStrength * (3 * this.radius + radius - dist) * Math.sin(angle);
		}

		return [dx, dy];
	}


	// Copy (used to prevent cheating)
	// --------------------------------------------------

	this.copy = function(sourceBot) {
		this.name = sourceBot.name;
		this.id = sourceBot.id;
		this.x = sourceBot.x;
		this.y = sourceBot.y;
		this.color = sourceBot.color;
		this.angle = sourceBot.angle;	
		this.radius = sourceBot.radius;
		this.health = sourceBot.health;
		this.alive = sourceBot.alive;

		this.weapons = sourceBot.weapons;
		this.canShoot = sourceBot.canShoot;
		this.waitFire = sourceBot.waitFire;

		this.collided = sourceBot.collided;
		this.hitByBullet = sourceBot.hitByBullet;

		this.state = sourceBot.state;
	}
};
