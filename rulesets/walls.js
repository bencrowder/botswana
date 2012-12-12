// Walls ruleset
//
// Moving walls

var ruleset = new Ruleset(server);

ruleset.name = "walls";

ruleset.properties.world.width = 1200;
ruleset.properties.world.height = 700;
ruleset.draw.width = ruleset.properties.world.width;
ruleset.draw.height = ruleset.properties.world.height;

ruleset.properties.world.obstacleSpeed = 3;
ruleset.properties.world.obstacleSpeedVariation = 3;

ruleset.generateObstacles = function() {
	var obstacles = [
		{ "x": 100, "y": 10, "width": 50, "height": 100 },
		{ "x": 500, "y": 200, "width": 50, "height": 100 },
		{ "x": 900, "y": 400, "width": 50, "height": 100 },

		{ "x": 300, "y": 140, "width": 200, "height": 20 },
		{ "x": 500, "y": 340, "width": 200, "height": 20 },
		{ "x": 700, "y": 540, "width": 200, "height": 20 },
	];

	return obstacles;
};

ruleset.initializeGame = function() {
	// Set up obstacle direction/speed array
	var obstacles = server.getObstacles();
	for (i in obstacles) {
		obstacle = obstacles[i];

		obstacle.direction = ((Math.random() * 10) > 5) ? 1 : -1;
		obstacle.speed = ruleset.properties.world.obstacleSpeed + ((Math.random() * ruleset.properties.world.obstacleSpeedVariation) - ruleset.properties.world.obstacleSpeedVariation / 2);
	}
};

ruleset.startRound = function(clicks) {
	var bots = server.getBots();
	var obstacles = server.getObstacles();

	var padding = ruleset.properties.bots.radius * 2 + 10;

	// For each obstacle, move according to direction/speed
	for (i in obstacles) {
		var obstacle = obstacles[i];

		// Move in the right direction
		var deltaX = obstacle.direction * obstacle.speed;

		obstacle.x += deltaX;

		// Boundary checks
		if (obstacle.x <= padding) {
			obstacle.x = padding;
			obstacle.direction *= -1;
		}

		if (obstacle.x + obstacle.width + padding >= ruleset.properties.world.width) {
			obstacle.x = ruleset.properties.world.width - obstacle.width - padding;
			obstacle.direction *= -1;
		}

		// Check to see if we've hit any bots, and if so, move them along with the wall
		for (i in bots) {
			var bot = bots[i];

			if (server.collisionObstacle(obstacle, bot)) {
				bot.x += deltaX;
			}
		}
	}
};

ruleset.draw.obstacle = function(obstacle) {
	this.c.strokeStyle = "#663366";
	this.c.lineWidth = 3;
	this.c.fillStyle = "rgba(50, 30, 50, 1)";

	this.c.beginPath();
	this.c.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
	this.c.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
}

server.setRuleset(ruleset);

$("#canvas").attr("width", ruleset.properties.world.width);
$("#canvas").attr("height", ruleset.properties.world.height);
$(".container").css("width", ruleset.properties.world.width + 10 + "px");
