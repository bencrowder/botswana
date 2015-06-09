// Botswana default ruleset

function Ruleset(server) {
	this.server = server;

	this.name = "default";

	this.properties = {
		'botsPerTeam': 4,
		'world': {
			'width': 1500,
			'height': 900,
			'obstacles': {
				'num': (Math.random() * 10) + 7
			}
		},
		'bots': {
			'angleStep': 0.1,
			'speed': 2,
			'radius': 15,
			'colors': [ "#c48244", "#3081b8", "#a755b0", "#55b083", "#b05555", "#b2be62" ]
		}
	};


	// Dictionary of weapons
	// --------------------------------------------------

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
				return server.helpers.calcVector(this.x, this.y, this.angle, this.speed);
			},
			'collisionCallback': function(server, collision, properties) {
				this.remove = true;
				owner = server.getBotByID(this.owner);

				switch (collision.type) {
					case "bot":
						// Decrease the health of the bot that was hit
						bot = collision.object;
						if (bot.name != owner.name) {
							bot.health -= properties.strength;
							bot.hitByBullet = true;	// bot is responsible to unset this

							// Create a red explosion
							server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#db4e22");
						}
						break;
						
					default:
						// Collision with obstacle, item, or world boundary
						server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#96e0ff");
						break;
				}

				if (owner != undefined) {
					if (owner.weapons[this.type] < properties.numAllowed) {
						owner.weapons[this.type]++;
					}
					owner.canShoot = true;
				}
			},
			'drawCallback': function(server, context, properties) {
				var rs = server.getRuleset();

				owner = server.getBotByID(this.owner);
				team = server.getBotTeam(this.owner);

				context.lineWidth = properties.display.width;
				context.strokeStyle = rs.properties.bots.colors[team];
				context.beginPath();
				context.moveTo(1, 0);
				context.lineTo(-properties.display.length, 0);
				context.closePath();
				context.stroke();
			},
		},
		'mine': {
			'speed': 0,
			'strength': 30,
			'waitTime': 150,
			'numAllowed': 3,
			'radius': 10,
			'display': {
				'length': 10,
				'width': 10,
			},
			'movementCallback': function(server, properties) {
				// Don't move mines
				return { 'x': this.x, 'y': this.y };
			},
			'collisionCallback': function(server, collision, properties) {
				this.remove = true;
				owner = server.getBotByID(this.owner);

				switch (collision.type) {
					case "bot":
						// Decrease the health of the bot that was hit
						bot = collision.object;
						if (bot.name != owner.name) {
							bot.health -= properties.strength;
							bot.hitByBullet = true;	// bot is responsible to unset this

							// Create a red explosion
							server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#db4e22");
						}
						break;
						
					default:
						// Collision with obstacle, item, or world boundary
						server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#96e0ff");
						break;
				}

				if (owner != undefined) {
					if (owner.weapons[this.type] < properties.numAllowed) {
						owner.weapons[this.type]++;
					}
					owner.canShoot = true;
				}
			},
			'drawCallback': function(server, context, properties) {
				context.beginPath();
				context.lineWidth = 10;
				context.strokeStyle = "rgb(53, 62, 68)";
				context.fillStyle = "rgb(0, 0, 0)";
				context.arc(0, 0, properties.radius, 0, 2 * Math.PI);
				context.stroke();
				context.fill();
				context.closePath();
			},
		},
	};
	

	// Dictionary of items
	// --------------------------------------------------

	this.properties.items = {
		'health': {
			'strength': 25,
			'num': 2,
			'radius': 16,
			'movementCallback': function(server, properties) {
				// Don't move health packs
				return { 'x': this.x, 'y': this.y };
			},
			'collisionCallback': function(server, collision, properties) {
				// Remove it from gameplay
				this.remove = true;

				switch (collision.type) {
					case "bot":
						// Add to the health of the bot that touched the health pack
						bot = collision.object;
						bot.health += properties.strength;
						break;

					default:
						// Collision with weapon (make it blow up)
						server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#96e0ff");
						break;
				}
			},
			'drawCallback': function(server, context, properties) {
				var start = properties.radius / 2;

				context.beginPath();
				context.fillStyle = "rgb(123, 168, 98)";
				context.fillRect(-start, -start, properties.radius, properties.radius);
				context.fill();
				context.closePath();

				var cross = properties.radius * .3;

				context.beginPath();
				context.fillStyle = "rgb(255, 255, 255)";
				context.fillRect(-2, -cross, 4, cross * 2);
				context.fillRect(-cross, -2, cross * 2, 4);
				context.fill();
				context.closePath();
			},
		},
		'ammo': {
			'bullets': 10,
			'mines': 5,
			'num': 2,
			'radius': 16,
			'movementCallback': function(server, properties) {
				// Don't move ammo packs
				return { 'x': this.x, 'y': this.y };
			},
			'collisionCallback': function(server, collision, properties) {
				// Remove it from gameplay
				this.remove = true;

				switch (collision.type) {
					case "bot":
						// Add to the ammo of the bot that touched the pack
						bot = collision.object;

						bot.weapons.bullets += properties.bullets;
						bot.weapons.mines += properties.mines;
						bot.canShoot = true;

						break;

					default:
						// Collision with weapon (make it blow up)
						server.createParticleExplosion(collision.pos.x, collision.pos.y, 16, 8, 4, 20, "#96e0ff");
						break;
				}
			},
			'drawCallback': function(server, context, properties) {
				var start = properties.radius / 2;

				context.beginPath();
				context.fillStyle = "rgb(34, 44, 64)";
				context.fillRect(-start, -start, properties.radius, properties.radius);
				context.fill();
				context.closePath();

				var cross = properties.radius * .3;

				context.beginPath();
				context.fillStyle = "rgb(164, 174, 194)";
				context.arc(0, 0, properties.radius * .2, 0, 2 * Math.PI);
				context.fill();
				context.closePath();
			},
		},
	};


	// Dictionary of commands
	// --------------------------------------------------

	this.commands = {
		"forward": function(bot) {
			return this.server.helpers.calcVector(bot.x, bot.y, bot.angle, this.properties.bots.speed);
		},

		"backward": function(bot) {
			return this.server.helpers.calcVector(bot.x, bot.y, bot.angle, -this.properties.bots.speed);
		},

		"left": function(bot) {
			bot.angle -= this.properties.bots.angleStep;
		},

		"right": function(bot) {
			bot.angle += this.properties.bots.angleStep;
		},

		"strafe-left": function(bot) {
			return this.server.helpers.calcVector(bot.x, bot.y, bot.angle - (Math.PI / 2), this.properties.bots.speed);
		},

		"strafe-right": function(bot) {
			return this.server.helpers.calcVector(bot.x, bot.y, bot.angle + (Math.PI / 2), this.properties.bots.speed);
		},

		"fire": function(bot) {
			// TODO: modify to allow for other weapon types
			if (bot.weapons.bullet > 0 && bot.canShoot && bot.waitFire <= 0) {
				bot.weapons.bullet--;
				bot.canShoot = false;
				bot.waitFire = this.properties.weapons.bullet.waitTime;

				var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, bot.radius);

				this.server.addWeapon({ "x": pos.x, "y": pos.y, "angle": bot.angle, "owner": bot.id, "type": "bullet", "speed": this.properties.weapons.bullet.speed, "remove": false });
			}
		},

		"mine": function(bot) {
			if (bot.weapons.mine > 0) {
				bot.weapons.mine--;
				bot.canShoot = false;
				bot.waitFire = this.properties.weapons.mine.waitTime;

				var pos = this.server.helpers.calcVector(bot.x, bot.y, bot.angle, -(bot.radius * 2 + 5));
				this.server.addWeapon({ "x": pos.x, "y": pos.y, "angle": bot.angle, "owner": bot.id, "type": "mine", "speed": 0, "remove": false });
			}
		}, 

		"wait": function(bot) { }
	};


	// Reset any properties for the beginning of a new game
	// --------------------------------------------------

	this.resetGame = function() { };


	// Register a bot script
	// --------------------------------------------------
	// Returns an array of bots (based on botsPerTeam)

	this.registerBotScript = function(teamNum, botScript, name) {
		var botList = [];
		var fn = (window || this);

		// Create botsPerTeam # of bots
		for (var i=0; i<this.properties.botsPerTeam; i++) {
			// Instantiate the class
			var bot = new fn[botScript]();

			// Assign the team name and color
			bot.name = name;
			bot.color = this.properties.bots.colors[teamNum - 1];

			botList.push(bot);
		}

		return botList;
	};


	// Generate obstacles
	// --------------------------------------------------
	// Returns array of obstacles

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


	// Generate items
	// --------------------------------------------------
	// Returns array of items

	this.generateItems = function() {
		var items = [];

		// Go through each type of item
		for (var i in this.properties.items) {
			var itemType = this.properties.items[i];

			// Loop to make sure we're putting items in acceptable places
			for (j=0; j<itemType.num; j++) {
				clear = false;

				while (!clear) {
					var p = this.server.getRandomPoint();

					// Check boundaries and adjust if necessary
					if (p.x + itemType.radius > (this.properties.world.width - 50)) {
						p.x -= itemType.radius;
					}

					if (p.y + itemType.radius > (this.properties.world.height - 50)) {
						p.y -= itemType.radius;
					}

					// TODO: check to make sure these don't overlap with obstacles
					clear = true;
				}

				items.push({
					"x": p.x,
					"y": p.y,
					"radius": itemType.radius,
					"strength": itemType.strength,
					"type": i,
					"remove": false,
			   	});
			}
		}

		return items;
	};


	// Initialize bot
	// --------------------------------------------------
	// Updates object in place

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

		bot.radius = this.properties.bots.radius;
	};


	// Post-init bot setup
	// --------------------------------------------------

	this.postInitBot = function(bot) { };


	// Set initial placement
	// --------------------------------------------------
	// Updates object in place

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


	// Initialize game
	// --------------------------------------------------

	this.initializeGame = function() { };


	// Parse command
	// --------------------------------------------------

	this.parseCommand = function(command, bot) {
		var callback = this.commands[command];
		if (callback) {
			return callback.call(this, bot);
		}
	};


	// Do collision detection
	// --------------------------------------------------
	
	this.checkCollisions = function(bot, newPosition) {
		// If we haven't moved, check the bot's current x/y
		if (newPosition == undefined) {
			newPosition = { x: bot.x, y: bot.y };
		}

		// Set it to the desired new coordinates
		oldX = bot.x;
		oldY = bot.y;
		bot.x = newPosition.x;
		bot.y = newPosition.y;
		bot.collisions = this.server.getCollisions(bot);

		// Check new coordinates for collisions
		if (bot.collisions.length > 0) {
			bot.x = oldX;
			bot.y = oldY;
		} 
	}


	// Postprocess bot
	// --------------------------------------------------

	this.postProcess = function(bot) { };


	// Start round
	// --------------------------------------------------

	this.startRound = function(clicks) { };	


	// End-round hook
	// --------------------------------------------------

	this.endRound = function() { };


	// Game over condition
	// --------------------------------------------------
	
	this.isStalemate = function() {
		// if there is no damage delivered by any team for 1000 ticks, stalemate
		var stale = false;
		var bots = server.getBots();

		if (!this.previous_state) {
			this.previous_state = {
				'botshealth': 0,
			};

			this.staleTicks = 0;
		}

		currentState = {
			'botshealth': 0,
		};

		for (i in bots) {
			currentState['botshealth'] += bots[i].health;
		}

		if (this.previous_state['botshealth'] == currentState['botshealth']) {
			this.staleTicks++;
		} else {
			this.staleTicks = 0;
		}

		this.previous_state = currentState;

		if (this.staleTicks >= 1000) {
			return true;
		}

		return false;
	}

	this.gameOver = function() {
		var teamHealth = this.getHealth();

		// If only one team is at health > 0, game over
		var teamsAlive = 0;
		var num = 1;
		for (var key in teamHealth) {
			var stillAlive = false;
			var bots = server.getBots();

			for (i in bots) {
				if (bots[i].name == key && bots[i].alive) {
					stillAlive = true;
				}
			}

			// This team is still alive
			if (stillAlive) {
				teamsAlive++;
			} else {
				// It's dead, so mark it as dead
				$("#status .team[data-team=" + num + "] .name").addClass("dead");
			}

			num++;
		}	

		if (teamsAlive == 1 || this.isStalemate()) {
			return true;
		}

		return false;
	};

	// Get winner
	// --------------------------------------------------

	this.getWinner = function() {
		var teamHealth = this.getHealth();

		if (this.isStalemate()) {
			return 'stalemate';
		}

		// The team with health > 0 is the one who won
		for (var key in teamHealth) {
			if (teamHealth[key] > 0) return key;
		}	

		return '';
	};


	// Reset collision flags
	// --------------------------------------------------

	this.resetCollisionFlag = function(bot) {
		bot.hitByBullet = false;
	};	


	// Update bot flags
	// --------------------------------------------------

	this.updateFlags = function(bot) {
		// Update wait counter
		if (bot.waitFire > 0) {
			bot.waitFire--;
		} else {
			bot.canShoot = true;
		}

		// Set alive flag
		if (bot.health <= 0) {
			bot.alive = false;
		}
	};


	// Update bot hook
	// --------------------------------------------------

	this.updateBot = function(bot, pos) {
		return pos;
	};


	// Update health
	// --------------------------------------------------
	// Returns the health for each team

	this.getHealth = function() {
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


	// Drawing code
	// --------------------------------------------------

	this.draw = {};

	this.draw.width = this.properties.world.width;
	this.draw.height = this.properties.world.height;
	this.draw.ruleset = this;
	this.draw.server = this.server;

	this.draw.world = function() {
		// Clear background
		this.clear();

		// Draw background layer
		this.backgroundLayer();

		// Draw health
		this.health();

		// Draw obstacles
		this.obstacles();

		// Draw items
		this.items();

		// Draw weapons
		var weapons = server.getWeapons();
		for (i in weapons) {
			var weapon = weapons[i];

			this.weapon(weapon.x, weapon.y, weapon.angle, weapon.type, weapon.owner, weapon);
		}

		// Draw bots
		var bots = server.getBots();
		for (i in bots) {
			var bot = bots[i];

			if (bot.alive) {
				this.bot(bot.x, bot.y, bot.angle, bot.color, bot.radius, bot.health);
			}
		}

		// Draw fx particles
		this.particles();

		// Draw foreground layer
		this.foregroundLayer();
	};


	// Clear background
	// --------------------------------------------------

	this.draw.clear = function() {
		this.c.clearRect(0, 0, this.width, this.height);
	};


	// Background layer (just after clearing)
	// --------------------------------------------------

	this.draw.backgroundLayer = function() {
		this.c.strokeStyle = "#181818";

		for (var x=20; x<this.width; x+=20) {
			this.c.moveTo(x, 0);
			this.c.lineTo(x, this.height);
		}

		for (var y=20; y<this.height; y+=20) {
			this.c.moveTo(0, y);
			this.c.lineTo(this.width, y);
		}

		this.c.stroke();
	};


	// Foreground layer (drawn last of all)
	// --------------------------------------------------

	this.draw.foregroundLayer = function() { };


	// Temp debug (draw mini obstacles for pathfinding)
	// --------------------------------------------------

	this.draw.miniObs = function() {
		this.c.strokeStyle = "#fff";
		this.c.fillStyle = "rgba(0,0,255,0.3)";
		for (i in server.miniObstacles) {
			obs = server.miniObstacles[i];
			this.c.beginPath();
			if (obs.radius != undefined) {
				this.c.arc(obs.x, obs.y, obs.radius, 0, 2 * Math.PI);
			}
			this.c.closePath();
			this.c.fill();
			this.c.stroke();
		}
	};


	// Draw obstacles loop
	// --------------------------------------------------

	this.draw.obstacles = function() {
		var obstacles = this.server.getObstacles();

		this.c.save();

		for (i in obstacles) {
			this.obstacle(obstacles[i]);
		}

		this.c.restore();
	};


	// Draw an obstacle
	// --------------------------------------------------

	this.draw.obstacle = function(obstacle) {
		this.c.strokeStyle = "#33383a";
		this.c.lineWidth = 3;
		this.c.fillStyle = "rgba(140, 160, 180, 0.15)";

		this.c.beginPath();
		this.c.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
		this.c.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
	}


	// Draw a bot
	// --------------------------------------------------

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


	// Draw a weapon
	// --------------------------------------------------

	this.draw.weapon = function(x, y, angle, type, owner, obj) {
		this.c.save();
		this.c.translate(x, y);
		this.c.rotate(angle);

		// Callback
		var props = this.ruleset.properties;
		var objProps = props.weapons[type];
		var drawFunction = props.weapons[type].drawCallback;

		var server = this.server;
		var context = this.c;
		drawFunction.call(obj, server, context, objProps);

		this.c.restore();
	};


	// Draw items
	// --------------------------------------------------

	this.draw.items = function() {
		var items = this.server.getItems();

		for (i in items) {
			var item = items[i];

			this.c.save();
			this.c.translate(item.x, item.y);

			// Callback
			var props = this.ruleset.properties;
			var objProps = props.items[item.type];
			var drawFunction = props.items[item.type].drawCallback;

			var server = this.server;
			var context = this.c;
			drawFunction.call(item, server, context, objProps);

			this.c.restore();
		}

		this.c.restore();
	};


	// Loop through fx particles
	// --------------------------------------------------

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
	// --------------------------------------------------

	this.draw.particle = function(particle, newPos) {
		this.c.beginPath();
		this.c.strokeStyle = particle.color;
		this.c.moveTo(particle.x, particle.y);
		this.c.lineTo(pos.x, pos.y);
		this.c.globalAlpha = particle.life / 20;
		this.c.stroke();
		this.c.closePath();
	}


	// Draw the health (status bar)
	// --------------------------------------------------

	this.draw.health = function() {
		var teamHealth = this.ruleset.getHealth();
		var numBots = this.ruleset.properties.botsPerTeam;

		var i = 0;
		for (var key in teamHealth) {
			var teamNum = i + 1;

			var health = teamHealth[key] / numBots;

			if (health > 100) {
				health = 100;
			}

			$("#status .team[data-team=" + teamNum + "] .health").css("width", health + "%");

			i++;
		}
	};


	// Draw the paused state
	// --------------------------------------------------

	this.draw.paused = function() {
		var lineWidth = 15;
		var distanceBetween = 15;

		var pauseWidth = lineWidth + distanceBetween;
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


	// Draw the endgame state
	// --------------------------------------------------

	this.draw.endgame = function(winner) {
		// Transparent black overlay
		this.c.save();
		this.c.beginPath();
		this.c.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.c.fillRect(0, 0, this.width, this.height);
		this.c.closePath();

		// Get the winning team
		if (winner == 'stalemate') {
			// Champion banner
			var bannerTop = this.height * .3;
			var bannerBottom = this.height * .7;
			this.c.beginPath();
			this.c.fillStyle = "rgba(0, 0, 0, 0.9)";
			this.c.fillRect(0, bannerTop, this.width, bannerBottom - bannerTop);
			this.c.moveTo(0, bannerTop);
			this.c.lineTo(this.width, bannerTop);
			this.c.moveTo(0, bannerBottom);
			this.c.lineTo(this.width, bannerBottom);
			this.c.strokeStyle = "#3f3f3f";
			this.c.lineWidth = 5;
			this.c.stroke();
			this.c.closePath();
			this.c.restore();

			// Draw "Stalemate"
			var centerX = (this.width / 2) - 5;
			// TODO: figure out why we need - 5 to get it centered

			this.c.save();
			this.c.textAlign = 'center';

			this.c.fillStyle = "#fff";
			this.c.font = "bold 56px Helvetica, Arial, sans-serif";
			this.c.fillText("STALEMATE", centerX, this.height * .48);

			this.c.closePath();
			this.c.restore();
		} else {
			var bots = this.server.getBots();
			var team = undefined;
			for (i in bots) {
				if (bots[i].name == winner) team = bots[i];
			}
			if (team === undefined) return;

			// Champion banner
			var bannerTop = this.height * .3;
			var bannerBottom = this.height * .7;
			this.c.beginPath();
			this.c.fillStyle = "rgba(0, 0, 0, 0.9)";
			this.c.fillRect(0, bannerTop, this.width, bannerBottom - bannerTop);
			this.c.moveTo(0, bannerTop);
			this.c.lineTo(this.width, bannerTop);
			this.c.moveTo(0, bannerBottom);
			this.c.lineTo(this.width, bannerBottom);
			this.c.strokeStyle = team.color;
			this.c.lineWidth = 5;
			this.c.stroke();
			this.c.closePath();
			this.c.restore();

			// Draw bot with team name
			var centerX = (this.width / 2) - 5;
			// TODO: figure out why we need - 5 to get it centered

			this.c.save();
			this.c.textAlign = 'center';

			this.c.fillStyle = "#555";
			this.c.font = "24px Helvetica, Arial, sans-serif";
			this.c.fillText("CHAMPION", centerX, this.height * .40);

			this.c.fillStyle = "#fff";
			this.c.font = "bold 56px Helvetica, Arial, sans-serif";
			this.c.fillText(team.name, centerX, this.height * .48);

			this.bot(centerX, this.height * .57, 3 * Math.PI / 2, team.color, team.radius * 2.2, 100);

			this.c.closePath();
			this.c.restore();
		}
	};
};
