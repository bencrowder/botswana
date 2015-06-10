// Demo ruleset #1

var ruleset = new Ruleset(server);

ruleset.name = "demo1";

ruleset.properties.bots.angleStep = 0.1;
ruleset.properties.bots.speed = 5;
ruleset.properties.bots.radius = 10;

ruleset.properties.bots.colors[0] = "#01eb5f";
ruleset.properties.bots.colors[1] = "#b11e1e";

ruleset.properties.weapons.bullet.speed = 8;
ruleset.properties.weapons.bullet.strength = 3;
ruleset.properties.weapons.bullet.waitTime = 15;
ruleset.properties.weapons.bullet.numAllowed = 3;

ruleset.generateObstacles = function() {
	// Simpler obstacle generation for now
	var obstacles = [
		{ "x": 150, "y": 200, "width": 50, "height": 500 },
		{ "x": 1300, "y": 200, "width": 50, "height": 500 },
		{ "x": 700, "y": 400, "width": 100, "height": 100 },
		{ "x": 250, "y": 100, "width": 1000, "height": 40 },
		{ "x": 250, "y": 760, "width": 1000, "height": 40 }
	];

	return obstacles;
};

ruleset.setInitialPlacement = function(bot) {
	var positions = [
		{ 'x': 300, 'y': 240 },
		{ 'x': 300, 'y': 280 },
		{ 'x': 340, 'y': 240 },
		{ 'x': 340, 'y': 280 },
		{ 'x': 1200, 'y': 600 },
		{ 'x': 1200, 'y': 640 },
		{ 'x': 1160, 'y': 600 },
		{ 'x': 1160, 'y': 640 },
		{ 'x': 300, 'y': 600 },
		{ 'x': 300, 'y': 640 },
		{ 'x': 340, 'y': 600 },
		{ 'x': 340, 'y': 640 },
		{ 'x': 1200, 'y': 240 },
		{ 'x': 1200, 'y': 280 },
		{ 'x': 1160, 'y': 240 },
		{ 'x': 1160, 'y': 280 },
		{ 'x': 730, 'y': 600 },
		{ 'x': 730, 'y': 640 },
		{ 'x': 770, 'y': 600 },
		{ 'x': 770, 'y': 640 },
		{ 'x': 730, 'y': 240 },
		{ 'x': 730, 'y': 280 },
		{ 'x': 770, 'y': 240 },
		{ 'x': 770, 'y': 280 },
	];

	bot.x = positions[bot.id].x;
	bot.y = positions[bot.id].y;
};

server.setRuleset(ruleset);
