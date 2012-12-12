// Bot: Destroyer
// Ruleset: default
// --------------------------------------------------

var Destroyer = function() {};

Destroyer.prototype = new Bot();

Destroyer.prototype.setup = function() {
	// For getDirection()
	this.attrStrength = 5;
	this.safety = 7;
	this.repStrength = 2;

	// ID of bot's opponent
	this.opponent = -1;
};

Destroyer.prototype.run = function() {
	var command = 'wait';

	// Choose an opponent
	if (this.opponent == -1) {
		for (i in this.state.bots) {
			var bot = this.state.bots[i];
			if (bot.name != this.name) {
				this.opponent = i;
			}
		}
	}

	// If there's an opponent selected
	if (this.opponent >= 0) {
		var target = this.state.bots[this.opponent];

		if (target == undefined) {
			// The opponent must have died, so reset and get a new one next round
			this.opponent = -1;
		} else {
			// Get direction towards target
			var dir = this.getDirection(target);

			// If hurt bad and health is less than the opponent's, retreat
			if (dir.command != 'forward') {
				command = dir.command;
			} else {
				if (this.canShoot) {
					command = 'fire';
				} else {
					command = 'forward';
				}
			}
		}
	}

	return { 'command': command, 'team': {} };
};

server.registerBotScript("Destroyer");
