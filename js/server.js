/* Botswana */
/* by Ben Crowder and Chad Hansen */

var Server = function() {
	var NUM_PLAYERS = 2;
	var WORLD_WIDTH = 1000;
	var WORLD_HEIGHT = 600;
	var ANGLE_STEP = 0.1;
	var SPEED = 2;
	var RADIUS = 15;

	var bot_colors = ["#e95050", "#589ebc"]; // red, blue

	var BULLET_COLOR = "#d2f783";
	var BULLET_SPEED = 5;
	var BULLET_STRENGTH = 5;
	var NUM_ALLOWED_BULLETS = 5;

	var tournamentIntervalId = 0;			 // private

	var bots = [];
	var fxparticles = [];
	var bullets = [];
	var obstacles = [];

	var paused = true;
	var gamestarted = false;
	var gameover = false;

	/*
	// load sound effects
	var sounds = [];
	sounds["collision"] = new Audio("audio/collision.wav");
	sounds["hitbot"] = new Audio("audio/hitbot.wav");
	sounds["hitobstacle"] = new Audio("audio/hitobstacle.wav");
	sounds["laser"] = new Audio("audio/laser.wav");
	*/

	this.setContext = function(context) {
		this.context = context;
	}

	this.loadScripts = function() {
		// clear things out
		bots = [];
		bullets = [];
		obstacles = [];
		fxparticles = [];
		paused = false;
		gamestarted = false;
		gameover = false;

		// load the scripts
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

		generateObstacles();

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
		gamestarted = true;

		// we use the t variable because otherwise we lose scope
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

						if (!this.collisionBoundary(pos) && !this.collisionBotObjects(pos)) {
							bot.x = pos.x;
							bot.y = pos.y;
							bot.collision = false;
						} else {
							bot.collision = true;
							//playSound("collision");
						}
						break;

					case "backward":
						var pos = calcVector(bot.x, bot.y, bot.angle, -SPEED);
						pos.radius = RADIUS;

						if (!this.collisionBoundary(pos) && !this.collisionBotObjects(pos)) {
							bot.x = pos.x;
							bot.y = pos.y;
							bot.collision = false;
						} else {
							bot.collision = true;
							//playSound("collision");
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
							//playSound("laser");
							bot.bullets -= 1;
							var pos = calcVector(bot.x, bot.y, bot.angle, RADIUS);
							bullets.push({ "x": pos.x, "y": pos.y, "angle": bot.angle, "owner": bot.name});
							if (bot.bullets == 0) {
								bot.canShoot = false;
							}
						}
						break;

					case "wait":
						break;
				}

				bot.angle = normalizeAngle(bot.angle);
			}

			// do rule checking, collisions, update bullets, etc.
			updateBullets(this.context);

			// draw the arena
			if (!gameover) {
				this.drawWorld(this.context);
			}
		}
	}

	function generateObstacles() {
		var num_obstacles = (Math.random() * 3) + 2;

		for (i=0; i<num_obstacles; i++) {
			clear = false;
			while (!clear) {
				var p = server.getRandomPoint();
				var width = (Math.random() * 80) + 25;
				var height = (Math.random() * 80) + 25;

				// check boundaries and adjust if necessary
				if (p.x + width > (WORLD_WIDTH - 50)) {
					width = WORLD_WIDTH - 50 - p.x;
				}
				if (p.y + height > (WORLD_HEIGHT - 50)) {
					height = WORLD_HEIGHT - 50 - p.y;
				}

				// make sure we're not overlapping existing obstacles
				if (obstacles.length > 0) {
					var pos = { "x1": p.x, "y1": p.y, "x2": p.x + width, "y2": p.y + height };
					var overlaps = false;

					for (j in obstacles) {
						var o = obstacles[j];
						var o_pos = { "x1": o.x, "y1": o.y, "x2": o.x + o.width, "y2": o.y + o.height };
					
						if (pos.x1 <= o_pos.x2 && pos.x2 >= o_pos.x1 &&
							pos.y1 <= o_pos.y2 && pos.y2 >= o_pos.y1) {
							overlaps = true;
							break;
						}
					}

					if (overlaps) {
						clear = false;
					} else {
						clear = true;
					}
				} else {
					// there aren't any other obstacles yet
					clear = true;
				}
			}

			obstacles.push({ "x": p.x, "y": p.y, "width": width, "height": height });
		}
	}

	function updateBullets(context) {
		for (i in bullets) {
			var bullet = bullets[i];
			var pos = calcVector(bullet.x, bullet.y, bullet.angle, BULLET_SPEED);

			var collision_state = server.collisionBulletObjects(pos);

			if (!server.collisionBoundary(pos) && !collision_state.collision) {
				// no collisions, move bullet forward
				bullet.x = pos.x;
				bullet.y = pos.y;
			} else {
				// hit!
				switch (collision_state.type) {
					case "bot":
						//playSound("hitbot");

						// decrease the health of the hit bot
						bot = bots[collision_state.the_object];
						bot.health -= BULLET_STRENGTH;
						bot.hitByBullet = true;	// bot is responsible to unset this

						// check to see if the bot has died
						if (bot.health <= 0) {
							paused = true;
							gameover = true;

							// figure out a more elegant way to do this
							if (collision_state.the_object == 0) {
								winner = 1;
							} else {
								winner = 0;
							}

							drawHealth();
							drawEndgame(winner, context);
							break;
						}

						// create a red explosion
						server.createParticleExplosion(pos.x, pos.y, 16, 20, 5, 20, "#db4e22");
						break;
					case "obstacle":
						//playSound("hitobstacle");

						// create a blue explosion
						server.createParticleExplosion(pos.x, pos.y, 16, 20, 5, 20, "#96e0ff");
						break;
				}

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
		drawObstacles(context);

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

	function drawObstacles(context) {
		context.save();
		context.strokeStyle = "#666";
		context.lineWidth = 3;
		context.fillStyle = "rgba(80, 200, 255, 0.2)";

		for (i in obstacles) {
			var obst = obstacles[i];
			context.beginPath();
			context.fillRect(obst.x, obst.y, obst.width, obst.height);
			context.strokeRect(obst.x, obst.y, obst.width, obst.height);
		}

		context.restore();
	}

	function drawBot(x, y, angle, color, context) {
		var radius = RADIUS;

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

	function drawEndgame(winner, context) {
		// transparent black
		context.save();
		context.beginPath();
		context.fillStyle = "rgba(0, 0, 0, 0.3)";
		context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
		context.closePath();

		// now do the champion banner
		context.beginPath();
		context.fillStyle = "rgba(0, 0, 0, 0.9)";
		context.fillRect(0, 220, WORLD_WIDTH, 100);
		context.moveTo(0, 220);
		context.lineTo(WORLD_WIDTH, 220);
		context.moveTo(0, 320);
		context.lineTo(WORLD_WIDTH, 320);
		context.strokeStyle = bots[winner].color;
		context.lineWidth = 5;
		context.stroke();
		context.closePath();
		context.restore();

		// text and bot
		context.save();
		context.font = "bold 28px 'Lucida Grande', Helvetica, Arial, sans-serif";
		context.fillStyle = "#fff";
		context.fillText("Champion: " + bots[winner].name, 400, 277);
		drawBot(360, 268, 3 * Math.PI / 2, bots[winner].color, context);
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
		if (gameover) return;
		if (!gamestarted) return;

		if (paused) { 
			paused = false;
			$("audio#mainsong")[0].play();
		} else {
			paused = true;
			drawPaused(this.context);
			$("audio#mainsong")[0].pause();
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

	this.collisionBots = function(botA, botB) {
		var rtnBool = false;
		dx = botB.x - botA.x;
		dy = botB.y - botA.y;
		dist = Math.sqrt(dx * dx + dy * dy);
		if (2 * RADIUS > dist) {
			rtnBool = true;
		}
		return rtnBool;
	}

	this.collisionObstacle = function(point, obs) {
		var rtnBool = false;
		if (point.radius != undefined) { // we have a bot
			rightX = Math.pow(obs.x + obs.width - point.x, 2);
			leftX = Math.pow(obs.x - point.x, 2);
			bottomY = Math.pow(obs.y + obs.height - point.y, 2);
			topY = Math.pow(obs.y - point.y, 2);

			if (Math.sqrt(rightX + bottomY) < point.radius) {
				rtnBool = true;
			} else if (Math.sqrt(rightX + topY) < point.radius) {
				rtnBool = true;
			} else if (Math.sqrt(leftX + topY) < point.radius) {
				rtnBool = true;
			} else if (Math.sqrt(leftX + bottomY) < point.radius) {
				rtnBool = true;
			} else { }
		} else {
			if (point.x >= obs.x && point.x <= obs.x + obs.width && point.y >= obs.y && point.y <= obs.y + obs.height) {
				rtnBool = true;
			}
		}
		return rtnBool;
	}

	this.collisionBot = function(bot, point) {
		var rtnBool = false;
		dx = bot.x - point.x;
		dy = bot.y - point.y;
		dist = Math.sqrt(dx * dx + dy * dy);
		if (RADIUS > dist) { 
			rtnBool = true;
		}
		return rtnBool;
	}

	this.collisionBulletObjects = function(bullet) {
		var state = { "collision": false };

		for (i in bots) {
			if (this.collisionBot(bots[i], bullet)) {
				state.collision = true;
				state.type = "bot";
				state.the_object = i;
			}
		}

		if (!state.collision) {
			for (i in obstacles) {
				if (this.collisionObstacle(bullet, obstacles[i])) {
					state.collision = true;
					state.type = "obstacle";
					state.the_object = i;
				}
			}
		}

		return state;
	}

	this.collisionBotObjects = function(bot) {
		var rtnBool = false;

		for (i in bots) {
			if (bots[i].name != bot.name) {
				if (this.collisionBots(bot, bots[i])) {
					/*rtnBool = true;*/
				}
			}
		}

		if (!rtnBool) {
			for (i in obstacles) {
				if (this.collisionObstacle(bot, obstacles[i])) {
					rtnBool = true;
				}
			}
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

	/*
	function playSound(type) {
		sounds[type].play();
	}
	*/
}
