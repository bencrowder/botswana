// Training ruleset

var ruleset = new Ruleset(server);

ruleset.name = "training";

ruleset.generateObstacles = function() {
	// Simpler obstacle generation for now
	var obstacles = [
		// Short arms
		{ x: -10, y: 140, width: 400, height: 60 },
		{ x: 1110, y: 700, width: 400, height: 60 },

		// Longer arms
		{ x: 140, y: 720, width: 450, height: 60 },
		{ x: 910, y: 120, width: 450, height: 60 },

		// Longer forearms
		{ x: 530, y: 520, width: 60, height: 200 },
		{ x: 910, y: 180, width: 60, height: 200 },

		// Middle
		{ x: 720, y: -10, width: 60, height: 250 },
		{ x: 720, y: 660, width: 60, height: 250 },
		{ x: 720, y: 400, width: 60, height: 100 },
	];

	return obstacles;
};

ruleset.setInitialPlacement = function(bot) {
	var positions = [
		{ 'x': 140, 'y': 40 },
		{ 'x': 180, 'y': 80 },
		{ 'x': 240, 'y': 40 },
		{ 'x': 280, 'y': 80 },

		{ 'x': 1220, 'y': 820 },
		{ 'x': 1260, 'y': 860 },
		{ 'x': 1320, 'y': 820 },
		{ 'x': 1360, 'y': 860 },

		{ 'x': 140, 'y': 820 },
		{ 'x': 180, 'y': 860 },
		{ 'x': 240, 'y': 820 },
		{ 'x': 280, 'y': 860 },

		{ 'x': 1220, 'y': 40 },
		{ 'x': 1260, 'y': 80 },
		{ 'x': 1320, 'y': 40 },
		{ 'x': 1360, 'y': 80 },

		{ 'x': 40, 'y': 430 },
		{ 'x': 80, 'y': 470 },
		{ 'x': 140, 'y': 430 },
		{ 'x': 180, 'y': 470 },

		{ 'x': 1320, 'y': 430 },
		{ 'x': 1360, 'y': 470 },
		{ 'x': 1420, 'y': 430 },
		{ 'x': 1460, 'y': 470 },
	];

	bot.x = positions[bot.id].x;
	bot.y = positions[bot.id].y;
};

server.setRuleset(ruleset);
