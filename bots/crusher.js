var CrusherBot = function() {};

CrusherBot.prototype = new Bot("Crusher");

CrusherBot.prototype.setup = function() {
	this.timer = 0;			// keep track of how many clicks
	this.attrStrength = 6;
	this.safety = 6;
	this.repStrength = 2;
};

CrusherBot.prototype.run = function() {
	this.timer++;
	target = undefined;

	rtnCommand = '';
	// get the opponent's information
	teamStuff = this.state.payload;
	if (typeof teamStuff.targets == 'undefined') {
		teamStuff.targets = {}
		myteam = [];
		oppteam = [];
		for (i in this.state.bots) {
			var bot = this.state.bots[i];
			if (bot.name != this.name) {
				oppteam.push(bot.id);
			} else {
				myteam.push(bot.id);
			}
		}
		for (i in myteam) {
			teamStuff.targets[myteam[i]] = oppteam[i]
		}
	}
	for (i in this.state.bots) {
		var bot = this.state.bots[i];
		if (bot.id == teamStuff.targets[this.id]) {
			target = bot;
		}
	}

	if (target != undefined) {
		dir = this.getDirection(target);
		dist = distanceToPoint(this.x, this.y, target.x, target.y);

		if (dir > 0.05) {
			rtnCommand = "right";
		} else if (dir < -0.05) {
			rtnCommand = "left";
		} else {
			if (dist > 20 * this.radius) {
				rtnCommand = "forward";
			} else if (this.canShoot) {
				rtnCommand = "fire";
			} else {	
				rtnCommand = "forward";
			}
		}
	} else {
		rtnCommand = "wait";
	}
	return {'command': rtnCommand, 'team': {}}
};

var crusherbot = new CrusherBot();
crusherbot.className = "CrusherBot";

server.registerBotScript(crusherbot);
