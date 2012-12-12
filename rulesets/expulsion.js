// Expulsion ruleset
//
// Wall separates two sides, with a teleportation circle in the middle
// (any bot that touches the circle will be teleported somewhere random)

var ruleset = new Ruleset(server);

ruleset.name = "expulsion";

ruleset.properties.botsPerTeam = 4;
ruleset.properties.bots.radiusMargin = 10;
ruleset.properties.world.teleportationCircleRadius = 100;

// Set the bot radii randomly (within a range)
ruleset.postInitBot = function(bot) {
	bot.radius = ruleset.properties.bots.radius + ((Math.random() * ruleset.properties.bots.radiusMargin) - ruleset.properties.bots.radiusMargin / 2);
};

ruleset.generateObstacles = function() {
	// Central wall
	var obstacles = [
		{ "x": 475, "y": 0, "width": 50, "height": 200 },
		{ "x": 475, "y": 400, "width": 50, "height": 200 },
	];

	return obstacles;
};

ruleset.updateBot = function(bot, pos) {
	// Use the latest position
	if (pos == undefined) {
		pos = { x: bot.x, y: bot.y };
	}

	// If the bot touches the teleportation circle
	var distToCircle = this.server.helpers.distanceToPoint(pos.x, pos.y, this.properties.world.width / 2, this.properties.world.height / 2);

	if (distToCircle < this.properties.world.teleportationCircleRadius) {
		// Get a random position
		botPos = server.getRandomPoint();
		bot.x = botPos.x;
		bot.y = botPos.y;

		// Loop until we get a position that doesn't collide with anything
		while (this.server.collisionBotObjects(bot)) {
			botPos = this.server.getRandomPoint();
			bot.x = botPos.x;
			bot.y = botPos.y;
		} 

		pos.x = bot.x;
		pos.y = bot.y;
	}

	return pos;
};

ruleset.draw.foregroundLayer = function() {
	this.c.save();

	this.c.fillStyle = "rgba(0, 0, 0, 0.4)";
	this.c.strokeStyle = "rgba(200, 255, 100, 0.4)";
	this.c.lineWidth = 10;

	this.c.beginPath();
	this.c.arc(ruleset.properties.world.width / 2, ruleset.properties.world.height / 2, ruleset.properties.world.teleportationCircleRadius, 0, 2 * Math.PI);
	this.c.closePath();
	this.c.fill();
	this.c.stroke();

	this.c.restore();
};

server.setRuleset(ruleset);
