function CrusherBot(botname) {
	this.name = botname;

	this.x;
	this.y;
	this.angle;
	this.health;

	this.state = { world: {}, bots: {}, bullets: {} };

	this.setup = function() {
		this.timer = 0;			// keep track of how many clicks
		this.cmd = 0;			// which command to use
		this.commands = ["forward", "right", "forward", "left"];
	}

	this.run = function() {
		// check state
		if (this.timer % 20 == 0) {
			this.cmd += 1;
			if (this.cmd > 3) { this.cmd = 0; }
		}

		this.timer++;

		return this.commands[this.cmd];
	}
}

var crusherbot = new CrusherBot("Crusher");

registerBot(crusherbot);
