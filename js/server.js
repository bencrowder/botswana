/* Botswana */
/* by Ben Crowder and Chad Hansen */

var Server = function() {
	var NUM_PLAYERS = 2;
	var WORLD_WIDTH = 1000;
	var WORLD_HEIGHT = 600;
	var ANGLE_STEP = 0.1;
	var SPEED = 2;
	var BULLET_SPEED = 5;
	var RADIUS = 15;
	var NUM_ALLOWED_BULLETS = 5;

	var bot_colors = ["#e95050", "#589ebc"]; // red, blue
	var BULLET_COLOR = "#d2f783";

	var tournamentIntervalId = 0;			 // private

	var bots = [];
	var fxparticles = [];
	var bullets = [];

	var paused = false;

	this.setContext = function(context) {
		this.context = context;
	}

	this.loadScripts = function() {
		// load the scripts
		bots = [];
		var botUrls = [];
		var botsUnloaded = 2;	// counter to keep track of how many are left to load

		for (var i=1; i<=NUM_PLAYERS; i++) {
			var url = $("#bot" + i + "url").val();

			// add to the array
			botUrls.push(url);

			// get the file and execute it
			$.getScript(url, function() {
				botsUnloaded = botsUnloaded - 1;

				// start the tournament once all these are loaded
				if (botsUnloaded == 0) {
					server.startTournament();
				}
			});
		}
	}

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

	// public
	this.startTournament = function() {
		bots_state = []

		// initial placement on map
		for (i in bots) {
			var bot = bots[i];

			botpos = this.getRandomPoint();
			bot.x = botpos.x;
			bot.y = botpos.y;
			bot.angle = Math.random() * Math.PI * 2;			// 0-360 degrees (in radians)
			bot.health = 100;
			bot.canShoot = true;
			bot.bullets = NUM_ALLOWED_BULLETS;

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
		// note: we have to pass in the server because this function gets called 
		// outside of the context of the Server class
		var t = this;
		tournamentIntervalId = setInterval(function() {
				t.runGame();
			}, 25);
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
						pos.radius = RADIUS;

						if (!this.collisionBoundary(pos) && !this.collisionObjects(pos)) {
							bot.x = pos.x;
							bot.y = pos.y;
						}
						break;

					case "backward":
						var pos = calcVector(bot.x, bot.y, bot.angle, -SPEED);
						pos.radius = RADIUS;

						if (!this.collisionBoundary(pos) && !this.collisionObjects(pos)) {
							bot.x = pos.x;
							bot.y = pos.y;
						}
						break;

					case "left":
						bot.angle += ANGLE_STEP;
						break;

					case "right":
						bot.angle -= ANGLE_STEP;
						break;

					case "fire":
						if (bot.bullets > 0 && bot.canShoot) {
							bot.bullets -= 1;
							bullets.push({ "x": bot.x, "y": bot.y, "angle": bot.angle, "owner": bot.name});
							if (bot.bullets == 0) {
								bot.canShoot = false;
							}
						}
						break;
				}

				bot.angle = normalizeAngle(bot.angle);
			}

			// do rule checking, collisions, update bullets, etc.
			updateBullets();

			// draw the arena
			this.drawWorld(this.context);
		}
	}

	function updateBullets() {
		for (i in bullets) {
			var bullet = bullets[i];
			var pos = calcVector(bullet.x, bullet.y, bullet.angle, BULLET_SPEED);

			if (!server.collisionBoundary(pos)) {
				bullet.x = pos.x;
				bullet.y = pos.y;
			} else {
				bot = server.getBotByName(bullet.owner);
				bot.bullets += 1;
				bot.canShoot = true;
				bullets.splice(i, 1);
			}
		}
	}

	this.drawWorld = function(context) {
		this.context = context;

		// background stuff
		clearCanvas(context);
		drawGrid(context);
		drawHealth();
		// drawBuildings();

		// draw bots
		for (i in bots) {
			var bot = bots[i];

			drawBot(bot.x, bot.y, bot.angle, bot.color, context);
		}

		// draw bullets
		for (i in bullets) {
			var bullet = bullets[i];

			drawBullet(bullet.x, bullet.y, bullet.angle, context);
		}

		drawParticles(context);
	}

	function clearCanvas(context) {
		context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
	}

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

	// creates a circular particle explosion at the specified point
	this.createParticleExplosion = function(x, y, num_points, distance, speed, life, color) {
		var angle = 0;
		var step = (2 * Math.PI) / num_points;

		for (i=0; i<num_points; i++) {
			var pos = calcVector(x, y, angle, distance);

			// add particle to global fxparticles array
			fxparticles.push({ "x": pos.x, "y": pos.y, "angle": angle, "speed": speed, "life": life, "color": color });

			angle += step;
		}
	}

	this.togglePause = function() {
		if (paused) { 
			paused = false;
		} else {
			paused = true;
			drawPaused(this.context);
		}
	}

	this.getRandomPoint = function() {
		var pos = {};
		var padding = 100;
		pos.x = (Math.random() * (WORLD_WIDTH - (padding * 2))) + padding;
		pos.y = (Math.random() * (WORLD_HEIGHT - (padding * 2))) + padding;

		return pos;
	}

	this.collisionBoundary = function(point) {
		var rtnBool = false;

		if (point.radius != undefined) {
			right = point.x + point.radius;
			left = point.x - point.radius;
			bottom = point.y + point.radius;
			topp = point.y - point.radius;

			if (left <= 0 || topp <= 0 || right >= WORLD_WIDTH || bottom >= WORLD_HEIGHT) {
				rtnBool = true;
			}
		} else {
			newX = point.x;
			newY = point.y;

			if (newX <= 0 || newY <= 0 || newX >= WORLD_WIDTH || newY >= WORLD_HEIGHT) {
				rtnBool = true;
			}	
		}

		return rtnBool;
	}

	this.collisionObjects = function(point) {
		var rtnBool = false;

		if (point.radius != undefined) {
		} else {
		}

		return rtnBool;
	}

	this.getBotByName = function(name) {
		for (i in bots) {
			if (bots[i].name == name) {
				return bots[i];
			}
		}
		return undefined;
	}
}
