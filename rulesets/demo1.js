/* Demo ruleset #1 */

var ruleset = new Ruleset(server);

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

ruleset.setInitialPlacement = function(bot) {
	var positions = [
		//{ 'x': 25, 'y': 160 },
		//{ 'x': 25, 'y': 100 },
		//{ 'x': 25, 'y': 140 },
		//{ 'x': 25, 'y': 180 },
		{ 'x': 200, 'y': 140 },
		{ 'x': 200, 'y': 180 },
		{ 'x': 200, 'y': 220 },
		{ 'x': 200, 'y': 260 },
		//{ 'x': 975, 'y': 400 },
		//{ 'x': 975, 'y': 440 },
		//{ 'x': 975, 'y': 480 },
		//{ 'x': 975, 'y': 520 },
		{ 'x': 800, 'y': 320 },
		{ 'x': 800, 'y': 360 },
		{ 'x': 800, 'y': 400 },
		{ 'x': 800, 'y': 440 },
	];

	bot.x = positions[bot.id].x;
	bot.y = positions[bot.id].y;
};

ruleset.draw.backgroundLayer = function() {
	this.c.beginPath();

	for (var x=20; x<this.width; x+=20) {
		this.c.moveTo(x, 0);
		this.c.lineTo(x, this.height);
	}

	for (var y=20; y<this.height; y+=20) {
		this.c.moveTo(0, y);
		this.c.lineTo(this.width, y);
	}

	this.c.strokeStyle = "#282828";
	this.c.stroke();
	//ruleset.draw.miniObs();
};

server.setRuleset(ruleset);
