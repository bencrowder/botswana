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
