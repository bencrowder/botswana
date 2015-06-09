# Botswana

A web-based game with programmable bots (in Javascript).  [Live demo here.](http://bencrowder.github.com/botswana/)


## Usage

- Choose the bots you want to fight (and you can add custom bots via URL)
- If you want to use a different ruleset, add it via the box at the bottom
- Press `Start`.
- Hit the space bar to pause.


## Included bots

- Crusher
- Destroyer
- Dumbo: very simple bot
- Teleporter: for use with teleport ruleset
- SampleBot: empty bot
- Xavier


## Included rulesets

- default
- demo1: smaller bots, set obstacles, set initial placement, various parameter tweaks
- demo2: completely redone drawing code
- demo3: faster bullets, different look, CSS 3D transform
- orbit: bots orbit around the center point
- conveyor: different strips of the world move bots up or down
- expulsion: adds teleportation circle in center of world, varying bot radii
- teleport: adds "teleport" command (see the Teleporter bot)
- walls: moving walls, larger world


## How to write a bot

All bots inherit from the parent Bot class in `bots/bot.js`. A bot script will be instantiated a number of times, depending on the `ruleset.properties.bots.botsPerTeam` value.


### Properties of the parent bot class

- name: team name
- id: numeric id
- x, y: coordinates of the bot's current location
- color: the assigned team color (from the ruleset)
- angle: the bot's current angle in radians
- radius: size of bot
- health: from 0 to 100
- alive: boolean
- weapons: object with number of remaining ammo for each weapon type
- canShoot: boolean
- waitFire: number of clicks to wait before firing
- collided: boolean
- hitByBullet: boolean


### Methods exposed by the parent bot class

- `this.distanceToPoint(x1, y1, x2, y2)`: returns distance from point 1 to point 2
- `this.myDistanceToPoint(x, y)`: returns distance from the bot to the point
- `this.getDirection(target, threshold)`: basic pathfinding helper function. Uses fields to avoid obstacles. `target` needs to have `x` and `y` properties (point, bot, etc.). A threshold of `0.05` works well. Returns an object:
	- response.command: the bot command needed to move closer to the target
	- response.angle: the angle to the target


### Bot script template

The minimum code required for a bot:

	var NewBot = function() {};

	NewBot.prototype = new Bot();

	server.registerBotScript("NewBot");

The game engine calls each bot's setup() function at the beginning of the game.

	NewBot.prototype.setup = function() {
		// Do stuff here
	};

And then each click, it calls the bot's run() function. This is where the bulk of the bot logic should go.

	NewBot.prototype.run = function() {
		return { command: 'wait', team: {} };
	};

The run() function returns an object with two properties:

- `command`: the bot's command for this round (a string). Default commands (rulesets may add or modify commands):
	- `forward`
	- `backward`
	- `left`
	- `right`
	- `fire`
	- `mine`
	- `strafe-left`
	- `strafe-right`
	- `wait`
- `team`: an object that will get sent to the other bots on the team. You can access it via `this.state.payload`.


### State available to bots

A list of properties available under `this.state`:

- `world`: a copy of `ruleset.properties.world`. In general, there are `width` and `height` properties that let you know how big the world is.
- `bots`: an array of all the currently living bots.
	- `id`: bot's unique ID (integer)
	- `name`: bot's team name
	- `x` and `y`: bot's location
	- `angle`: angle the bot is pointing
	- `health`: the current health of the bot (0–100)
- `obstacles`: an array of all the obstacles. Each obstacle has the following properties:
	- `x` and `y`: coordinates for the upper left corner of the obstacle
	- `width`: width of obstacle
	- `height`: height of obstacle
- `items`: an array of all the items. Each item has the following properties:
	- `x` and `y`: coordinates for the center of the item
	- `radius`: radius of item
	- `type`: type, currently only `health` and `ammo` are supported (but rulesets may add new items)
- `weapons`: an array of all the weapons currently in play. Each weapon has the following properties:
	- `x` and `y`: weapon's location
	- `angle`: angle the weapon is pointing
	- `owner`: ID for the bot who fired the weapon
	- `type`: string, currently only `bullet` and `mine` are supported (but rulesets may add new weapons)
- `payload`: object passed in via the `team` property returned from the bot's run() command


## How to write a ruleset

Custom rulesets allow you to modify game parameters and dynamics.


### Custom ruleset template

Minimum code required for a custom ruleset:

	var ruleset = new Ruleset(server);

	ruleset.name = "customrulesetname";

	// Ruleset tweaks go here

	server.setRuleset(ruleset);

Anything in the ruleset is tweakable. For example, to change existing properties or add new ones:

	// Tweaking an existing property
	ruleset.properties.botsPerTeam = 5;

	// Adding a new property
	ruleset.properties.confundusCharm = 10;

To add a new command (see teleport):

	// Adds "pulse" as a command available to bots
	ruleset.commands.pulse = function(bot) {
		// Do things
	}

And since it's an HTML/CSS game, you can also include DOM changes (see demo2):

	$("body").css("background", "#f00");	// Don't do this


### Available properties

- `properties`
	- `weapons`
	- `items`
- `commands`
	- If a command moves a bot, it should return a position object; otherwise it need not return anything.


### Available functions

- `resetGame()`: called at the beginning of a new game
- `registerBotScript(teamNum, botScript, name)`: registers a new bot script (you generally won't want to change this)
- `generateObstacles()`: returns array of obstacles (objects with `x`, `y`, `width`, and `height` properties)
- `generateItems()`: returns array of items (objects with `x`, `y`, `radius`, and `type` properties)
- `initializeBot(bot, id)`: initialize bot (you generally won't want to change this)
- `postInitBot(bot)`: post-init per-bot setup hook
- `setInitialPlacement(bot)`: sets `bot.x` and `bot.y` at the beginning of each game
- `initializeGame()`: game init hook
- `startRound(clicks)`: called at the beginning of each round
- `resetCollisionFlags(bot)`: resets collision flags
- `updateFlags(bot)`: updates bot flags and counters
- `updateBot(bot, pos)`: hook to allow the server to move bots (see orbit, conveyor)
- `parseCommand(command, bot)`: parses command (you generally won't want to change this)
- `checkCollisions(bot, newPosition)`: checks for collisions
- `postProcess(bot)`: called after each bot is processed
- `endRound()`: called at the end of each round
- `gameOver()`: returns true or false depending on if game over conditions have been met
- `getWinner()`: returns name of the team who won
- `getHealth()`: returns array of combined health for each team


### Drawing functions

These are part of `ruleset`. To add new functions, modify `draw.world()`.

- `draw.world()`: draws everything in order (clear, backgroundLayer, health, obstacles, bots, weapons, particles, foregroundLayer)
- `draw.clear()`: clears the canvas
- `draw.backgroundLayer()`: draws the background layer (default ruleset draws a grid)
- `draw.foregroundLayer()`: draws the foreground layer (default is nothing)
- `draw.obstacles()`: loops through obstacles and calls `draw.obstacle` for each one (you probably won't need to modify this)
- `draw.obstacle(obstacle)`: draws an obstacle
- `draw.items()`: loops through items and calls their callbacks
- `draw.bot(x, y, angle, color, radius, health)`: draws a bot
- `draw.weapon(x, y, angle, type, owner, obj)`: draws a weapon (bullet, mine, etc.)
- `draw.particles()`: loops through particles, runs the decay on each (TODO: move this out of drawing code), and calls `draw.particle` for each one (you probably won't need to modify this)
- `draw.particle(particle, newPos)`: draws a particle
- `draw.health()`: modifies the HTML elements that store the health
- `draw.paused()`: draws the paused state (dark overlay, white pause icon)
- `draw.endgame(winner)`: draws the endgame state


### Drawing properties

These are part of `ruleset`.

- `draw.width`: if you modify `properties.world.width`, modify this as well
- `draw.height`: if you modify `properties.world.height`, modify this as well
- `draw.ruleset`: makes the ruleset object available to drawing code
- `draw.server`: makes the server object available to drawing code
