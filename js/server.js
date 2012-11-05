/* Botswana */
/* by Ben Crowder and Chad Hansen */

var Server = function() {
	var ruleset = new Ruleset(this);
	var props = ruleset.properties;			// shorthand access

	var tournamentIntervalId = 0;			// private

	/* Object lists */

	var teams = [];							// teams
	var bots = [];							// bots
	var serverBots = [];					// server copy of bot info
	var weapons = [];						// damage-causing objects (bullets, mines, etc.)
	var items = [];							// non-damage-causing objects (powerups, etc.)
	var obstacles = [];						// obstacles (land)
	var fxParticles = [];					// effects

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

		teams = [];
		bots = [];
		serverBots = [];
		weapons = [];
		items = [];
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
		var teamNum = teams.length + 1;

		// Add this script
		teams.push(team);

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
		state = {};
		state.world = props.world;
		state.bots = [];
		state.obstacles = [];
		state.weapons = [];
		state.items = [];

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

			// Push the bot's state to the server list
			state.bots.push({ "id": i, "name": bot.name, "x": bot.x, "y": bot.y, "angle": bot.angle, "health": bot.health });

			// Call the bot's setup function
			bot.setup();
		}

		// Add obstacles to state
		for (i in obstacles) {
			var o = obstacles[i];
			state.obstacles.push({ "x": o.x, "y": o.y, "width": o.width, "height": o.height });
		}

		// Loop through each bot again to give state to all bots
		for (var i=0; i<bots.length; i++) {
			bots[i].state = state;

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
			// Reset collision flags for all bots
			for (i=0; i<serverBots.length; i++) {
				ruleset.resetCollisionFlag(serverBots[i]);
			}

			// Move and check collisions for items
			for (var i=0; i<items.length; i++) {
				var item = items[i];
				var itemProps = props.items[item.type];

				// Call the item's movement callback
				var movementFunction = props.items[item.type].movementCallback;
				newPosition = movementFunction.call(item, this, itemProps);

				// Check for collisions
				var collisionState = server.collisionWeaponObjects(newPosition);

				// We collided with something
				if (server.collisionBoundary(newPosition) || collisionState.collision) {
					// Call the item's collision callback
					var collisionFunction = props.items[item.type].collisionCallback;
					collisionFunction.call(item, this, collisionState, itemProps);
				} else {
					// We didn't collide with anything, so just update the coordinates
					// TODO: callback for this?
					item.x = newPosition.x;
					item.y = newPosition.y;
				}
			}

			// Move and check collisions for weapons
			for (var i=0; i<weapons.length; i++) {
				var weapon = weapons[i];
				var weaponProps = props.weapons[weapon.type];

				// Call the weapon's movement callback
				var movementFunction = weaponProps.movementCallback;
				newPosition = movementFunction.call(weapon, this, weaponProps);

				// Check for collisions
				var collisionState = server.collisionWeaponObjects(newPosition);

				// We collided with something
				if (server.collisionBoundary(newPosition) || collisionState.collision) {
					// Call the weapon's collision callback
					var collisionFunction = weaponProps.collisionCallback;
					collisionFunction.call(weapon, this, collisionState, weaponProps);
				} else {
					// We didn't collide with anything, so just update the coordinates
					// TODO: callback for this?
					weapon.x = newPosition.x;
					weapon.y = newPosition.y;
				}
			}

			// Remove items and weapons that asked to be removed
			newItems = [];
			newWeapons = [];
			for (var i=0; i<weapons.length; i++) {
				if (!weapons[i].remove) {
					newWeapons.push(weapons[i]);
				}
			}
			for (var i=0; i<items.length; i++) {
				if (!items[i].remove) {
					newItems.push(items[i]);
				}
			}

			// Clear the original arrays and assign them
			weapons = [];
			weapons = newWeapons;
			items = [];
			items = newItems;

			// Clear state
			state = {};
			state.bots = [];
			state.obstacles = [];
			state.weapons = [];
			state.items = [];

			// Get current state of bots
			for (var i=0; i<serverBots.length; i++) {
				state.bots.push({ "id": i, "name": serverBots[i].name, "x": serverBots[i].x, "y": serverBots[i].y, "angle": serverBots[i].angle, "health": serverBots[i].health });
			}

			// Get current state of obstacles
			for (var i=0; i<obstacles.length; i++) {
				var o = obstacles[i];

				state.obstacles.push({ "x": o.x, "y": o.y, "width": o.width, "height": o.height });
			}

			// Get current state of weapons
			for (var i=0; i<weapons.length; i++) {
				var w = weapons[i];

				state.weapons.push({ "x": w.x, "y": w.y, "angle": w.angle, "owner": w.owner, "type": w.type });
			}

			// Go through each bot
			for (var b=0; b<serverBots.length; b++) {
				var bot = serverBots[b];
				bot.waitFire--;
				if (bot.waitFire <= 0) {
					bot.waitFire = 0;
					bot.canShoot = true;
				}

				// Update the bot's state (TODO: make copies instead of passing reference to the arrays)
				bots[b].state = state;

				// Now run the bot
				command = bots[b].run();

				// Parse the command
				ruleset.parseCommand(command, bot);

				// Normalize the returned angle
				bot.angle = this.helpers.normalizeAngle(bot.angle);

				// Copy the server bot data to the bots
				bots[b].copy(bot);
			}

			// TODO: change to ruleset.gameOver()
			if (!ruleset.gameOver()) {
				// Draw everything
				this.drawWorld(this.context);
			} else {
				// Get the winner
				winner = ruleset.getWinner();
				console.log("Game over: ", winner);

				// Endgame
				drawHealth();
				drawEndgame(winner, this.context);
				return false;
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
		for (i in serverBots) {
			var bot = serverBots[i];

			drawBot(bot.x, bot.y, bot.angle, bot.color, context);
		}

		// draw weapons
		for (i in weapons) {
			var weapon = weapons[i];

			drawWeapon(weapon.x, weapon.y, weapon.angle, context);
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

	function drawWeapon(x, y, angle, context) {
		context.save();
		context.translate(x, y);
		context.rotate(angle);

		context.strokeStyle = props.weapons.bullet.color;
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

	this.collisionObstacle = function(obstacle, point) {
		var rtnBool = false;

		if (point.radius != undefined) {
			// We have a bot
			if (point.x >= obstacle.x - point.radius && point.x <= obstacle.x + point.radius + obstacle.width && point.y >= obstacle.y - point.radius && point.y <= obstacle.y + point.radius + obstacle.height) {
				rtnBool = true;
			}
		} else {
			// Single point = bullet
			if (point.x >= obstacle.x && point.x <= obstacle.x + obstacle.width && point.y >= obstacle.y && point.y <= obstacle.y + obstacle.height) {
				rtnBool = true;
			}
		}

		return rtnBool;
	}

	this.collisionBot = function(bot, point) {
		dx = bot.x - point.x;
		dy = bot.y - point.y;

		dist = Math.sqrt(dx * dx + dy * dy);

		return (props.bots.radius > dist);
	}

	this.collisionWeaponObjects = function(weapon) {
		// Default return state
		var state = {
			"collision": false,
			"pos": {
				"x": weapon.x,
				"y": weapon.y
			}
	   	};

		// Check for collisions with bots
		for (i in serverBots) {
			if (this.collisionBot(serverBots[i], weapon)) {
				state.collision = true;
				state.type = "bot";
				state.objectIndex = i;
				state.object = serverBots[i];
				return state;
			}
		}

		// Check for collisions with obstacles
		for (i in obstacles) {
			if (this.collisionObstacle(obstacles[i], weapon)) {
				state.collision = true;
				state.type = "obstacle";
				state.objectIndex = i;
				state.object = obstacles[i];
				return state;
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
				if (this.collisionObstacle(obstacles[i], bot)) {
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

	this.getWeapons = function() {
		return weapons.slice(0);
	}

	this.getObstacles = function() {
		return obstacles.slice(0);
	}

	this.addWeapon = function(weapon) {
		weapons.push(weapon);
	}

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
