/* Demo ruleset #1 */

var ruleset = new Ruleset(server);

ruleset.properties.botsPerTeam = 3;
ruleset.properties.bloating = 1;		// how much bigger a bot gets from teleporting
ruleset.properties.teleportWait = 30;	// only allow teleporting once every 30 clicks

teleportTime = 30;						// for now, a global (figure out a better way to do it)

// Add a new "teleport" command
ruleset.commands.teleport = function(bot) {
	if (teleportTime == 0) {
		// Get a random position
		botPos = server.getRandomPoint();
		bot.x = botPos.x;
		bot.y = botPos.y;

		// Loop until we get a position that doesn't collide with anything
		while (this.server.collisionBotObjects(bot)) {
			botPos = this.server.getRandomPoint();
			bot.x = botPos.x;
			bot.y = botPos.y;
		} 

		if (bot.radius < 30) {
			bot.radius += ruleset.properties.bloating;
		}

		// Reset the teleport wait counter
		teleportTime = ruleset.properties.teleportWait;
	}
}

ruleset.startRound = function(clicks) {
	// Decrease the teleport wait counter
	if (teleportTime > 0) {
		teleportTime--;
	}
}

server.setRuleset(ruleset);
