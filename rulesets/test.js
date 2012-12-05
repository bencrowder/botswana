/* Test ruleset, used for development */

function Ruleset(server) {
	this.server = server;

	// ID for this ruleset, used by bot scripts for compatibility
	this.name = "Test";

	this.properties = {
		'numTeams': 2,
		'botsPerTeam': 4,
		'world': {
			'width': 1000,
			'height': 600,
		},
		'bots': {
			'angleStep': 0.05,
			'speed': 5,
			'radius': 10,
			'radiusMargin': 2,
			'colors': [ "#01eb5f", "#b11e1e" ]
		}
	};


	/* Dictionary of weapons */ 
	/* -------------------------------------------------- */

	this.properties.weapons = {
		'bullet': {
			'speed': 5,
			'strength': 5,
			'waitTime': 5,
			'numAllowed': 5,
			'movementCallback': function(server, properties) {
				return server.helpers.calcVector(this.x, this.y, this.angle, properties.speed);
			},
			'collisionCallback': function(server, collision, properties) {
				this.remove = true;

				switch (collision.type) {
					case "bot":
						// Decrease the health of the bot that was hit
						bot = collision.object;
						bot.health -= properties.strength;
						bot.hitByBullet = true;	// bot is responsible to unset this

						// Create a red explosion
						server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#db4e22");
						break;
						
					default:
						// Collision with obstacle, item, or world boundary
						server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#96e0ff");
						break;
				}

				owner = server.getBotByID(this.owner);
				if (owner != undefined) {
					if (owner.weapons[this.type] < properties.numAllowed) {
						owner.weapons[this.type]++;
					}
					owner.canShoot = true;
				}
			}
		},
	};
	

	/* Dictionary of items */ 
	/* -------------------------------------------------- */

	this.properties.items = {
		'health': {
			'strength': 25,
			'movementCallback': function(server, weapon) {
				return false;
			},
			'collisionCallback': function(server, weapon, collisionState) {
				// do something
				// if collision was a bullet, destroy the item
				// if collision was a bot, add health to the bot
			}
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
				bot.collided = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collided = true;
			}
		},

		"backward": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, -this.properties.bots.speed);
			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collided = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collided = true;
			}
		},

		"left": function(bot) {
			bot.angle -= this.properties.bots.angleStep;
		},

		"right": function(bot) {
			bot.angle += this.properties.bots.angleStep;
		},

		"strafe-left": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle - (Math.PI / 2), this.properties.bots.speed);

			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collided = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collided = true;
			}
		},

		"strafe-right": function(bot) {
			var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle + (Math.PI / 2), this.properties.bots.speed);

			oldX = bot.x;
			oldY = bot.y;
			bot.x = pos.x;
			bot.y = pos.y;

			if (!this.server.collisionBoundary(bot) && !this.server.collisionBotObjects(bot)) {
				bot.collided = false;
			} else {
				bot.x = oldX;
				bot.y = oldY;
				bot.collided = true;
			}
		},

		"fire": function(bot) {
			if (bot.weapons.bullet > 0 && bot.canShoot && bot.waitFire <= 0) {
				bot.weapons.bullet--;
				bot.canShoot = false;
				bot.waitFire = this.properties.weapons.bullet.waitTime;

				var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, bot.radius);

				this.server.addWeapon({ "x": pos.x, "y": pos.y, "angle": bot.angle, "owner": bot.id, "type": "bullet", "remove": false });
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
			bot.color = this.properties.bots.colors[teamNum - 1];

			botList.push(bot);
		}

		return botList;
	};


	/* Generate obstacles */
	/* -------------------------------------------------- */
	/* Returns array of obstacles */

	this.generateObstacles = function() {
		// Simpler obstacle generation for now
		var obstacles = [
			/*
			{ "x": 50, "y": 200, "width": 50, "height": 200 },
			{ "x": 900, "y": 200, "width": 50, "height": 200 },
			{ "x": 450, "y": 250, "width": 100, "height": 100 },
			{ "x": 100, "y": 40, "width": 800, "height": 40 },
			{ "x": 100, "y": 520, "width": 800, "height": 40 }
			*/
		];

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

		// Assign the weapon type's number of ammo
		bot.weapons = [];
		for (var key in this.properties.weapons) {
			bot.weapons[key] = this.properties.weapons[key].numAllowed;
		}

		bot.radius = this.properties.bots.radius + ((Math.random() * this.properties.bots.radiusMargin) - this.properties.bots.radiusMargin / 2);
	};


	/* Set initial placement */
	/* -------------------------------------------------- */
	/* Updates object in place */

	this.setInitialPlacement = function(bot) {
		/*
		this.getRandomPointWithinRect = function(x, y, width, height) {
			var pos = {};
			var padding = 20;

			// Clamp the rect to world boundaries
			if (x + width > this.properties.world.width) {
				width = this.properties.world.width - x;
			}
			if (y + height > this.properties.world.height) {
				height = this.properties.world.height - y;
			}
		
			// And get the random position	
			pos.x = (Math.random() * (width - (padding * 2))) + x + padding;
			pos.y = (Math.random() * (height - (padding * 2))) + y + padding;
			
			return pos;
		};

		botPos = this.getRandomPointWithinRect(100, 100, 250, 400);
		bot.x = botPos.x;
		bot.y = botPos.y;

		while (this.server.collisionBotObjects(bot)) {
			botPos = this.getRandomPointWithinRect(100, 100, 250, 400);
			bot.x = botPos.x;
			bot.y = botPos.y;
		}
		*/

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


	/* Game over condition */
	/* -------------------------------------------------- */

	this.gameOver = function() {
		var teamHealth = this.updateHealth();

		stillalive = false;
		// If anyone is at health = 0, game over
		for (var key in teamHealth) {
			bots = server.getBots();
			for (i in bots) {
				if (bots[i].name == key && bots[i].alive){
					stillalive = true;
				}
			}
			if (teamHealth[key] <= 0 && !stillalive) return true;
		}	

		return false;
	};


	/* Get winner */
	/* -------------------------------------------------- */

	this.getWinner = function() {
		var teamHealth = this.updateHealth();

		// If anyone is at health = 0, the other team is the winner.
		var i = 1;
		for (var key in teamHealth) {
			if (teamHealth[key] > 0) return i;
			i++;
		}	

		return -1;
	};


	/* Reset collision flags */
	/* -------------------------------------------------- */

	this.resetCollisionFlag = function(bot) {
		bot.hitByBullet = false;
	};	


	/* Update bot */
	/* -------------------------------------------------- */

	this.updateBot = function(bot) {
		bot.waitFire--;
		if (bot.waitFire <= 0) {
			bot.waitFire = 0;
			bot.canShoot = true;
		}
		if (bot.health <= 0) {
			bot.alive = false;
		}
	};


	/* Update health */
	/* -------------------------------------------------- */
	/* Returns the health for each team */

	this.updateHealth = function() {
		var bots = server.getBots();
		var teamHealth = {};

		// Loop through bots and calculate team totals
		for (i=0; i<bots.length; i++) {
			teamName = bots[i].name;
			health = parseInt(bots[i].health);

			if (typeof teamHealth[teamName] == 'undefined') {
				teamHealth[teamName] = health;
			} else {
				teamHealth[teamName] += health;
			}
		}

		return teamHealth;
	};
};
