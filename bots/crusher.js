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
		dir = this.getDirection(target, 0.06);
		//dist = this.distanceToPoint(this.x, this.y, target.x, target.y);
		dist = this.myDistanceToPoint(target.x, target.y);
		//console.log(this.canShoot, this.weapons, dist, this.radius);

		if (dir.command != 'forward') {
			rtnCommand = dir.command;
		} else {
			if (dist > 10 * this.radius) {
				rtnCommand = "forward";
			} else if (this.canShoot && this.weapons.bullet > 0) {
				rtnCommand = "fire";
			} else {	
				rtnCommand = "strafe-left";
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
