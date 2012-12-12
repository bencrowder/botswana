// Bot: Destroyer
// Ruleset: default
// --------------------------------------------------

var Destroyer = function() {};

Destroyer.prototype = new Bot();

Destroyer.prototype.setup = function() {
	this.clicks = 0;			// keep track of how many clicks
	this.opponent = -1;
	this.speed = 2;
	this.safety = 7;
	this.attrStrength = 5;
	this.repStrength = 2;
};

Destroyer.prototype.run = function() {
	this.clicks++;
	var action = 'wait';
	// get the opponent's information
	if (this.opponent == -1) {
		for (i in this.state.bots) {
			var bot = this.state.bots[i];
			if (bot.name != this.name) {
				this.opponent = i;
			}
		}
	}

	// to I have a target opponent selected
	if (this.opponent >= 0) {
		var target = this.state.bots[this.opponent];
		if (target == undefined) {
			this.opponent = -1;
		} else {
			var dir = this.getDirection(target);

			// if I am hurt bad and my health is less than my opponents, retreat
			if (dir.command != 'forward') {
				action = dir.command;
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

server.registerBotScript("Destroyer");
