/* Botswana */
/* by Ben Crowder and Chad Hansen */

var Draw = function(context, server, width, height) {
	this.c = context;
	this.server = server;
	this.ruleset = server.getRuleset();
	this.width = width;
	this.height = height;

	this.world = function() {
		// Clear background
		this.clear();

		// Draw grid
		this.grid();

		// Draw health
		this.health();

		// Draw obstacles
		this.obstacles();

		// Draw bots
		var bots = server.getBots();
		for (i in bots) {
			var bot = bots[i];

			if (bot.alive) {
				this.bot(bot.x, bot.y, bot.angle, bot.color, bot.radius, bot.health);
			}
		}

		// draw weapons
		var weapons = server.getWeapons();
		for (i in weapons) {
			var weapon = weapons[i];

			this.weapon(weapon.x, weapon.y, weapon.angle, weapon.type, weapon.owner);
		}

		this.particles();
	};

	this.clear = function() {
		this.c.clearRect(0, 0, this.width, this.height);
	};

	this.grid = function() {
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
	};

	this.obstacles = function() {
		this.c.save();
		this.c.strokeStyle = "#33383a";
		this.c.lineWidth = 3;
		this.c.fillStyle = "rgba(140, 160, 180, 0.15)";

		var obstacles = this.server.getObstacles();

		for (i in obstacles) {
			var obstacle = obstacles[i];

			this.c.beginPath();
			this.c.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
			this.c.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
		}

		this.c.restore();
	};

	this.bot = function(x, y, angle, color, radius, health) {
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

		// Now draw the turret
		this.c.beginPath();
		this.c.strokeStyle = "#000";
		this.c.rotate(angle);
		this.c.moveTo(0, 0);
		this.c.lineTo(radius + 3, 0);
		this.c.closePath();
		this.c.stroke();

		this.c.restore();
	};

	this.weapon = function(x, y, angle, type, owner) {
		this.c.save();
		this.c.translate(x, y);
		this.c.rotate(angle);

		switch (type) {
			case 'bullet':
				this.c.lineWidth = this.ruleset.properties.weapons.bullet.display.width;
				this.c.strokeStyle = this.ruleset.properties.bots.colors[this.server.getBotTeam(owner)];
				this.c.beginPath();
				this.c.moveTo(1, 0);
				this.c.lineTo(-this.ruleset.properties.weapons.bullet.display.length, 0);
				this.c.closePath();
				this.c.stroke();

				break;
		}

		this.c.restore();
	};

	this.particles = function() {
		particlesToRemove = [];

		this.c.save();
		this.c.globalCompositeOperation = "lighter";
		this.c.lineWidth = 2;

		var fxParticles = this.server.getParticles();

		for (i in fxParticles) {
			var particle = fxParticles[i];

			particle.life--;
			if (particle.life == 0) {
				// delete from array
				delete fxParticles[i];
			} else {
				// draw
				pos = this.server.helpers.calcVector(particle.x, particle.y, particle.angle, particle.speed);

				this.c.beginPath();
				this.c.strokeStyle = particle.color;
				this.c.moveTo(particle.x, particle.y);
				this.c.lineTo(pos.x, pos.y);
				this.c.globalAlpha = particle.life / 20;
				this.c.stroke();
				this.c.closePath();

				particle.x = pos.x;
				particle.y = pos.y;
			}
		}

		this.server.setParticles(fxParticles);

		this.c.restore();
	};

	this.health = function() {
		var teamHealth = this.ruleset.updateHealth();
		var numBots = this.ruleset.properties.botsPerTeam;

		var i = 0;
		for (var key in teamHealth) {
			var teamNum = i + 1;

			// 200 is the width of the percentage bar
			$("#status #bot" + teamNum + "status .health").css("width", (teamHealth[key] / (numBots * 100) * 200) + "px");

			i++;
		}
	};

	this.paused = function() {
		this.c.beginPath();
		this.c.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.c.fillRect(0, 0, this.width, this.height);
		this.c.fill();
		this.c.closePath();

		this.c.save();
		this.c.strokeStyle = "#fff";
		this.c.lineWidth = 15;
		this.c.beginPath();
		this.c.moveTo(487, 245);
		this.c.lineTo(487, 295);
		this.c.moveTo(513, 245);
		this.c.lineTo(513, 295);
		this.c.stroke();
		this.c.closePath();
		this.c.restore();
	};

	this.endgame = function(winner) {
		var bots = this.server.getBots();
		var team = undefined;
		for (i in bots) {
			if (bots[i].name == winner) team = bots[i];
		}
		if (team === undefined) return;

		// transparent black
		this.c.save();
		this.c.beginPath();
		this.c.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.c.fillRect(0, 0, this.width, this.height);
		this.c.closePath();

		// now do the champion banner
		this.c.beginPath();
		this.c.fillStyle = "rgba(0, 0, 0, 0.9)";
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
		this.c.fillStyle = "#fff";
		this.c.fillText("Champion: " + team.name, 70, 277);
		this.bot(900, 268, 3 * Math.PI / 2, team.color, team.radius, 100);
		this.c.closePath();
		this.c.restore();
	};
}
