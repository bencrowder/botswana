/* Test ruleset, used for development */

var ruleset = new Ruleset(server);

ruleset.properties.name = "test";

ruleset.properties.botsPerTeam = 4;

ruleset.properties.bots = {
	'angleStep': 0.1,
	'speed': 5,
	'radius': 30,
	'radiusMargin': 0,
	'colors': [ "#ebff00", "#946fbb" ]
};

ruleset.properties.weapons.bullet.speed = 8;
ruleset.properties.weapons.bullet.strength = 3;
ruleset.properties.weapons.bullet.waitTime = 15;
ruleset.properties.weapons.bullet.numAllowed = 3;
ruleset.properties.weapons.bullet.display.length = 8;

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

// Replace the grid with background circles
ruleset.draw.gridItems = [];
for (var x=0; x<20; x++) {
	ruleset.draw.gridItems.push({ 'x': Math.random() * ruleset.draw.width, 'y': Math.random() * ruleset.draw.height, 'radius': Math.random() * 30 + 10 });
}

ruleset.draw.grid = function() {
	this.c.save();

	this.c.strokeStyle = "rgba(255, 255, 255, 0.04)";
	this.c.lineWidth = "15";
	this.c.fillStyle = "rgba(255, 255, 255, 0.02)";
	this.c.globalCompositeOperation = "lighter";

	for (var x=0; x<20; x++) {
		var circle = this.gridItems[x];

		this.c.beginPath();
		this.c.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, true);
		this.c.closePath();
		this.c.fill();
		this.c.stroke();
	}

	this.c.restore();
};

ruleset.draw.endgame = function(winner) {
	var bots = this.server.getBots();
	var team = undefined;
	for (i in bots) {
		if (bots[i].name == winner) team = bots[i];
	}
	if (team === undefined) return;

	// transparent white
	this.c.save();
	this.c.beginPath();
	this.c.fillStyle = "rgba(255, 255, 255, 0.3)";
	this.c.fillRect(0, 0, this.width, this.height);
	this.c.closePath();

	// now do the champion banner
	this.c.beginPath();
	this.c.fillStyle = "rgba(255, 255, 255, 0.9)";
	this.c.fillRect(0, 220, this.width, 100);
	this.c.moveTo(0, 220);
	this.c.lineTo(this.width, 220);
	this.c.moveTo(0, 320);
	this.c.lineTo(this.width, 320);
	this.c.strokeStyle = team.color; // TODO: fix
	this.c.lineWidth = 5;
	this.c.stroke();
	this.c.closePath();
	this.c.restore();

	// text and bot
	this.c.save();
	this.c.font = "bold 28px 'Lucida Grande', Helvetica, Arial, sans-serif";
	this.c.fillStyle = "#7bc1c7";
	this.c.fillText("Champion: " + team.name, 70, 277);
	this.bot(900, 268, 3 * Math.PI / 2, team.color, team.radius, 100);
	this.c.closePath();
	this.c.restore();
};

ruleset.draw.particle = function(particle, newPos) {
	this.c.beginPath();
	this.c.fillStyle = particle.color;
	this.c.arc(particle.x, particle.y, particle.speed, 0, Math.PI * 2, true);
	this.c.globalAlpha = particle.life / 20;
	this.c.fill();
	this.c.closePath();
}

ruleset.draw.weapon = function(x, y, angle, type, owner) {
	this.c.save();
	this.c.translate(x, y);
	this.c.rotate(angle);

	switch (type) {
		case 'bullet':
			this.c.fillStyle = this.ruleset.properties.bots.colors[this.server.getBotTeam(owner)];
			this.c.beginPath();
			this.c.arc(0, 0, this.ruleset.properties.weapons.bullet.display.length, 0, Math.PI * 2, true);
			this.c.closePath();
			this.c.fill();

			break;
	}

	this.c.restore();
};

server.setRuleset(ruleset);

$("body").css("background", "#ace3eb");

$("header").css("background", "#7bc1c7");
$("header").css("border-bottom-color", "#56a3a3");
$("header input[type=text]").css("background", "#5cafb6");
$("header input[type=text]").css("border-color", "#5cafb6");
$("header input[type=text]").css("color", "#fff");
$("header label").css("text-shadow", "none");
$("header label").css("color", "#fff");
$("header .ruleset label").css("color", "#fff");

$("#status").css("border-color", "#cffdff");
$("#status").css("background", "#aee8ff");
$("#status .name").css("color", "#0facdd");
$(".healthbar").css("background", "#cffdff");

$("#wrapper").css("border-color", "#cffdff");
