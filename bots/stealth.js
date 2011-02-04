var StealthBot = function() {};

StealthBot.prototype = new Bot("Stealth");

StealthBot.prototype.setup = function() {
	this.timer = 0;
	this.cmd = 0;			// which command to use
	this.commands = ["forward", "right", "forward", "left"];
};

StealthBot.prototype.run = function() {
	if (this.timer % 20 == 0) {
		this.cmd += 1;
		if (this.cmd > 3) { this.cmd = 0; }
	}

	this.timer++;

	return this.commands[this.cmd];
};

var stealthbot = new StealthBot();

registerBot(stealthbot);
