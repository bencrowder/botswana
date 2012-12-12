// Bot: Crusher
// Ruleset: default
// --------------------------------------------------

var Crusher = function() {};

Crusher.prototype = new Bot();

Crusher.prototype.setup = function() {
	// For getDirection()
	this.attrStrength = 8;
	this.safety = 9;
	this.repStrength = 4;

	// Strafe counter
	this.strafe = 75;
};


// Acquire target
// --------------------------------------------------

Crusher.prototype.acquireTarget = function() {
	target = undefined;

	// If we already have a target specified in the payload, use it
	for (i in this.state.bots) {
		var bot = this.state.bots[i];

		if (bot.id == this.state.payload.targets[this.id]) {
			target = bot;
		}
	}

	// If there's no target, get the first enemy bot (and stash it in the payload)
	if (typeof target == 'undefined') {
		for (i in this.state.bots) {
			var bot = this.state.bots[i];

			if (bot.name != this.name) {
				this.state.payload.targets[this.id] = bot.id;
				target = bot;
			}
		}
	}

	return target;
}

Crusher.prototype.run = function() {
	target = undefined;
	command = '';

	// Set up the targets payload (shared between bots on the team)
	if (typeof this.state.payload.targets == 'undefined') {
		this.state.payload.targets = {};
		myteam = [];
		oppteam = [];

		// Loop through the bots and put them in my team array or the opposing team's array
		for (i in this.state.bots) {
			var bot = this.state.bots[i];
			if (bot.name != this.name) {
				oppteam.push(bot.id);
			} else {
				myteam.push(bot.id);
			}
		}

		// Go through and assign each bot on my team a target on the other team
		for (i in myteam) {
			this.state.payload.targets[myteam[i]] = oppteam[i];
		}
	}

	target = this.acquireTarget();

	// If we got a target back
	if (target != undefined) {
		// Get the recommended direction to target and the distance
		dir = this.getDirection(target, 0.05);
		dist = this.myDistanceToPoint(target.x, target.y);

		// If we're supposed to turn left or right, do it
		if (dir.command != 'forward') {
			command = dir.command;
		} else {
			// If we're far away, move forward
			if (dist > 10 * this.radius) {
				command = "forward";
			} else if (this.canShoot && this.weapons.bullet > 0) {
				// If we're close and can shoot, shoot
				command = "fire";
			} else {
				// Strafe
				if (this.strafe > 25) {
					command = "strafe-left";
				} else {
					command = "strafe-right";
				}

				// Decrease strafe counter
				this.strafe--;

				if (this.strafe == 0) {
					this.strafe = 50;
				}
			} 
		}
	} else {
		// We have no target, so just wait
		command = "wait";
	}

	return { 'command': command, 'team': this.state.payload };
};

server.registerBotScript("Crusher");
