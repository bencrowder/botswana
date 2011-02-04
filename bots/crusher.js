function CrusherBot(botname) {
	this.name = botname;

	this.x;
	this.y;
	this.angle;
	this.health;

	this.state = { world: {}, bots: {}, bullets: {} };

	this.setup = function() {
		this.timer = 0;			// keep track of how many clicks
	}

	this.run = function() {
		// get the opponent's information
		for (i in bots) {
			var bot = bots[i];
			if (bot.name != this.name) {
				ox = bot.x;
				oy = bot.y;
				opponent_angle = bot.angle;
			}
		}

		this.timer++;

//		if (this.timer % 5 == 0) {
		var dx = ox - this.x;
		var dy = oy - this.y;
		target_angle = 1 / Math.tan(dx / dy);
	
		var x = this.x;
		var y = this.y;

		if (ox > x && oy < y) {
			target_angle = target_angle;
		} else if (ox < x && oy < y) {
			target_angle = target_angle + (Math.PI / 2);
		} else if (ox > x && oy > y) {
			target_angle = target_angle + Math.PI;
		} else if (ox > x && oy > y) {
			target_angle = target_angle + (3*Math.PI / 2);
		} else if (ox == x && oy > y) {
			target_angle = 3 * Math.PI / 2;
		} else if (ox == x && oy < y) {
			target_angle = Math.PI / 2;
		} else if (oy == y && ox < x) {
			target_angle = Math.PI;
		} else if (oy == y && ox > x) {
			target_angle = 0;
		}
		
		if (this.angle > target_angle) {
			return "right";
		} else {
			return "left";
		}
			/*
		} else {
			return "forward";
		}
		*/
	}
}

var crusherbot = new CrusherBot("Crusher");

registerBot(crusherbot);
