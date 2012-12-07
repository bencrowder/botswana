var Dumbo = function() {};

Dumbo.prototype = new Bot();

Dumbo.prototype.setup = function() {
	this.timer = 0;
	this.hit = 0;
};

Dumbo.prototype.run = function() {
	this.timer++;
	command = 'wait';
	if (this.hitByBullet) {
		this.hit = 10;
	}
	if (this.hit > 0) {
		if (this.timer % 5 == 0) {
			command = "left";
		} else {
			command = "forward";
		}
		this.hit--;
	} else {
		command = "fire";
	}
	return {'command': command, 'team': {}};
};

server.registerBotScript("Dumbo");
