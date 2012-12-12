// Conveyor ruleset
//
// World is split into conveyor belts, pushing bots up and down

var ruleset = new Ruleset(server);

ruleset.properties.botsPerTeam = 6;
ruleset.properties.bots.radius = 12;
ruleset.properties.world.slabs = 8;		// How many slabs
ruleset.properties.slabSlide = 1.5;		// How much the belt slides the bots

ruleset.generateObstacles = function() {
	return [];
};

ruleset.updateBot = function(bot, pos) {
	// Use the latest position
	if (pos == undefined) {
		pos = { x: bot.x, y: bot.y };
	}

	// Figure out which slab they're on
	slabNum = Math.floor(pos.x / ruleset.properties.world.width * ruleset.properties.world.slabs);
	
	// Move them up or down (depending on if the slab is even or odd);
	multiplier = (slabNum % 2 == 0) ? -1 : 1;

	if (!bot.collided) {
		return { x: pos.x, y: pos.y + ruleset.properties.slabSlide * multiplier };
	} else {
		return pos;
	}
};

ruleset.draw.backgroundLayer = function() {
	this.c.save();

	var slabWidth = ruleset.properties.world.width / ruleset.properties.world.slabs;
	var fillStyles = [ "#163128", "#251631" ];

	var chevronWidth = 50;
	var chevronHeight = 20;

	var chevronTop = ruleset.properties.world.height / 2 - chevronHeight;
	var chevronBottom = chevronTop + chevronHeight;

	this.c.lineWidth = 12;

	for (x=0; x<ruleset.properties.world.slabs; x++) {
		this.c.fillStyle = fillStyles[x % 2]; // alternate fill styles

		this.c.beginPath();
		this.c.fillRect(x * slabWidth, 0, slabWidth, ruleset.properties.world.height);
		this.c.closePath();

		this.c.fill();

		var centerX = x * slabWidth + (slabWidth / 2);
		var chevronRight = centerX + (chevronWidth / 2);
		var chevronLeft = centerX - (chevronWidth / 2);

		this.c.beginPath();
		this.c.strokeStyle = "rgba(255, 255, 255, 0.05)";
		this.c.moveTo(chevronLeft, chevronBottom);
		this.c.lineTo(centerX, chevronTop);
		this.c.lineTo(chevronRight, chevronBottom);
		this.c.stroke();

		var temp = chevronBottom;
		chevronBottom = chevronTop;
		chevronTop = temp;
	}

	this.c.restore();
};

server.setRuleset(ruleset);
