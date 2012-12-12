// Conveyor ruleset
//
// World is split into conveyor belts, pushing bots up and down

var ruleset = new Ruleset(server);

ruleset.properties.botsPerTeam = 6;
ruleset.properties.world.slabs = 8;		// How many slabs
ruleset.properties.slabSlide = 1.5;		// How much the belt slides the bots

ruleset.generateObstacles = function() {
	return [];
};

ruleset.postUpdateBot = function(bot) {
	// Figure out which slab they're on
	slabNum = Math.floor(bot.x / ruleset.properties.world.width * ruleset.properties.world.slabs);
	
	// Move them up or down (depending on if the slab is even or odd);
	multiplier = (slabNum % 2 == 0) ? -1 : 1;
	bot.y += ruleset.properties.slabSlide * multiplier;
};

ruleset.draw.backgroundLayer = function() {
	this.c.save();

	var slabWidth = ruleset.properties.world.width / ruleset.properties.world.slabs;
	var fillStyles = [ "#163128", "#251631" ];

	for (x=0; x<ruleset.properties.world.slabs; x++) {
		this.c.fillStyle = fillStyles[x % 2]; // alternate fill styles

		this.c.beginPath();
		this.c.fillRect(x * slabWidth, 0, slabWidth, ruleset.properties.world.height);
		this.c.closePath();

		this.c.fill();
	}

	this.c.restore();
};

server.setRuleset(ruleset);
