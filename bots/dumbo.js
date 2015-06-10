// Bot: Dumbo
// Ruleset: default
// A fairly dumb bot
// --------------------------------------------------

var Dumbo = function() {};

Dumbo.prototype = new Bot();

Dumbo.prototype.setup = function() {
	this.timer = 0;
	this.hitTimer = 0;
};

Dumbo.prototype.run = function() {
	this.timer++;

	// By default, wait
	command = 'wait';

	// Set hit counter
	if (this.hitByBullet) {
		this.hitTimer = 10;
	}

	// If we've been hit
	if (this.hitTimer > 0) {
		// Every fifth turn, move left; every 19th turn, mine; otherwise move forward
		if (this.timer % 5 == 0) {
			command = "left";
		} else if (this.timer % 19 == 0) {
			command = "mine";
		} else {
			command = "forward";
		}

		this.hitTimer--;
	} else {
		// If we haven't been hit, move forward every 13th turn; otherwise fire
		if (this.timer % 13 == 0) {
			command = "forward";
		} else {
			command = "fire";
		}
	}

	return { command: command, team: {} };
};

server.registerBotScript("Dumbo");
