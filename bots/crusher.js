var CrusherBot = function() {};

CrusherBot.prototype = new Bot("Crusher");

CrusherBot.prototype.setup = function() {
	this.timer = 0;			// keep track of how many clicks
	this.attrStrength = 7;
	this.safety = 8;
	this.repStrength = 2.5;
	this.strafe = 50;
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
		dir = this.getDirection(target, 0.05);
		dist = this.myDistanceToPoint(target.x, target.y);

		if (dir.command != 'forward') {
			rtnCommand = dir.command;
		} else {
			if (dist > 10 * this.radius) {
				rtnCommand = "forward";
			} else if (this.canShoot && this.weapons.bullet > 0) {
				rtnCommand = "fire";
			} else {
				if (this.strafe > 25) {
					rtnCommand = "strafe-left";
				} else {
					rtnCommand = "strafe-right";
				}
				this.strafe--;
				if (this.strafe == 0) {
					this.strafe = 50;
				}
			} 
		}
	} else {
		rtnCommand = "wait";
	}
	//console.log(this.id, rtnCommand)
	return {'command': rtnCommand, 'team': {}}
};

var crusherbot = new CrusherBot();
crusherbot.className = "CrusherBot";

server.registerBotScript(crusherbot);
