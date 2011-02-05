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
	}
});
