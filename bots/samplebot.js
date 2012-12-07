var SampleBot = function() {};

SampleBot.prototype = new Bot();

SampleBot.prototype.setup = function() {};

SampleBot.prototype.run = function() {
	return {'command': 'wait', 'team': {}};
};

server.registerBotScript("SampleBot");
