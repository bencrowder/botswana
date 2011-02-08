var StealthBot = function() {};
StealthBot.prototype = new Bot("Stealth");
StealthBot.prototype.setup = function() {
	this.timer = 0;
	this.hit = 0;
};

StealthBot.prototype.run = function() {
	this.timer++;
	if (this.hitByBullet) {
		this.hit = 20;
	}
	if (this.hit > 0) {
		if (this.timer % 7 == 0) {
			return "left";
		} else {
			return "forward";
		}
		this.hit--;
	} else {
		return "forward";
	}
};

var stealthbot = new StealthBot();
server.registerBot(stealthbot);
