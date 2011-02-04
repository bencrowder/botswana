/* Botswana */
/* by Ben Crowder and Chad Hansen */

/* utils.js */

function normalizeAngle(theta) {
	return theta % (2 * Math.PI);
}

function distanceToPoint(x1, y1, x2, y2) {
	var dx = x2 - x1;
	var dy = y2 - y1;

	return Math.sqrt(dx * dx + dy * dy);
}

function angleToPoint(x1, y1, x2, y2) {
	return Math.atan2(y2 - y1, x2 - x1);
}

function getRandomPoint() {
	var pos = {};
	var padding = 100;
	pos.x = (Math.random() * (WORLD_WIDTH - (padding * 2))) + padding;
	pos.y = (Math.random() * (WORLD_HEIGHT - (padding * 2))) + padding;

	return pos;
}

function calcVector(x, y, angle, magnitude) {
	var pos = {};
	pos.x = x + magnitude * Math.cos(angle);
	pos.y = y + magnitude * Math.sin(angle);

	return pos;
}

// creates a circular particle explosion at the specified point
function createParticleExplosion(x, y, num_points, distance, speed, life, color) {
	var angle = 0;
	var step = (2 * Math.PI) / num_points;

	for (i=0; i<num_points; i++) {
		var pos = calcVector(x, y, angle, distance);

		// add particle to global fxparticles array
		fxparticles.push({ "x": pos.x, "y": pos.y, "angle": angle, "speed": speed, "life": life, "color": color });

		angle += step;
	}
}
