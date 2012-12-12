// Bot: Teleporter
// Ruleset: teleport
// Like Crusher, but instead of strafing, it teleports
// --------------------------------------------------

var Teleporter = function() {};

Teleporter.prototype = new Bot();

Teleporter.prototype.setup = function() {
	this.timer = 0;			// keep track of how many clicks
	this.attrStrength = 8;
	this.safety = 9;
	this.repStrength = 4;
	this.strafe = 75;
};

Teleporter.prototype.acquireTarget = function() {
	target = undefined;
	for (i in this.state.bots) {
		var bot = this.state.bots[i];
		if (bot.id == this.state.payload.targets[this.id]) {
			target = bot;
		}
	}
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

Teleporter.prototype.run = function() {
	this.timer++;
	target = undefined;

	rtnCommand = '';
	// get the opponent's information
	if (typeof this.state.payload.targets == 'undefined') {
		this.state.payload.targets = {}
		myteam = [];
		oppteam = [];
		for (i in this.state.bots) {
			var bot = this.state.bots[i];
			if (bot.name != this.name) {
				oppteam.push(bot.id);
			} else {
				myteam.push(bot.id);
			}
		}
		for (i in myteam) {
			this.state.payload.targets[myteam[i]] = oppteam[i]
		}
	}

	target = this.acquireTarget();

	if (target != undefined) {
		dir = this.getDirection(target, 0.05);
		dist = this.myDistanceToPoint(target.x, target.y);

		if (dir.command != 'forward') {
			rtnCommand = dir.command;
		} else {
			if (dist > 10 * this.radius) {
				rtnCommand = "forward";
			} else if (this.canShoot && this.weapons.bullet > 0) {
				rtnCommand = "fire";
			} else {
				rtnCommand = "teleport";
			} 
		}
	} else {
		rtnCommand = "wait";
	}

	return { command: rtnCommand, team: this.state.payload };
};

server.registerBotScript("Teleporter");
