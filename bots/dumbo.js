var Dumbo = function() {};

Dumbo.prototype = new Bot();

Dumbo.prototype.setup = function() {
	this.timer = 0;
	this.hit = 0;
};

Dumbo.prototype.run = function() {
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

server.registerBotScript("Dumbo");
