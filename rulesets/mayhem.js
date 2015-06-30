// Mayhem ruleset

var ruleset = new Ruleset(server);

ruleset.name = "mayhem";

ruleset.generateObstacles = function() {
	var obstacles = [
		// Edge arms
		{ x: -10, y: 450 - 15, width: 50, height: 30 },
		{ x: 1500 - 50 + 10, y: 450 - 15, width: 50, height: 30 },

		// Left arm
		{ x: 400, y: 300, width: 30, height: 300 },
		{ x: 200, y: 450 - 15, width: 200, height: 30 },
		{ x: 400 + 30, y: 400 - 15, width: 250, height: 30 },
		{ x: 400 + 30, y: 500 - 15, width: 250, height: 30 },

		// Right arm
		{ x: 1100 - 30, y: 300, width: 30, height: 300 },
		{ x: 1100, y: 450 - 15, width: 200, height: 30 },
		{ x: 1100 - 250 - 30, y: 350 - 15, width: 250, height: 30 },
		{ x: 1100 - 250 - 30, y: 550 - 15, width: 250, height: 30 },

		// Top wall bumps
		{ x: 75, y: 0 - 10, width: 50, height: 50 },
		{ x: 175, y: 0 - 10, width: 50, height: 50 },
		{ x: 275, y: 0 - 10, width: 50, height: 50 },
		{ x: 375, y: 0 - 10, width: 50, height: 50 },
		{ x: 475, y: 0 - 10, width: 50, height: 50 },
		{ x: 575, y: 0 - 10, width: 50, height: 50 },
		{ x: 675, y: 0 - 10, width: 50, height: 50 },
		{ x: 775, y: 0 - 10, width: 50, height: 50 },
		{ x: 875, y: 0 - 10, width: 50, height: 50 },
		{ x: 975, y: 0 - 10, width: 50, height: 50 },
		{ x: 1075, y: 0 - 10, width: 50, height: 50 },
		{ x: 1175, y: 0 - 10, width: 50, height: 50 },
		{ x: 1275, y: 0 - 10, width: 50, height: 50 },
		{ x: 1375, y: 0 - 10, width: 50, height: 50 },

		// Bottom wall bumps
		{ x: 75, y: 900 - 40, width: 150, height: 50 },
		{ x: 375, y: 900 - 40, width: 150, height: 50 },
		{ x: 675, y: 900 - 40, width: 150, height: 50 },
		{ x: 975, y: 900 - 40, width: 150, height: 50 },
		{ x: 1275, y: 900 - 40, width: 150, height: 50 },

		// Middle ground
		{ x: 150, y: 150, width: 100, height: 100 },
		{ x: 150, y: 750 - 100, width: 100, height: 100 },

		{ x: 700, y: 100, width: 100, height: 100 },
		{ x: 700, y: 800 - 100, width: 100, height: 100 },

		{ x: 1350 - 100, y: 150, width: 100, height: 100 },
		{ x: 1350 - 100, y: 750 - 100, width: 100, height: 100 },
	];

	return obstacles;
};

ruleset.setInitialPlacement = function(bot) {
	var x = -50;
	var y = -50;
	var cluster = false;

	// If we've already placed a bot for this team, cluster them together
	for (var i=0; i<state.bots.length; i++) {
		if (state.bots[i].name == bot.name) {
			x = state.bots[i].x;
			y = state.bots[i].y;
			cluster = true;
		}
	}

	if (!cluster) {
		// First bot on team, so get a random position
		botPos = this.server.getRandomPoint();
		x = botPos.x;
		y = botPos.y;
	}

	bot.x = x;
	bot.y = y;
	world = ruleset.properties.world;

	// Loop until we get a position that doesn't collide that's within 100 points on any side
	while (this.server.collisionBotObjects(bot)) {
		// Use Math.min/max for boundary checks
		bot.x = Math.min(x + ((Math.random() * 200) - 100), world.width - 25);
		bot.y = Math.min(y + ((Math.random() * 200) - 100), world.width - 25);
		bot.x = Math.max(bot.x, 25);
		bot.y = Math.max(bot.y, 25);
	}
};

server.setRuleset(ruleset);
