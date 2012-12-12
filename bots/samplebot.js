// Bot: SampleBot
// Ruleset: default
// Just a skeleton showing the structure of a bot.
// --------------------------------------------------

var SampleBot = function() {};

SampleBot.prototype = new Bot();

SampleBot.prototype.setup = function() {};

SampleBot.prototype.run = function() {
	return { command: 'wait', team: {} };
};

server.registerBotScript("SampleBot");
