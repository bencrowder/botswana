/* Demo ruleset #3 */

var ruleset = server.getRuleset();
ruleset = new Ruleset(server);

ruleset.properties.botsPerTeam = 5;

ruleset.properties.bots = {
	'angleStep': 0.1,
	'speed': 2,
	'radius': 15,
	'radiusMargin': 0,
	'colors': [ "#1eabb1", "#e27ef0" ]
};

ruleset.properties.weapons.bullet.speed = 15;
ruleset.properties.weapons.bullet.strength = 3;
ruleset.properties.weapons.bullet.waitTime = 5;
ruleset.properties.weapons.bullet.numAllowed = 8;

ruleset.generateObstacles = function() {
	// Simpler obstacle generation for now
	var obstacles = [
		{ "x": 50, "y": 50, "width": 100, "height": 100 },
		{ "x": 350, "y": 350, "width": 100, "height": 100 },
		{ "x": 550, "y": 150, "width": 100, "height": 100 },
		{ "x": 750, "y": 250, "width": 100, "height": 100 },
		{ "x": 100, "y": 450, "width": 50, "height": 50 },
		{ "x": 850, "y": 500, "width": 50, "height": 50 },
		{ "x": 850, "y": 20, "width": 50, "height": 50 },
	];

	return obstacles;
};

// Replace the grid with background circles
ruleset.draw.gridItems = [];
for (var x=0; x<280; x++) {
	ruleset.draw.gridItems.push({ 'x': Math.random() * ruleset.draw.width, 'y': Math.random() * ruleset.draw.height, 'radius': Math.random() * 2 });
}

ruleset.draw.grid = function() {
	this.c.beginPath();

	for (i in this.gridItems) {
		var item = this.gridItems[i];

		this.c.arc(item.x, item.y, item.radius, 0, Math.PI * 2, true);
	}

	this.c.fillStyle = "rgba(255, 255, 255, 0.15)";
	this.c.fill();
};

ruleset.draw.obstacle = function(obstacle) {
	this.c.strokeStyle = "#024";
	this.c.lineWidth = 2;
	this.c.fillStyle = "#013";

	this.c.beginPath();
	this.c.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
	this.c.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
}

ruleset.draw.bot = function(x, y, angle, color, radius, health) {
	this.c.save();
	this.c.translate(x, y);
	this.c.rotate(angle);

	this.c.lineWidth = 2;

	var healthValue = parseInt(health * (255 / 100)); // hardcoded for now
	this.c.strokeStyle = "rgba(255, " + healthValue + ", " + healthValue + ", 1.0)";
	this.c.fillStyle = color;

	// Draw triangle
	var halfRadius = radius / 2;
	this.c.beginPath();
	this.c.moveTo(-radius, -halfRadius);
	this.c.lineTo(-radius + (halfRadius / 2), 0);
	this.c.lineTo(-radius, halfRadius);
	this.c.lineTo(radius, 0);
	this.c.lineTo(-radius, -halfRadius);
	this.c.closePath();
	this.c.fill();
	this.c.stroke();

	this.c.restore();
};

server.setRuleset(ruleset);

$("body").css("background", "#050505");

// 3D transform
$("#main").css("-webkit-perspective", "300px");

$("#main .container").css({
	"-webkit-transform": "rotateX(5deg) rotateY(2deg)",
	"-webkit-transition": "all 1s ease-in-out",
	"-webkit-animation": "pulse 1000ms infinite",
});

document.styleSheets[0].insertRule("@-webkit-keyframes pulse { 0% { -webkit-transform: rotateX(5deg) rotateY(2deg); } 50% { -webkit-transform: rotateX(-5deg) rotateY(-2deg); } 100% { -webkit-transform: rotateX(5deg) rotateY(2deg); } }");
