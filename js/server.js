/* Botswana */
/* by Ben Crowder and Chad Hansen */

var Server = function() {
	var ruleset = new Ruleset(this);
	var props = ruleset.properties;			// shorthand access

	var tournamentIntervalId = 0;			// private

	/* Object lists */

	var bots = [];
	var serverBots = [];
	var fxParticles = [];
	var bullets = [];
	var obstacles = [];

	/* Game engine properties */

	var paused = true;
	var gameStarted = false;
	var gameOver = false;
	var clicks = 0;


	/* Set the canvas context */
	/* -------------------------------------------------- */

	this.setContext = function(context) {
		this.context = context;
	}


	/* Load the user scripts */
	/* -------------------------------------------------- */

	this.loadScripts = function() {
		// clear things out
		paused = false;
		gameStarted = false;
		gameOver = false;
		clicks = 0;

		bots = [];
		serverBots = [];
		bullets = [];
		obstacles = [];
		fxParticles = [];

		// Reset everything
		ruleset.resetGame();
		
		// Counter to keep track of how many are left to load, since we do things asynchronously
		var scriptsUnloaded = props.numTeams;

		// Load the scripts, one for each team
		for (var i=1; i<=props.numTeams; i++) {
			var url = $("#bot" + i + "url").val();

			// Load the script and execute it
			$.ajax({
				url: url,
				dataType: 'script',

				error: function() {
					// Find the bot with the bad URL and flag it
					for (var i=1; i<=props.numTeams; i++) {
						if ($("#bot" + i + "url").val() == url) {
							$("#bot" + i + "url").addClass("invalid_url");
						}
					}
				},

				success: function() {
					scriptsUnloaded--;

					// Start the tournament once all these are loaded
					if (scriptsUnloaded == 0) {
						server.startTournament();
					}
				}
			});
		}
	}


	/* Register a bot script */
	/* -------------------------------------------------- */

	this.registerBotScript = function(team) {
		// Team #
		var teamNum = bots.length + 1;

		// Call the ruleset register function
		var botList = ruleset.registerBotScript(teamNum, team);

		// Add all returned bots to the main array
		for (var i=0; i<botList.length; i++) {
			bots.push(botList[i]);
		}

		// Update the status bar
		// TODO: figure out what to do now that we have teams
		$("#status #bot" + teamNum + "status .name").html(team.name);
		$("#status #bot" + teamNum + "status .health").css("background-color", team.color);
		$("#status #bot" + teamNum + "status .width").css("width", team.health * 2);
	}


	/* Start the game */
	/* -------------------------------------------------- */

	this.startTournament = function() {
		// Remove invalid URL flags (if any)
		$("header input").removeClass("invalid_url");

		// Reset state
		tempBotsState = [];
		serverBots = [];

		// Generate obstacles
		obstacles = ruleset.generateObstacles();

		// Loop through each bot to initialize things
		for (var i=0; i<bots.length; i++) {
			var bot = bots[i];

			// Initialize the bot
			ruleset.initializeBot(bot, i);

			// Set initial placement on map
			ruleset.setInitialPlacement(bot);

			// Init the world state for the bot
			bot.state.world.width = props.world.width;
			bot.state.world.height = props.world.height;

			// Push the bot's state to the server list
			tempBotsState.push({ "id": i, "name": bot.name, "x": bot.x, "y": bot.y, "angle": bot.angle, "health": bot.health });

			// Call the bot's setup function
			bot.setup();
		}

		// Loop through each bot again to give state to all bots
		for (var i=0; i<bots.length; i++) {
			bots[i].state.bots = tempBotsState;

			// Add obstacles to state
			bots[i].state.obstacles = [];
			for (j in obstacles) {
				var o = obstacles[j];
				bots[i].state.obstacles.push({ "x": o.x, "y": o.y, "width": o.width, "height": o.height });
			}

			// Make a copy of the bot for server usage
			tempBot = new Bot(bots[i].name);
			tempBot.copy(bots[i]);
			serverBots.push(tempBot);
		}

		// If we've got a pre-existing tournament, clear the interval
		if (tournamentIntervalId) {
			clearInterval(tournamentIntervalId);
		}
		
		// Start the game
		gameStarted = true;

		// We use the t variable because otherwise we lose scope
		var t = this;
		tournamentIntervalId = setInterval(function() {
			t.runGame();
		}, 25);
	}


	/* Game loop */
	/* -------------------------------------------------- */

	this.runGame = function() {
		// Up the click counter
		this.clicks++;

		if (gameStarted && !paused) {
			// Do rule checking, collisions, update bullets, etc.
			updateBullets(this.context);

			// get current state of bots
			botsState = [];
			for (j in serverBots) {
				botsState.push({ "id": j, "name": serverBots[j].name, "x": serverBots[j].x, "y": serverBots[j].y, "angle": serverBots[j].angle, "health": serverBots[j].health });
			}

			// get current state of obstacles
			obstacles_state = [];
			for (i in obstacles) {
				var o = obstacles[i];

				obstacles_state.push({ "x": o.x, "y": o.y, "width": o.width, "height": o.height });
			}

			// get current state of bullets
			bullets_state = [];
			for (i in bullets) {
				var b = bullets[i];

				bullets_state.push({ "x": b.x, "y": b.y, "angle": b.angle, "owner": b.owner });
			}

			// run the bot
			for (b in serverBots) {
				var bot = serverBots[b];
				bot.waitFire--;
				if (bot.waitFire <= 0) {
					bot.waitFire = 0;
					bot.canShoot = true;
				}

				// update the bot's state (TODO: make copies instead of passing reference to the arrays)
				bots[b].state.bots = botsState;
				bots[b].state.obstacles = obstacles_state;
				bots[b].state.bullets = bullets_state;

				// now run the bot
				command = bots[b].run();

				// Parse the command
				ruleset.parseCommand(command, bot);

				bot.angle = normalizeAngle(bot.angle);
				// copy the server bot data to the bots
				bots[b].copy(bot);
			}


			// draw the arena
			if (!gameOver) {
				this.drawWorld(this.context);
			}
		}
	}

	function updateBullets(context) {
		// Go through all the bots and reset their hitByBullet flag
		for (i in serverBots) {
			serverBots[i].hitByBullet = false;
		}

		// Go through each bullet to see if it hit anything
		for (i in bullets) {
			var bullet = bullets[i];
			var pos = calcVector(bullet.x, bullet.y, bullet.angle, props.ammo.bullets.speed);

			var collision_state = server.collisionBulletObjects(pos);

			if (!server.collisionBoundary(pos) && !collision_state.collision) {
				// no collisions, move bullet forward
				bullet.collision = false;
				bullet.x = pos.x;
				bullet.y = pos.y;
			} else {
				// hit!
				bullet.collision = true;
				switch (collision_state.type) {
					case "bot":
						//playSound("hitbot");

						// decrease the health of the hit bot
						bot = serverBots[collision_state.the_object];
						bot.health -= props.ammo.bullets.strength;
						bot.hitByBullet = true;	// bot is responsible to unset this

						// check to see if the bot has died
						if (bot.health <= 0) {
							paused = true;
							gameOver = true;

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
						
					default: // collision with world boundary
						server.createParticleExplosion(pos.x, pos.y, 16, 20, 5, 20, "#96e0ff");
						break;
				}

				bot = server.getBotByID(bullet.owner);
				if (bot.bullets < props.ammo.bullets.numAllowed) {
					bot.bullets += 1;
				}
				bot.canShoot = true;
			}
		}
		// removed bullets that have collided with something.
		newBullets = [];
		for (i in bullets) {
			if (!bullets[i].collision) {
				newBullets.push(bullets[i]);
			}
		}
		bullets = [];
		bullets = newBullets;
	}

	this.drawWorld = function(context) {
		this.context = context;

		// background stuff
		clearCanvas(context);
		drawGrid(context);
		drawHealth();
		drawObstacles(context);

		// draw bots
		for (i in serverBots) {
			var bot = serverBots[i];

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
		context.clearRect(0, 0, props.world.width, props.world.height);
	}

	function drawGrid(context) {
		context.beginPath();

		for (var x = 20; x < props.world.width; x += 20) {
			context.moveTo(x, 0);
			context.lineTo(x, props.world.height);
		}

		for (var y = 20; y < props.world.height; y += 20) {
			context.moveTo(0, y);
			context.lineTo(props.world.width, y);
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
		var radius = props.bots.radius;

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

		context.strokeStyle = props.ammo.bullets.color;
		context.lineWidth = 2;

		context.beginPath();
		context.moveTo(1, 0);
		context.lineTo(-9, 0);
		context.closePath();
		context.stroke();

		context.restore();
	}

	function drawParticles(context) {
		particles_to_remove = [];

		context.save();
		context.lineWidth = 2;

		for (i in fxParticles) {
			var particle = fxParticles[i];

			particle.life--;
			if (particle.life == 0) {
				// delete from array
				delete fxParticles[i];
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
		for (i in serverBots) {
			var bot = serverBots[i];
			var botnum = parseInt(i) + 1;

			$("#status #bot" + botnum + "status .health").css("width", bot.health * 2);
		}
	}

	function drawPaused(context) {
		context.beginPath();
		context.fillStyle = "rgba(0, 0, 0, 0.3)";
		context.fillRect(0, 0, props.world.width, props.world.height);
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
		context.fillRect(0, 0, props.world.width, props.world.height);
		context.closePath();

		// now do the champion banner
		context.beginPath();
		context.fillStyle = "rgba(0, 0, 0, 0.9)";
		context.fillRect(0, 220, props.world.width, 100);
		context.moveTo(0, 220);
		context.lineTo(props.world.width, 220);
		context.moveTo(0, 320);
		context.lineTo(props.world.width, 320);
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

			// add particle to global fxParticles array
			fxParticles.push({ "x": pos.x, "y": pos.y, "angle": angle, "speed": speed, "life": life, "color": color });

			angle += step;
		}
	}

	this.togglePause = function() {
		if (gameOver) return;
		if (!gameStarted) return;

		if (paused) { 
			paused = false;
		//	$("audio#mainsong")[0].play();
		} else {
			paused = true;
			drawPaused(this.context);
		//	$("audio#mainsong")[0].pause();
		}
	}


	/* Get a random point in the world*/
	/* -------------------------------------------------- */

	this.getRandomPoint = function() {
		var pos = {};
		var padding = 100;
		pos.x = (Math.random() * (props.world.width - (padding * 2))) + padding;
		pos.y = (Math.random() * (props.world.height - (padding * 2))) + padding;

		return pos;
	}

	this.collisionBoundary = function(point) {
		var rtnBool = false;

		if (point.radius != undefined) {
			right = point.x + point.radius;
			left = point.x - point.radius;
			bottom = point.y + point.radius;
			topp = point.y - point.radius;

			if (left <= 0 || topp <= 0 || right >= props.world.width || bottom >= props.world.height) {
				rtnBool = true;
			}
		} else {
			newX = point.x;
			newY = point.y;

			if (newX <= 0 || newY <= 0 || newX >= props.world.width || newY >= props.world.height) {
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
		if (2 * props.bots.radius > dist) {
			rtnBool = true;
		}
		return rtnBool;
	}

	this.collisionObstacle = function(point, obs) {
		var rtnBool = false;
		if (point.radius != undefined) { // we have a bot
			if (point.x >= obs.x - point.radius && point.x <= obs.x + point.radius + obs.width && point.y >= obs.y - point.radius && point.y <= obs.y + point.radius + obs.height) {
				rtnBool = true;
			}
		} else { // single point - bullet
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
		if (props.bots.radius > dist) { 
			rtnBool = true;
		}
		return rtnBool;
	}

	this.collisionBulletObjects = function(bullet) {
		var state = { "collision": false };

		for (i in serverBots) {
			if (this.collisionBot(serverBots[i], bullet)) {
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

		for (i in serverBots) {
			if (serverBots[i].id != bot.id) {
				if (this.collisionBots(bot, serverBots[i])) {
					rtnBool = true;
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

	this.getBotByID = function(id) {
		return serverBots[id];
	}

	// these functions need to be modified to return copies of the arrays
	// instead of the actual objects (which can then be modified)

	this.getBots = function() {
		return serverBots.slice(0);
	}

	this.getParticles = function() {
		return fxParticles.slice(0);
	}

	this.getBullets = function() {
		return bullets.slice(0);
	}

	this.getObstacles = function() {
		return obstacles.slice(0);
	}

	this.addBullet = function(bullet) {
		bullets.push(bullet);
	}

	/*
	function playSound(type) {
		sounds[type].play();
	}
	*/

	this.helpers = {};

	this.helpers.normalizeAngle = function(theta) {
		return theta % (2 * Math.PI);
	};

	this.helpers.distanceToPoint = function(x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;

		return Math.sqrt(dx * dx + dy * dy);
	};

	this.helpers.angleToPoint = function(x1, y1, x2, y2) {
		return Math.atan2(y2 - y1, x2 - x1);
	};

	this.helpers.calcVector = function(x, y, angle, magnitude) {
		var pos = {};
		pos.x = x + magnitude * Math.cos(angle);
		pos.y = y + magnitude * Math.sin(angle);

		return pos;
	};
}
