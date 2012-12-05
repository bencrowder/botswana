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

ruleset.draw.bot = function(x, y, angle, color, radius, health) {
	this.c.save();
	this.c.translate(x, y);

	this.c.fillStyle = color;
	this.c.lineWidth = 4;

	// Draw filled/stroked circle
	var healthValue = parseInt(health * (255 / 100)); // hardcoded for now
	this.c.strokeStyle = "rgba(255, " + healthValue + ", " + healthValue + ", 1.0)";
	this.c.beginPath();
	this.c.arc(0, 0, radius, 0, Math.PI * 2, true);
	this.c.closePath();
	this.c.fill();
	this.c.stroke();

	this.c.rotate(angle);
	this.c.beginPath();
	this.c.arc(0, radius, radius / 4, 0, Math.PI * 2, true);
	this.c.closePath();
	this.c.fill();
	this.c.stroke();
	this.c.beginPath();
	this.c.arc(0, -radius, radius / 4, 0, Math.PI * 2, true);
	this.c.closePath();
	this.c.fill();
	this.c.stroke();

	// Now draw the turret
	this.c.strokeStyle = "#fff";
	this.c.fillStyle = "#000";
	this.c.beginPath();
	this.c.arc(radius / 2, 0, radius / 4, 0, Math.PI * 2, true);
	this.c.closePath();
	this.c.fill();
	this.c.stroke();

	this.c.restore();
};

ruleset.draw.clear = function() {
	this.c.fillStyle = "#ace3eb";
	this.c.fillRect(0, 0, this.width, this.height);
};

ruleset.draw.grid = function() {
	this.c.save();
	this.c.rotate(90);
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
	this.c.restore();
};

server.setRuleset(ruleset);

body = document.getElementsByTagName("body")[0];
body.style.backgroundColor = "#ace3eb";
