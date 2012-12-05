/* Test ruleset, used for development */

var ruleset = server.getRuleset();
ruleset = new Ruleset(server);

ruleset.properties.name = "test";

ruleset.properties.botsPerTeam = 4;

ruleset.properties.bots = {
	'angleStep': 0.1,
	'speed': 5,
	'radius': 10,
	'radiusMargin': 0,
	'colors': [ "#01eb5f", "#b11e1e" ]
};

ruleset.properties.weapons.bullet.speed = 8;
ruleset.properties.weapons.bullet.strength = 3;
ruleset.properties.weapons.bullet.waitTime = 15;
ruleset.properties.weapons.bullet.numAllowed = 3;

ruleset.generateObstacles = function() {
	// Simpler obstacle generation for now
	var obstacles = [
		{ "x": 50, "y": 200, "width": 50, "height": 200 },
		{ "x": 900, "y": 200, "width": 50, "height": 200 },
		{ "x": 450, "y": 250, "width": 100, "height": 100 },
		{ "x": 100, "y": 40, "width": 800, "height": 40 },
		{ "x": 100, "y": 520, "width": 800, "height": 40 }
	];

	return obstacles;
};

server.setRuleset(ruleset);
