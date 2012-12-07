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
	this.alive = true;		// is the bot alive

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
		this.alive = aBot.alive;
	}

	this.getDirection = function(target, threshold) {
		// simplified path finding algorithm using potential fields.
		// returns a target angle for the bot to point.
		if (target == undefined) 
			return {'command': 'error', 'angle': 0};
		var targetAngle = this.angle;
		var dist = this.myDistanceToPoint(target.x, target.y);
		var angle = server.helpers.normalizeAngle(server.helpers.angleToPoint(this.x, this.y, target.x, target.y));
		var strength = typeof this.attrStrength !== 'undefined'? this.attrStrength : 5;
		var repelStrength = typeof this.repStrength !== 'undefined'? this.repStrength : 2;
		var threshold = typeof threshold !== 'undefined'? threshold : 0.05;
		var dx = 0;
		var dy = 0;

		if (typeof this.safety === 'undefined') {
			this.safety = 7;
		}

		// attractive potential field to target
		if (this.radius <= dist && dist <= this.safety * this.radius) {
			dx = strength * (dist - this.radius) * Math.cos(angle);
			dy = strength * (dist - this.radius) * Math.sin(angle);
		} else if (dist > this.safety * this.radius) {
			dx = strength * this.safety * Math.cos(angle);
			dy = strength * this.safety * Math.sin(angle);
		}

		// repulsive potential field from obstacles
		var obstacles = server.getObstacles();
		server.miniObstacles = [];
		for (i in obstacles) {
			var obs = obstacles[i];
			if ((obs.x != undefined && obs.y != undefined && obs.radius != undefined) || (obs.width == obs.height)) {
				// a circle thing
				var middleX = obs.x + Math.ceil(obs.width / 2);
				var middleY = obs.y + Math.ceil(obs.width / 2);
				radius = this.distanceToPoint(obs.x, obs.y, middleX , middleY) + 3;
				server.miniObstacles.push({'x': middleX, 'y': middleY, 'radius': radius});
				dxdy = this.avoidCircle(radius, middleX, middleY, repelStrength);
				dx += dxdy[0];
				dy += dxdy[1];
			} else if (obs.x != undefined && obs.y != undefined && obs.width != undefined && obs.height != undefined) {
				// a four sided thing
				// take the shortest dimension, halve it, and divide the larger dimension by that number.
				// that is the number of circles to draw along the larger dimension. do the repulsion field stuff from those obsticles.

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
					server.miniObstacles.push({'x': x, 'y': y, 'radius': radius});
					dxdy = this.avoidCircle(radius, x, y, repelStrength);
					dx += dxdy[0];
					dy += dxdy[1];
				}
			} else { 
				// something else entirely
				console.log("shouldn't be here yet");
			}
		}

		// was there a change in my location
		if (dx != 0 || dy != 0) {
			targetAngle = server.helpers.normalizeAngle(server.helpers.angleToPoint(this.x, this.y, this.x + dx, this.y + dy));
		}
		targetAngle = server.helpers.normalizeAngle(targetAngle - this.angle);
		rtnCommand = 'right';
		if (targetAngle > Math.PI)
			rtnCommand = 'left';
		if (targetAngle <= threshold || targetAngle >= ((2*Math.PI) - threshold)) {
			rtnCommand = "forward";
		}
		// console.log(rtnCommand, this.id, "a", this.angle, "ta", targetAngle, "dir", this.angle - targetAngle, "loc", this.x, this.y);
		return {'command':rtnCommand, 'angle':targetAngle};
	}

	this.myDistanceToPoint = function(x, y) {
		return server.helpers.distanceToPoint(this.x, this.y, x, y);
	}

	this.distanceToPoint = function(x1, y1, x2, y2) {
		return server.helpers.distanceToPoint(x1, y1, x2, y2);
	}

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
};
