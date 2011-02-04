/* Botswana */
/* by Ben Crowder and Chad Hansen */

var NUM_PLAYERS = 2;
var WORLD_WIDTH = 1000;
var WORLD_HEIGHT = 600;
var ANGLE_STEP = 0.1;
var SPEED = 2;
var K_SPACE = "32";

var bot_colors = ["#e95050", "#589ebc"]; // red, blue
var BULLET_COLOR = "#d2f783";

var bots = [];
var context;
var paused = false;

var tournamentIntervalId = 0;


function registerBot(bot) {
	// add bot to main array
	bots.push(bot);

	var botnum = bots.length;

	bot.color = bot_colors[bots.length - 1];

	// update the status bar
	$("#status #bot" + botnum + "status .name").html(bot.name);
	$("#status #bot" + botnum + "status .health").css("background-color", bot.color);
	$("#status #bot" + botnum + "status .width").css("width", bot.health * 2);
}

function startTournament() {
	bots_state = []

	// initial placement on map
	for (i in bots) {
		var bot = bots[i];

		bot.x = (Math.random() * (WORLD_WIDTH - 200)) + 100;		// 100px padding
		bot.y = (Math.random() * (WORLD_HEIGHT - 200)) + 100;		// 100px padding
		bot.angle = Math.random() * Math.PI * 2;			// 0-360 degrees (in radians)
		bot.health = 100;

		// init the world state
		bot.state.world.width = WORLD_WIDTH;
		bot.state.world.height = WORLD_HEIGHT;

		// keep track of initial state
		bots_state.push({ "name": bot.name, "x": bot.x, "y": bot.y, "angle": bot.angle, "health": bot.health });

		bot.setup();
	}

	// update state for each bot
	for (i in bots) {
		bots[i].state.bots = bots_state;
	}

	// if we've got a pre-existing tournament, clear the interval
	if (tournamentIntervalId) {
		clearInterval(tournamentIntervalId);
	}
	
	// start the game
	tournamentIntervalId = setInterval(runGame, 25);
}

function runGame() {
	if (!paused) {
		bots_state = [];
		for (j in bots) {
			bots_state.push({ "name": bots[j].name, "x": bots[j].x, "y": bots[j].y, "angle": bots[j].angle, "health": bots[j].health });
		}
		// run the bot
		for (i in bots) {
			var bot = bots[i];

			// update the bot's state (bots, bullets)
			bot.state.bots = bots_state;

			// now run the bot
			command = bot.run();

			// parse command here
			switch (command) {
				case "forward":
					var pos = calcVector(bot.x, bot.y, bot.angle, SPEED);
					bot.x = pos.x;
					bot.y = pos.y;
					break;
				case "backward":
					var pos = calcVector(bot.x, bot.y, bot.angle, -SPEED);
					bot.x = pos.x;
					bot.y = pos.y;
					break;
				case "left":
					bot.angle += ANGLE_STEP;
					break;
				case "right":
					bot.angle -= ANGLE_STEP;
					break;
			}

			bot.angle = normalizeAngle(bot.angle);
		}

		// do rule checking, collisions, update bullets, etc.

		// draw the arena
		drawWorld(context);
	}
}

$(document).ready(function() {
	var canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");

	$("#go_button").click(function() {
		// load the scripts
		bots = [];
		var botUrls = [];
		var botsUnloaded = 2;	// counter to keep track of how many are left to load

		for (var i=1; i<=NUM_PLAYERS; i++) {
			var url = $("#bot" + i + "url").val();

			// add to the array
			botUrls.push(url);

			// get the file and execute it
			$.getScript(url, function() {
				botsUnloaded = botsUnloaded - 1;

				// start the tournament once all these are loaded
				if (botsUnloaded == 0) {
					startTournament(context);
				}
			});
		}
	});
});

// keyboard handling
$(document).keydown(function(e) {
	if (e.keyCode == K_SPACE) {
		if (paused) { 
			paused = false;
		} else {
			paused = true;
			drawPaused(context);
		}
		return false;
	}
});
