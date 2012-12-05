/* Test ruleset, used for development */

var ruleset = new Ruleset(server);

ruleset.properties.name = "test";

ruleset.properties.botsPerTeam = 4;

ruleset.properties.bots = {
	'angleStep': 0.1,
	'speed': 5,
	'radius': 30,
	'radiusMargin': 0,
	'colors': [ "#ebd801", "#946fbb" ]
};

ruleset.properties.weapons.bullet.speed = 8;
ruleset.properties.weapons.bullet.strength = 3;
ruleset.properties.weapons.bullet.waitTime = 15;
ruleset.properties.weapons.bullet.numAllowed = 3;
ruleset.properties.weapons.bullet.display.length = 18;
ruleset.properties.weapons.bullet.display.width = 35;

ruleset.generateObstacles = function() {
	// Simpler obstacle generation for now
	var obstacles = [];

	return obstacles;
};

server.setRuleset(ruleset);
