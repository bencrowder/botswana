/* Botswana */
/* by Ben Crowder and Chad Hansen */

function Ruleset(server) {
	this.server = server;

	// ID for this ruleset, used by bot scripts for compatibility
	this.name = "Botswana";

	this.properties = {
		'numTeams': 2,
		'botsPerTeam': 2,
		'world': {
			'width': 1000,
			'height': 600,
			'obstacles': {
				'num': (Math.random() * 3) + 2
			}
		},
		'bots': {
			'angleStep': 0.1,
			'speed': 2,
			'radius': 15,
			'colors': [ "#e95050", "#589ebc" ]
		},
		'ammo': {
			'bullets': {
				'speed': 5,
				'strength': 5,
				'waitTime': 15,
				'numAllowed': 5,
				'color': "#d2f783"
			},
			'mines': {
				'speed': 0,
				'strength': 10,
				'waitTime': 25,
				'numAllowed': 5
			},
		}
	};


	/* Dictionary of commands */ 
	/* -------------------------------------------------- */

	this.commands = {
		"forward": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, this.properties.bots.speed);

			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collision = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collision = true;
			}
		},

		"backward": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, -this.properties.bots.speed);
			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collision = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collision = true;
			}
		},

		"left": function(bot) {
			bot.angle += this.properties.bots.angleStep;
		},

		"right": function(bot) {
			bot.angle -= this.properties.bots.angleStep;
		},

		"strafe-left": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle - (Math.PI / 2), this.properties.bots.speed);

			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collision = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collision = true;
			}
		},

		"strafe-right": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle + (Math.PI / 2), this.properties.bots.speed);

			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collision = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collision = true;
			}
		},

		"fire": function(bot) {
			if (bot.bullets > 0 && bot.canShoot && bot.waitFire <= 0) {
				bot.bullets -= 1;
				bot.canShoot = false;
				bot.waitFire = this.properties.ammo.bullets.waitTime;

				var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, this.properties.bots.radius);

				this.server.addBullet({ "x": pos.x, "y": pos.y, "angle": bot.angle, "owner": bot.id });
			}
		},

		"wait": function(bot) {
			return;
		}
	};


	/* Reset any properties for the beginning of a new game */
	/* -------------------------------------------------- */

	this.resetGame = function() {

	};


	/* Register a bot script */
	/* -------------------------------------------------- */
	/* Returns an array of bots (based on botsPerTeam) */

	this.registerBotScript = function(teamNum, botScript) {
		var botList = [];
		var fn = (window || this);

		// Create botsPerTeam # of bots
		for (var i=0; i<this.properties.botsPerTeam; i++) {
			// Instantiate the class
			var bot = new fn[botScript.className](botScript.name);

			// Assign the team color
			bot.color = this.properties.bots.colors[teamNum];

			botList.push(bot);
		}

		return botList;
	};


	/* Generate obstacles */
	/* -------------------------------------------------- */
	/* Returns array of obstacles */

	this.generateObstacles = function() {
		var obstacles = [];

		for (i=0; i<this.properties.world.obstacles.num; i++) {
			clear = false;

			// Loop to make sure we're putting obstacles in acceptable places
			while (!clear) {
				var p = this.server.getRandomPoint();
				var width = (Math.random() * 80) + 25;
				var height = (Math.random() * 80) + 25;

				// Check boundaries and adjust if necessary
				if (p.x + width > (this.properties.world.width - 50)) {
					width = this.properties.world.width - 50 - p.x;
				}

				if (p.y + height > (this.properties.world.height - 50)) {
					height = this.properties.world.height - 50 - p.y;
				}

				// Make sure we're not overlapping existing obstacles
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

					clear = (overlaps) ? false : true;
				} else {
					// There aren't any other obstacles yet
					clear = true;
				}
			}

			obstacles.push({ "x": p.x, "y": p.y, "width": width, "height": height });
		}

		return obstacles;
	};


	/* Initialize bot */
	/* -------------------------------------------------- */
	/* Updates object in place */

	this.initializeBot = function(bot, id) {
		bot.id = id;

		bot.angle = Math.random() * Math.PI * 2;	// in radians
		bot.health = 100;
		bot.canShoot = true;
		bot.hitByBullet = false;
		bot.waitFire = 0;

		bot.bullets = this.properties.ammo.bullets.numAllowed;
		bot.radius = this.properties.bots.radius;
	};


	/* Set initial placement */
	/* -------------------------------------------------- */
	/* Updates object in place */

	this.setInitialPlacement = function(bot) {
		// Get a random position
		botPos = this.server.getRandomPoint();
		bot.x = botPos.x;
		bot.y = botPos.y;

		// Loop until we get a position that doesn't collide
		while (this.server.collisionBotObjects(bot)) {
			botPos = this.server.getRandomPoint();
			bot.x = botPos.x;
			bot.y = botPos.y;
		}
	};


	/* Parse command */
	/* -------------------------------------------------- */

	this.parseCommand = function(command, bot) {
		var callback = this.commands[command];
		callback.call(this, bot);
	};
};
