var DumboBot = function() {};

DumboBot.prototype = new Bot("Dumbo");

DumboBot.prototype.setup = function() {
	this.timer = 0;
	this.hit = 0;
};

DumboBot.prototype.run = function() {
	this.timer++;
	if (this.hitByBullet) {
		this.hit = 10;
	}
	if (this.hit > 0) {
		if (this.timer % 5 == 0) {
			return "left";
		} else {
			return "forward";
		}
		this.hit--;
	} else {
		return "fire";
	}
};

var dumbobot = new DumboBot();

server.registerBot(dumbobot);
