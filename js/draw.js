/* Botswana */
/* by Ben Crowder and Chad Hansen */

/* draw.js -- library of drawing functions */


/*** Definitions
 *
 * function clearCanvas();
 * function drawWorld(context);
 * function drawBot(x, y, angle, color, context);
 * function drawBullet(x, y, angle, context);
 * function drawGrid(context);
 * function drawBuildings(context);
 * function calcVector(x, y, angle, magnitude);
 *
 ***/


/*** Declarations ***/

function clearCanvas(context) {
	context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawWorld(context) {
	// background stuff
	clearCanvas(context);
	drawGrid(context);
	// drawBuildings(context);

	// draw bots
	for (bot_index in bots) {
		var bot = bots[bot_index];

		drawBot(bot.x, bot.y, bot.angle, bot.color, context);
	}

	// draw bullets
}

function drawBot(x, y, angle, color, context) {
	var radius = 15;

	context.save();
	context.translate(x, y);

	context.fillStyle = color;
	context.lineWidth = 4;

	// draw filled/stroked circle
	context.beginPath();
	context.arc(0, 0, radius, 0, Math.PI * 2, true);
	context.closePath();
	context.fill();
	context.stroke();

	// now draw the turret
	context.rotate(angle);
	context.strokeStyle = "#fff";
	context.moveTo(0, 0);
	context.lineTo(20, 0);
	context.stroke();

	context.restore();
}

function drawBullet(x, y, angle, context) {
	context.save();
	context.translate(x, y);
	context.rotate(angle);

	context.strokeStyle = BULLET_COLOR;
	context.lineWidth = 2;

	context.beginPath();
	context.moveTo(0, 0);
	context.lineTo(10, 0);
	context.closePath();
	context.stroke();

	context.restore();
}

// draw the background grid
function drawGrid(context) {
	context.beginPath();

	for (var x = 20; x < WORLD_WIDTH; x += 20) {
		context.moveTo(x, 0);
		context.lineTo(x, WORLD_HEIGHT);
	}

	for (var y = 20; y < WORLD_HEIGHT; y += 20) {
		context.moveTo(0, y);
		context.lineTo(WORLD_WIDTH, y);
	}

	context.strokeStyle = "#333";
	context.stroke();
}

function drawBuildings(context) {
	context.beginPath();
	context.strokeStyle = "#666";
	context.lineWidth = 3;
	context.fillStyle = "rgba(80, 200, 255, 0.2)";
	context.fillRect(240, 380, 40, 120);
	context.strokeRect(240, 380, 40, 120);
	context.fillRect(860, 140, 120, 60);
	context.strokeRect(860, 140, 120, 60);
}

function calcVector(x, y, angle, magnitude) {
	var pos = {};
	pos.x = x + magnitude * Math.cos(angle);
	pos.y = y + magnitude * Math.sin(angle);

	return pos;
}

