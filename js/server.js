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
		//draw = new Draw(this.context, this, props.world.width, props.world.height);
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

		// Load the ruleset script and execute it
		var rulesetUrl = $("#ruleset_url").val();

		$.ajax({
			url: rulesetUrl,
			dataType: 'script',

			error: function(data) {
				// TODO: message
				console.log("Uh-oh", data);
			},

			success: function() {
				// Set up the canvas (we need props.world.width/height)
				var canvas = document.getElementById("canvas");
				var context = canvas.getContext("2d");
				server.setContext(context);
				ruleset.draw.c = context;

				// Reset everything
				ruleset.resetGame();
				
				// Counter to keep track of how many are left to load, since we do things asynchronously
				var scriptsUnloaded = props.numTeams;

				// Load the scripts, one for each team
				for (var i=1; i<=props.numTeams; i++) {
					var url = $("#bot" + i + "_url").val();

					// Load the script and execute it
					$.ajax({
						url: url,
						dataType: 'script',

						error: function() {
							// Find the bot with the bad URL and flag it
							for (var i=1; i<=props.numTeams; i++) {
								if ($("#bot" + i + "_url").val() == url) {
									$("#bot" + i + "_url").addClass("invalid_url");
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
		});
	}


	/* Register a bot script */
	/* -------------------------------------------------- */

	this.registerBotScript = function(botClassName) {
		// Team #
		var teamNum = teams.length + 1;

		// Check team name for duplicates
		var name = botClassName;
		if ($.inArray(name, teams) != -1) {
			counter = 2;

			while ($.inArray(name, teams) != -1) {
				name = botClassName + "-" + counter;
				counter++;
			}
		}

		// Call the ruleset register function
		var botList = ruleset.registerBotScript(teamNum, botClassName, name);

		// Get the team color (TODO: rewrite)
		var color;	

		// Add all returned bots to the main array
		for (var i=0; i<botList.length; i++) {
			bots.push(botList[i]);
			color = botList[i].color;
			name = botList[i].name;
		}

		// Add this script
		teams.push(name);

		// Update the status bar
		// TODO: figure out what to do now that we have teams
		$("#status #bot" + teamNum + "status .name").html(name);
		$("#status #bot" + teamNum + "status .health").css("background-color", color);
		$("#status #bot" + teamNum + "status .width").css("width", 200); // TODO: rewrite to max health from props
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

		// Generate obstacles
		obstacles = ruleset.generateObstacles();

		// Create the initial serverBots array for placement
		serverBots = [];
		for (var i=0; i<bots.length; i++) {
			serverBots.push(bots[i]);
		}

		// Loop through each bot to initialize things
		for (var i=0; i<bots.length; i++) {
			var bot = bots[i];

			// Initialize the bot
			ruleset.initializeBot(bot, i);
		}

		// Loop through each bot to set placement
		for (var i=0; i<bots.length; i++) {
			var bot = bots[i];

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
		serverBots = [];
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


	/* Call the movement/collision callbacks for all the objects */
	/* -------------------------------------------------- */

	this.updateObjects = function(list, listName) {
		// Move and check collisions for items
		for (var i=0; i<list.length; i++) {
			var obj = list[i];
			var objProps = props[listName][obj.type];

			// Call the item's movement callback
			var movementFunction = props[listName][obj.type].movementCallback;
			newPosition = movementFunction.call(obj, this, objProps);

			// Check for collisions
			var collisionState = server.collisionWeaponObjects(newPosition);

			// We collided with something
			if (server.collisionBoundary(newPosition) || collisionState.collision) {
				// Call the item's collision callback
				var collisionFunction = props[listName][obj.type].collisionCallback;
				collisionFunction.call(obj, this, collisionState, objProps);
			} else {
				// We didn't collide with anything, so just update the coordinates
				// TODO: callback for this?
				obj.x = newPosition.x;
				obj.y = newPosition.y;
			}
		}

		// Remove items and weapons that asked to be removed
		newList = [];

		for (var i=0; i<list.length; i++) {
			if (!list[i].remove) {
				newList.push(list[i]);
			}
		}

		switch (listName) {
			case 'weapons':
				weapons = [];
				weapons = newList;
				break;

			case 'items':
				items = [];
				items = newList;
				break;
		}
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

			// Move and update objects
			this.updateObjects(items, "items");
			this.updateObjects(weapons, "weapons");

			// Clear state
			state = {};
			state.bots = [];
			state.obstacles = [];
			state.weapons = [];
			state.items = [];

			// Get current state of bots
			for (var i=0; i<serverBots.length; i++) {
				if (serverBots[i].alive) {
					state.bots.push({ 
						"id": i, 
						"name": serverBots[i].name,
						"x": serverBots[i].x,
						"y": serverBots[i].y,
						"angle": serverBots[i].angle,
						"health": serverBots[i].health,
						"alive": serverBots[i].alive,
					});
				}
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

			payloads = {};
			// Go through each bot
			for (var i=0; i<serverBots.length; i++) {
				var bot = serverBots[i];

				// Do rule checking
				ruleset.updateBot(bot);

				if (bot.alive) {
					// Update the bot's state (TODO: make copies instead of passing reference to the arrays)
					bots[i].state = state;

					if (payloads[bot.name]) {
						bots[i].state.payload = payloads[bot.name]
					} else {
						bots[i].state.payload = {}
					}

					// Now run the bot and parse the returned command
					command = bots[i].run();
					ruleset.parseCommand(command.command, bot);
					if (typeof command.payload != 'undefined') {
						payloads[bot.name] = command.payload;
					}

					// Normalize the returned angle
					bot.angle = this.helpers.normalizeAngle(bot.angle);

					// Copy the server bot data to the bots
					bots[i].copy(bot);
				} 
			}

			if (ruleset.gameOver()) {
				paused = true;

				// Get the winner
				winner = ruleset.getWinner();

				// Endgame
				ruleset.draw.world();
				ruleset.draw.health();
				ruleset.draw.endgame(winner);
				return false;
			} else {
				// Draw everything
				ruleset.draw.world();
			}
		}
	}

	/* Create circular particle explosion at specified point */
	/* -------------------------------------------------- */

	this.createParticleExplosion = function(x, y, num_points, distance, speed, life, color) {
		var angle = 0;
		var step = (2 * Math.PI) / num_points;

		for (i=0; i<num_points; i++) {
			var pos = this.helpers.calcVector(x, y, angle, distance);

			// add particle to global fxParticles array
			fxParticles.push({ "x": pos.x, "y": pos.y, "angle": angle, "speed": speed, "life": life, "color": color });

			angle += step;
		}
	}


	/* Toggle paused condition */
	/* -------------------------------------------------- */

	this.togglePause = function() {
		if (gameOver) return;
		if (!gameStarted) return;

		if (paused) { 
			paused = false;
		} else {
			paused = true;
			ruleset.draw.paused(this.context);
		}
	}


	/* Get a random point in the world */
	/* -------------------------------------------------- */

	this.getRandomPoint = function() {
		var pos = {};
		var padding = 100;
		pos.x = (Math.random() * (props.world.width - (padding * 2))) + padding;
		pos.y = (Math.random() * (props.world.height - (padding * 2))) + padding;

		return pos;
	}


	/* Return true if point collides with world boundary */
	/* -------------------------------------------------- */

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


	/* Return true if bot A collides with bot B */
	/* -------------------------------------------------- */

	this.collisionBots = function(botA, botB) {
		var collided = false;

		dist = this.helpers.distanceToPoint(botA.x, botA.y, botB.x, botB.y);

		if (dist < botA.radius + botB.radius) {
			collided = true;
		}

		return collided;
	}


	/* Return true if point collides with obstacle */
	/* -------------------------------------------------- */

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


	/* Return true if point collides with bot */
	/* -------------------------------------------------- */

	this.collisionBot = function(bot, point) {
		dist = this.helpers.distanceToPoint(bot.x, bot.y, point.x, point.y);

		return (dist < bot.radius);
	}


	/* Check weapons to see if they've collided with anything */
	/* -------------------------------------------------- */

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
			if (serverBots[i].alive && this.collisionBot(serverBots[i], weapon)) {
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


	/* Check bots to see if they've collided with anything */
	/* -------------------------------------------------- */

	this.collisionBotObjects = function(bot) {
		var collided = false;

		for (i in serverBots) {
			if (serverBots[i].alive && serverBots[i].id != bot.id) {
				if (this.collisionBots(bot, serverBots[i])) {
					collided = true;
				}
			}
		}

		if (!collided) {
			for (i in obstacles) {
				if (this.collisionObstacle(obstacles[i], bot)) {
					collided = true;
				}
			}
		}

		return collided;
	}


	/* Get bot by name */
	/* -------------------------------------------------- */
	/* TODO: rewrite to use team name */

	this.getBotByName = function(name) {
		for (i in bots) {
			if (bots[i].name == name) {
				return bots[i];
			}
		}
		return undefined;
	}


	/* Get bot by ID */
	/* -------------------------------------------------- */

	this.getBotByID = function(id) {
		return serverBots[id];
	}


	/* Get team ID for bot by ID */
	/* -------------------------------------------------- */

	this.getBotTeam = function(botID) {
		teamName = serverBots[botID].name;

		return teams.indexOf(teamName);
	}

	// these functions need to be modified to return copies of the arrays
	// instead of the actual objects (which can then be modified)

	this.getTeams = function() {
		return teams.slice(0);
	}

	this.getBots = function() {
		return serverBots.slice(0);
	}

	this.getParticles = function() {
		return fxParticles.slice(0);
	}

	this.setParticles = function(particles) {
		fxParticles = particles;
	}

	this.getWeapons = function() {
		return weapons.slice(0);
	}

	this.getObstacles = function() {
		return obstacles.slice(0);
	}

	this.getRuleset = function() {
		return ruleset;
	}

	this.setRuleset = function(newRuleset) {
		ruleset = newRuleset;
	}

	this.addWeapon = function(weapon) {
		weapons.push(weapon);
	}

	this.helpers = {};

	this.helpers.normalizeAngle = function(theta) {
		twopi = 2 * Math.PI;
		if (theta < 0)
			theta = twopi + theta;
		else if (theta > twopi)
			theta = theta - twopi;
		return theta;
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
