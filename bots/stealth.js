function StealthBot(botname) {
	this.name = botname;

	this.x;
	this.y;
	this.angle;
	this.health;

	this.state = { world: {}, bots: {}, bullets: {} };

	this.setup = function() {
		// if we wanted to do any setup, we'd do it here
	}

	this.run = function() {
		// check state

		// return a command
		command = "left";

		return command;
	}
}

var stealthbot = new StealthBot("Stealth");

registerBot(stealthbot);
