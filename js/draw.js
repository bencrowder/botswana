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

			this.bot(bot.x, bot.y, bot.angle, bot.color, bot.radius);
		}

		// draw weapons
		var weapons = server.getWeapons();
		for (i in weapons) {
			var weapon = weapons[i];

			this.weapon(weapon.x, weapon.y, weapon.angle, weapon.type);
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

	this.bot = function(x, y, angle, color, radius) {
		this.c.save();
		this.c.translate(x, y);

		this.c.fillStyle = color;
		this.c.strokeStyle = "#fff";
		this.c.lineWidth = 4;

		// Draw filled/stroked circle
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
		this.c.lineTo(radius + 5, 0);
		this.c.closePath();
		this.c.stroke();

		this.c.restore();
	};

	this.weapon = function(x, y, angle, type) {
		this.c.save();
		this.c.globalCompositeOperation = "lighter";
		this.c.translate(x, y);
		this.c.rotate(angle);

		switch (type) {
			case 'bullet':
				this.c.lineWidth = 2;
				// TODO: abstract this into ruleset

				this.c.strokeStyle = this.ruleset.properties.weapons.bullet.color;
				this.c.beginPath();
				this.c.moveTo(1, 0);
				this.c.lineTo(-6, 0);
				this.c.closePath();
				this.c.stroke();

				this.c.strokeStyle = this.ruleset.properties.weapons.bullet.color2;
				this.c.beginPath();
				this.c.moveTo(-6, 0);
				this.c.lineTo(-9, 0);
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
				pos = calcVector(particle.x, particle.y, particle.angle, particle.speed);

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
		this.c.moveTo(482, 250);
		this.c.lineTo(482, 300);
		this.c.moveTo(508, 250);
		this.c.lineTo(508, 300);
		this.c.stroke();
		this.c.closePath();
		this.c.restore();
	};

	this.endgame = function(winner) {
		var bots = this.server.getBots();

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
		this.c.strokeStyle = bots[winner].color; // TODO: fix
		this.c.lineWidth = 5;
		this.c.stroke();
		this.c.closePath();
		this.c.restore();

		// text and bot
		this.c.save();
		this.c.font = "bold 28px 'Lucida Grande', Helvetica, Arial, sans-serif";
		this.c.fillStyle = "#fff";
		this.c.fillText("Champion: " + bots[winner].name, 70, 277);
		this.bot(900, 268, 3 * Math.PI / 2, bots[winner].color, bots[winner].radius);
		this.c.closePath();
		this.c.restore();
	};
}
