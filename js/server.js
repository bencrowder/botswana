var Server = function() {
	// public
	this.registerBot = function(bot) {
		// add bot to main array
		bots.push(bot);

		var botnum = bots.length;

		bot.color = bot_colors[bots.length - 1];

		// update the status bar
		$("#status #bot" + botnum + "status .name").html(bot.name);
		$("#status #bot" + botnum + "status .health").css("background-color", bot.color);
		$("#status #bot" + botnum + "status .width").css("width", bot.health * 2);
	}

	// private
	function startTournament() {
		bots_state = []

		// initial placement on map
		for (i in bots) {
			var bot = bots[i];

			botpos = getRandomPoint();
			bot.x = botpos.x;
			bot.y = botpos.y;
			bot.angle = Math.random() * Math.PI * 2;			// 0-360 degrees (in radians)
			bot.health = 100;

			// init the world state
			bot.state.world.width = WORLD_WIDTH;
			bot.state.world.height = WORLD_HEIGHT;

			// keep track of initial state
			bots_state.push({ "name": bot.name, "x": bot.x, "y": bot.y, "angle": bot.angle, "health": bot.health });

			bot.setup();
		}

		// update state for each bot
		for (i in bots) {
			bots[i].state.bots = bots_state;
		}

		// if we've got a pre-existing tournament, clear the interval
		if (tournamentIntervalId) {
			clearInterval(tournamentIntervalId);
		}
		
		// start the game
		tournamentIntervalId = setInterval(runGame, 25);
	}

	// public
	this.runGame = function() {
		if (!paused) {
			bots_state = [];
			for (j in bots) {
				bots_state.push({ "name": bots[j].name, "x": bots[j].x, "y": bots[j].y, "angle": bots[j].angle, "health": bots[j].health });
			}
			// run the bot
			for (i in bots) {
				var bot = bots[i];

				// update the bot's state (bots, bullets)
				bot.state.bots = bots_state;

				// now run the bot
				command = bot.run();

				// parse command here
				switch (command) {
					case "forward":
						var pos = calcVector(bot.x, bot.y, bot.angle, SPEED);
						bot.x = pos.x;
						bot.y = pos.y;
						break;
					case "backward":
						var pos = calcVector(bot.x, bot.y, bot.angle, -SPEED);
						bot.x = pos.x;
						bot.y = pos.y;
						break;
					case "left":
						bot.angle += ANGLE_STEP;
						break;
					case "right":
						bot.angle -= ANGLE_STEP;
						break;
				}

				bot.angle = normalizeAngle(bot.angle);
			}

			// do rule checking, collisions, update bullets, etc.

			// draw the arena
			drawWorld(context);
		}
	}

	function clearCanvas(context) {
		context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
	}

	function drawWorld(context) {
		// background stuff
		clearCanvas(context);
		drawGrid(context);
		drawHealth();
		// drawBuildings(context);

		// draw bots
		for (i in bots) {
			var bot = bots[i];

			drawBot(bot.x, bot.y, bot.angle, bot.color, context);
		}

		// draw bullets

		drawParticles(context);
	}

	function drawBot(x, y, angle, color, context) {
		var radius = 15;

		context.save();
		context.translate(x, y);

		context.fillStyle = color;
		context.lineWidth = 4;

		// draw filled/stroked circle
		context.beginPath();
		context.arc(0, 0, radius, 0, Math.PI * 2, true);
		context.closePath();
		context.fill();
		context.stroke();

		// now draw the turret
		context.rotate(angle);
		context.strokeStyle = "#fff";
		context.moveTo(0, 0);
		context.lineTo(20, 0);
		context.stroke();

		context.restore();
	}

	function drawBullet(x, y, angle, context) {
		context.save();
		context.translate(x, y);
		context.rotate(angle);

		context.strokeStyle = BULLET_COLOR;
		context.lineWidth = 2;

		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(10, 0);
		context.closePath();
		context.stroke();

		context.restore();
	}

	// draw the background grid
	function drawGrid(context) {
		context.beginPath();

		for (var x = 20; x < WORLD_WIDTH; x += 20) {
			context.moveTo(x, 0);
			context.lineTo(x, WORLD_HEIGHT);
		}

		for (var y = 20; y < WORLD_HEIGHT; y += 20) {
			context.moveTo(0, y);
			context.lineTo(WORLD_WIDTH, y);
		}

		context.strokeStyle = "#333";
		context.stroke();
	}

	function drawBuildings(context) {
		context.beginPath();
		context.strokeStyle = "#666";
		context.lineWidth = 3;
		context.fillStyle = "rgba(80, 200, 255, 0.2)";
		context.fillRect(240, 380, 40, 120);
		context.strokeRect(240, 380, 40, 120);
		context.fillRect(860, 140, 120, 60);
		context.strokeRect(860, 140, 120, 60);
	}

	function drawParticles(context) {
		particles_to_remove = [];

		context.save();
		context.lineWidth = 2;

		for (i in fxparticles) {
			var particle = fxparticles[i];

			particle.life--;
			if (particle.life == 0) {
				// delete from array
				delete fxparticles[i];
			} else {
				// draw
				pos = calcVector(particle.x, particle.y, particle.angle, particle.speed);

				context.beginPath();
				context.strokeStyle = particle.color;
				context.moveTo(particle.x, particle.y);
				context.lineTo(pos.x, pos.y);
				context.globalAlpha = particle.life / 20;
				context.stroke();
				context.closePath();

				particle.x = pos.x;
				particle.y = pos.y;
			}
		}

		context.restore();
	}

	function drawHealth() {
		for (i in bots) {
			var bot = bots[i];
			var botnum = parseInt(i) + 1;

			$("#status #bot" + botnum + "status .health").css("width", bot.health * 2);
		}
	}

	function drawPaused(context) {
		context.beginPath();
		context.fillStyle = "rgba(0, 0, 0, 0.3)";
		context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
		context.fill();
		context.closePath();

		context.save();
		context.strokeStyle = "#fff";
		context.lineWidth = 15;
		context.beginPath();
		context.moveTo(482, 250);
		context.lineTo(482, 300);
		context.moveTo(508, 250);
		context.lineTo(508, 300);
		context.stroke();
		context.closePath();
		context.restore();
	}
}
