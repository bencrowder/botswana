/* Botswana */
/* by Ben Crowder and Chad Hansen */

var server;

$(document).ready(function() {
	var canvas = document.getElementById("canvas");

	server = new Server();
	server.setContext(canvas.getContext("2d"));

	$("#go_button").click(function() {
		server.loadScripts();
	});
});

// keyboard handling
$(document).keydown(function(e) {
	var K_SPACE = "32";

	if (e.keyCode == K_SPACE) {
		server.togglePause();
		return false;
	} else if (e.keyCode == "80") { // "p", temp for testing particles
		var p = getRandomPoint();

		server.createParticleExplosion(p.x, p.y, 16, 20, 5, 20, "#96e0ff");
	}
});
