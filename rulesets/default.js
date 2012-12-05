/* Botswana */
/* by Ben Crowder and Chad Hansen */

function Ruleset(server) {
	this.server = server;

	// ID for this ruleset, used by bot scripts for compatibility
	this.name = "Botswana";

	this.properties = {
		'numTeams': 2,
		'botsPerTeam': 3,
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
			'radiusMargin': 8,
			'colors': [ "#c48244", "#3081b8" ]
		}
	};


	/* Dictionary of weapons */ 
	/* -------------------------------------------------- */

	this.properties.weapons = {
		'bullet': {
			'speed': 5,
			'strength': 4,
			'waitTime': 5,
			'numAllowed': 5,
			'display': {
				'length': 8,
				'width': 2,
			},
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
		'mine': {
			'speed': 0,
			'strength': 10,
			'waitTime': 25,
			'numAllowed': 5,
			'movementCallback': function(server, properties) {
				// Don't move mines
				return { 'x': this.x, 'y': this.y };
			},
			'collisionCallback': function(server, collision, properties) {
				this.remove = true;
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
			// TODO: modify to allow for other weapon types
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

		/*
		// Simpler obstacle generation for now
		obstacles = [
			{ "x": 50, "y": 200, "width": 50, "height": 200 },
			{ "x": 900, "y": 200, "width": 50, "height": 200 },
			{ "x": 450, "y": 250, "width": 100, "height": 100 },
			{ "x": 100, "y": 40, "width": 800, "height": 40 },
			{ "x": 100, "y": 520, "width": 800, "height": 40 }
		];
		*/

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

		// If anyone is at health = 0, game over
		for (var key in teamHealth) {
			stillalive = false;
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
		for (var key in teamHealth) {
			if (teamHealth[key] > 0) return key;
		}	

		return '';
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


	/* Draw */
	/* -------------------------------------------------- */
	this.draw = {};

	this.draw.width = this.properties.world.width;
	this.draw.height = this.properties.world.height;
	this.draw.ruleset = this;
	this.draw.server = this.server;

	this.draw.world = function() {
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

			if (bot.alive) {
				this.bot(bot.x, bot.y, bot.angle, bot.color, bot.radius, bot.health);
			}
		}

		// draw weapons
		var weapons = server.getWeapons();
		for (i in weapons) {
			var weapon = weapons[i];

			this.weapon(weapon.x, weapon.y, weapon.angle, weapon.type, weapon.owner);
		}

		this.particles();
	};

	this.draw.clear = function() {
		this.c.clearRect(0, 0, this.width, this.height);
	};

	this.draw.grid = function() {
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

	this.draw.obstacles = function() {
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

	this.draw.bot = function(x, y, angle, color, radius, health) {
		this.c.save();
		this.c.translate(x, y);

		this.c.fillStyle = color;
		this.c.lineWidth = 4;

		// Draw filled/stroked circle
		var healthValue = parseInt(health * (255 / 100)); // hardcoded for now
		this.c.strokeStyle = "rgba(255, " + healthValue + ", " + healthValue + ", 1.0)";
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
		this.c.lineTo(radius + 3, 0);
		this.c.closePath();
		this.c.stroke();

		this.c.restore();
	};

	this.draw.weapon = function(x, y, angle, type, owner) {
		this.c.save();
		this.c.translate(x, y);
		this.c.rotate(angle);

		switch (type) {
			case 'bullet':
				this.c.lineWidth = this.ruleset.properties.weapons.bullet.display.width;
				this.c.strokeStyle = this.ruleset.properties.bots.colors[this.server.getBotTeam(owner)];
				this.c.beginPath();
				this.c.moveTo(1, 0);
				this.c.lineTo(-this.ruleset.properties.weapons.bullet.display.length, 0);
				this.c.closePath();
				this.c.stroke();

				break;
		}

		this.c.restore();
	};

	this.draw.particles = function() {
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
				pos = this.server.helpers.calcVector(particle.x, particle.y, particle.angle, particle.speed);

				this.particle(particle, pos);

				particle.x = pos.x;
				particle.y = pos.y;
			}
		}

		this.server.setParticles(fxParticles);

		this.c.restore();
	};

	// Draw a single particle
	this.draw.particle = function(particle, newPos) {
		this.c.beginPath();
		this.c.strokeStyle = particle.color;
		this.c.moveTo(particle.x, particle.y);
		this.c.lineTo(pos.x, pos.y);
		this.c.globalAlpha = particle.life / 20;
		this.c.stroke();
		this.c.closePath();
	}

	this.draw.health = function() {
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

	this.draw.paused = function() {
		var lineWidth = 15;
		var distanceBetween = 15;

		var pauseWidth = lineWidth * 2 + distanceBetween;
		var pauseHeight = 50;

		var x1 = (this.width / 2) - (pauseWidth / 2);
		var x2 = x1 + lineWidth + distanceBetween;

		// A little higher than center
		var y = (this.height / 2) - pauseHeight;

		this.c.beginPath();
		this.c.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.c.fillRect(0, 0, this.width, this.height);
		this.c.fill();
		this.c.closePath();

		this.c.save();
		this.c.strokeStyle = "#fff";
		this.c.lineWidth = lineWidth;
		this.c.beginPath();

		this.c.moveTo(x1, y);
		this.c.lineTo(x1, y + pauseHeight);
		this.c.moveTo(x2, y);
		this.c.lineTo(x2, y + pauseHeight);

		this.c.stroke();
		this.c.closePath();
		this.c.restore();
	};

	this.draw.endgame = function(winner) {
		var bots = this.server.getBots();
		var team = undefined;
		for (i in bots) {
			if (bots[i].name == winner) team = bots[i];
		}
		if (team === undefined) return;

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
		this.c.strokeStyle = team.color; // TODO: fix
		this.c.lineWidth = 5;
		this.c.stroke();
		this.c.closePath();
		this.c.restore();

		// text and bot
		this.c.save();
		this.c.font = "bold 28px 'Lucida Grande', Helvetica, Arial, sans-serif";
		this.c.fillStyle = "#fff";
		this.c.fillText("Champion: " + team.name, 70, 277);
		this.bot(900, 268, 3 * Math.PI / 2, team.color, team.radius, 100);
		this.c.closePath();
		this.c.restore();
	};
};
