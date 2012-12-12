/* Demo ruleset #1 */

var ruleset = server.getRuleset();
ruleset = new Ruleset(server);

ruleset.properties.botsPerTeam = 4;

ruleset.commands.teleport = function(bot) {
	// Get a random position
	botPos = server.getRandomPoint();
	bot.x = botPos.x;
	bot.y = botPos.y;

	// Loop until we get a position that doesn't collide
	while (this.server.collisionBotObjects(bot)) {
		botPos = this.server.getRandomPoint();
		bot.x = botPos.x;
		bot.y = botPos.y;
	} 
}

server.setRuleset(ruleset);
