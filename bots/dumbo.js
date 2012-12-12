// Bot: Dumbo
// Ruleset: default
// A fairly dumb bot
// --------------------------------------------------

var Dumbo = function() {};

Dumbo.prototype = new Bot();

Dumbo.prototype.setup = function() {
	this.timer = 0;
	this.hit = 0;
};

Dumbo.prototype.run = function() {
	this.timer++;

	// By default, wait
	command = 'wait';

	// Set hit counter
	if (this.hitByBullet) {
		this.hit = 10;
	}

	// If we've been hit
	if (this.hit > 0) {
		// Every fifth turn, move left; otherwise move forward
		if (this.timer % 5 == 0) {
			command = "left";
		} else {
			command = "forward";
		}
		this.hit--;
	} else {
		// If we haven't been hit
		command = "fire";
	}

	return { command: command, team: {} };
};

server.registerBotScript("Dumbo");
