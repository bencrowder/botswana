/* Botswana */
/* by Ben Crowder and Chad Hansen */

var server;

$(document).ready(function() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	server = new Server();
	server.setContext(context);

	var openingScreen = new Image();
	openingScreen.src = "images/OpeningScreen.jpg";
	openingScreen.onload = function() {
		context.drawImage(openingScreen, 0, 0, canvas.width, canvas.height);
	}

	$("#go_button").focus();

	$("#go_button").click(function() {
		$("#go_button").blur();
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
