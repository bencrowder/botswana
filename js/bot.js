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
	}

	this.getDirection = function(target) {
		// simplified path finding algorithm using potential fields.
		// returns a target angle for the bot to point.
		var targetAngle = this.angle;
		var dist = distanceToPoint(this.x, this.y, target.x, target.y);
		var angle = normalizeAngle(angleToPoint(this.x, this.y, target.x, target.y));
		var strength = typeof this.attrStrength !== 'undefined'? this.attrStrength : 5;
		var repelStrength = typeof this.repStrength !== 'undefined'? this.repStrength : 2;
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
		return this.angle - targetAngle;
	};
};
