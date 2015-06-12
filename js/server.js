/* Botswana */
/* by Ben Crowder and Chad Hansen */

var Server = function() {
	var ruleset = new Ruleset(this);

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

		// Load the ruleset script and execute it
		var rulesetUrl = $(".rulesets .ruleset.selected").attr("data-uri");

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
				props = ruleset.properties;
				var teamList = $(".bots .bot.selected");

				// Counter to keep track of how many are left to load, since we do things asynchronously
				if (props.numTeams) {
					var scriptsUnloaded = props.numTeams;
				} else {
					var scriptsUnloaded = teamList.length;
				}

				$("#status .team").remove();

				// Load the scripts, one for each team
				for (var i=0; i<teamList.length; i++) {
					var url = $(teamList[i]).attr("data-uri");

					// Load the script and execute it
					try {
						$.ajax({
							url: url,
							dataType: 'script',

							success: function() {
								scriptsUnloaded--;

								// Start the tournament once all these are loaded
								if (scriptsUnloaded == 0) {
									server.startTournament();

									$("header").removeClass("active");
								}
							},

							error: function() {
								// Find the bot with the bad URL and flag it
								var bot = $(".bots .bot[data-uri=" + url + "]");
								bot.addClass("invalid_url");
							},
						});
					} catch (e) {
						console.log("Failed to load bot");
					}
				}
			}
		});
	}


	/* Register a bot script */
	/* -------------------------------------------------- */

	this.registerBotScript = function(botClassName, name) {
		// Team #
		var teamNum = teams.length + 1;

		// Check team name for duplicates
		if (typeof name == "undefined") {
			var name = botClassName;
		}
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

		// Add to healthboard
		var html = "<div class='team' data-team='" + teamNum + "'>";
		html += "<span class='name'>" + name + "</span>";
		html += "<span class='healthbar'><span class='health' style='width: 100%; background-color: " + color + ";'></span></span>";
		html += "</div>";

		$("#status").append(html);
	}


	/* Start the game */
	/* -------------------------------------------------- */

	this.startTournament = function() {
		// Properties
		props = ruleset.properties;

		// Remove invalid URL flags (if any)
		$("header input").removeClass("invalid_url");

		// Reset state
		state = {};
		state.world = {
			'width': props.world.width,
			'height': props.world.height,
		};
		state.bots = [];
		state.obstacles = [];
		state.weapons = [];
		state.items = [];

		// Generate obstacles
		obstacles = ruleset.generateObstacles();

		// Generate items
		items = ruleset.generateItems();

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

			// Post-init bot setup
			ruleset.postInitBot(bot);
		}

		// Loop through each bot to set placement
		for (var i=0; i<bots.length; i++) {
			var bot = bots[i];

			// Set initial placement on map
			ruleset.setInitialPlacement(bot);

			// Push the bot's state to the server list
			state.bots.push({ "id": i, "name": bot.name, "x": bot.x, "y": bot.y, "angle": bot.angle, "radius": bot.radius, "health": bot.health });

			// Call the bot's setup function
			bot.setup();
		}

		// Add obstacles to state
		for (i in obstacles) {
			var o = obstacles[i];
			state.obstacles.push({
				"x": o.x,
				"y": o.y,
				"width": o.width,
				"height": o.height,
			});
		}

		// Add items to state
		for (i in items) {
			var item = items[i];
			state.items.push({
				"x": item.x,
				"y": item.y,
				"radius": item.radius,
				"strength": item.strength,
			});
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
			window.cancelAnimationFrame(tournamentIntervalId);
		}

		// Start the game
		gameStarted = true;

		// Game init hook
		ruleset.initializeGame();

		// We use the t variable because otherwise we lose scope
		var t = this;
		tournamentIntervalId = window.requestAnimationFrame(function() {
			t.runGame();
		});
	}


	/* Call the movement/collision callbacks for all the objects */
	/* -------------------------------------------------- */

	this.updateObjects = function(list, listName) {
		props = ruleset.properties;

		// Move and check collisions for items
		for (var i=0; i<list.length; i++) {
			var obj = list[i];
			var objProps = props[listName][obj.type];

			// Call the item's movement callback
			var movementFunction = props[listName][obj.type].movementCallback;
			objectInfo = movementFunction.call(obj, this, objProps);

			// Add radius if object has it
			if (objProps.radius) {
				objectInfo.radius = objProps.radius;
			}

			// Check for collisions with bots/obstacles
			var collisionState = server.collisionObjects(objectInfo);

			// We collided with either a world boundary or a weapon
			if (server.collisionBoundary(objectInfo) || collisionState.collision) {
				// Call the item's collision callback
				var collisionFunction = props[listName][obj.type].collisionCallback;
				collisionFunction.call(obj, this, collisionState, objProps);
			} else {
				// We didn't collide with anything, so just update the coordinates
				// TODO: callback for this?
				obj.x = objectInfo.x;
				obj.y = objectInfo.y;
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
			ruleset.startRound(this.clicks);

			// Reset collision flags for all bots
			for (i=0; i<serverBots.length; i++) {
				ruleset.resetCollisionFlag(serverBots[i]);
			}

			// Move and update objects according to movement callbacks in ruleset
			this.updateObjects(items, "items");
			this.updateObjects(weapons, "weapons");

			// Clear state
			state = {};
			state.bots = [];
			state.obstacles = [];
			state.weapons = [];
			state.items = [];
			state.world = {
				'width': ruleset.properties.world.width,
				'height': ruleset.properties.world.height,
			};

			// Get current state of bots
			for (var i=0; i<serverBots.length; i++) {
				if (serverBots[i].alive) {
					state.bots.push({
						"id": i,
						"name": serverBots[i].name,
						"x": serverBots[i].x,
						"y": serverBots[i].y,
						"angle": serverBots[i].angle,
						"radius": serverBots[i].radius,
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

				// Update bot flags (wait counters, alive status, etc.)
				ruleset.updateFlags(bot);

				if (bot.alive) {
					// Update the bot's state (TODO: make copies instead of passing reference to the arrays)
					bots[i].state = state;

					if (payloads[bot.name]) {
						bots[i].state.payload = payloads[bot.name]
					} else {
						bots[i].state.payload = {}
					}

					// Now run the bot
					try {
						command = bots[i].run();
					} catch (e) {
						console.log(bots[i].name + " errored out, probably syntax error. The error:", e);
					}

					// Parse the returned command
					var pos = ruleset.parseCommand(command.command, bot);

					// Update bot hook
					pos = ruleset.updateBot(bot, pos);

					// Collision detection
					ruleset.checkCollisions(bot, pos);

					// If the command sent back a payload, add it so the other bots on the team can see it
					if (typeof command.payload != 'undefined') {
						payloads[bot.name] = command.payload;
					}

					// Normalize the bot's angle
					bot.angle = this.helpers.normalizeAngle(bot.angle);

					// Copy the server bot data to the bots
					bots[i].copy(bot);
				}

				// Post-process bot
				ruleset.postProcess(bot);
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

			// End-round hook
			ruleset.endRound();
		}

		var t = this;
		tournamentIntervalId = window.requestAnimationFrame(function() {
			t.runGame();
		});
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
		world = ruleset.properties.world;

		var pos = {};
		var padding = 100;
		pos.x = (Math.random() * (world.width - (padding * 2))) + padding;
		pos.y = (Math.random() * (world.height - (padding * 2))) + padding;

		return pos;
	}


	/* Return true if point collides with world boundary */
	/* -------------------------------------------------- */

	this.collisionBoundary = function(point) {
		var rtnBool = false;
		var props = ruleset.properties;

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

	this.collisionBotWeapon = function(bot, weapon) {
		var response = false;

		dist = this.helpers.distanceToPoint(bot.x, bot.y, weapon.x, weapon.y);

		if (weapon.radius != undefined) {
			// Weapon has a radius (mine, etc.)
			response = (dist < bot.radius + weapon.radius);
		} else {
			// Weapon has no radius (bullet)
			response = (dist < bot.radius);
		}

		return response;
	}


	/* Check to see if the given object has collided with anything */
	/* -------------------------------------------------- */

	this.collisionObjects = function(obj) {
		// Default return state
		var state = {
			"collision": false,
			"pos": {
				"x": obj.x,
				"y": obj.y,
			}
	   	};

		// Check for collisions with bots
		for (i in serverBots) {
			if (serverBots[i].alive && this.collisionBotWeapon(serverBots[i], obj)) {
				state.collision = true;
				state.type = "bot";
				state.objectIndex = i;
				state.object = serverBots[i];
				return state;
			}
		}

		// Check for collisions with obstacles
		for (i in obstacles) {
			if (this.collisionObstacle(obstacles[i], obj)) {
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

	this.getCollisions = function(bot) {
		var collisions = [];

		// Check if the bot has collided with a world boundary
		if (this.collisionBoundary(bot)) {
			collisions.push({'type': 'boundary'});
		}

		// Check if the bot has collided with another bot
		for (i in serverBots) {
			if (serverBots[i].alive && serverBots[i].id != bot.id) {
				if (this.collisionBots(bot, serverBots[i])) {
					collideBot = {'id': serverBots[i].id, 'name': serverBots[i].name, 'x': serverBots[i].x, 'y': serverBots[i].y, 'radius': serverBots[i].radius, 'angle': serverBots[i].angle, 'health': serverBots[i].health};
					collisions.push({'type': 'bot', 'obj': collideBot});
				}
			}
		}

		// Check if the bot has collided with an obstacle
		for (i in obstacles) {
			if (this.collisionObstacle(obstacles[i], bot)) {
				collisions.push({'type': 'obstacle', 'obj': obstacles[i]});
			}
		}

		return collisions;
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
		if (serverBots[botID]) {
			teamName = serverBots[botID].name;

			return teams.indexOf(teamName);
		} else {
			return -1;
		}
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

	this.getItems = function() {
		return items.slice(0);
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

	this.addItem = function(item) {
		weapons.push(item);
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
