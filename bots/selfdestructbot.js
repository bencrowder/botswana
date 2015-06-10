// Bot: SelfDestructBot
// Ruleset: default
// Just a skeleton showing the selfdestruct command.
// --------------------------------------------------

var SelfDestructBot = function() {};

SelfDestructBot.prototype = new Bot();

SelfDestructBot.prototype.setup = function() {
	this.tick = 0;
};

SelfDestructBot.prototype.run = function() {
	this.tick++;

	if (this.tick % 200 == 0) {
		return { command: 'self-destruct', team: {} };
	}

	return { command: 'wait', team: {} };
};

server.registerBotScript("SelfDestructBot");
