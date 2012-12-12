// Orbit ruleset
//
// Teams orbit around the center point in opposite directions

var ruleset = new Ruleset(server);

ruleset.properties.botsPerTeam = 4;

ruleset.generateObstacles = function() {
	// Central planet
	var obstacles = [
		{ "x": 475, "y": 275, "width": 50, "height": 50 },
	];

	return obstacles;
};

// Disable forward/backward/strafe
ruleset.commands.forward = function(bot) { return; }
ruleset.commands.backward = function(bot) { return; }
ruleset.commands['strafe-left'] = function(bot) { return; }
ruleset.commands['strafe-right'] = function(bot) { return; }

ruleset.postUpdateBot = function(bot) {
	// Get bot's team
	var teams = this.server.getTeams();
	var teamIndex = teams.indexOf(bot.name);

	// Move the bot in orbit around the center point
	var halfWidth = ruleset.properties.world.width / 2;
	var halfHeight = ruleset.properties.world.height / 2;

	var radius = bot.myDistanceToPoint(halfWidth, halfHeight);
	var angle = 0.008;

	// Switch direction depending on team
	angle = angle * ((teamIndex == 0) ? 1 : -1);

	var x = bot.x - halfWidth;
	var y = bot.y - halfHeight;

	var newX = x * Math.cos(angle) - y * Math.sin(angle);
	var newY = y * Math.cos(angle) + x * Math.sin(angle);

	bot.x = halfWidth + newX;
	bot.y = halfHeight + newY;
};

server.setRuleset(ruleset);
