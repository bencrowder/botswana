# Botswana

A web-based game with programmable bots (in Javascript).

## Usage

* Enter the URLs to your bots in the two script boxes.
* If you want to use a different ruleset, enter the URL in the ruleset script box.
* Press Start Tournament.
* Hit space to pause.

## How to write a bot

All bots inherit from the parent Bot class in `bots/bot.js`.

### Properties of the parent bot class

* name: team name
* id: numeric id
* x, y: coordinates of the bot's current location
* color: the assigned team color (from the ruleset)
* angle: the bot's current angle in radians
* radius: size of bot
* health: from 0 to 100
* alive: boolean
* weapons: object with number of remaining ammo for each weapon type
* canShoot: boolean
* waitFire: number of clicks to wait before firing
* collided: boolean
* hitByBullet: boolean

### Methods exposed by the parent bot class

* `this.distanceToPoint(x1, y1, x2, y2)`: returns distance from point 1 to point 2
* `this.myDistanceToPoint(x, y)`: returns distance from the bot to the point
* `this.getDirection(target, threshold)`: basic pathfinding helper function. Uses fields to avoid obstacles. `target` needs to have `x` and `y` properties (point, bot, etc.). A threshold of `0.05` works well. Returns an object:
	* response.command: the bot command needed to move closer to the target
	* response.angle: the angle to the target

### Writing a new bot

The core structure for a bot is shown in `bots/samplebot.js`.


## How to write a ruleset
