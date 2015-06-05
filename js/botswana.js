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

	$("#start-button").focus();

	$("#start-button").click(function() {
		$("#start-button").blur();
		server.loadScripts();
	});


	// Add bot/ruleset to list
	// Type is "bot" or "ruleset"
	function addCustomToList(field, type) {
		var input = field.siblings("input[type=text]");
		var value = input.val().trim();

		if (value != '') {
			var html = "<div class='" + type + " item selected' data-uri='" + value  + "'>";
			html += "<div class='name'>" + value + "</div>";
			html += "</div>";
			$("." + type + "s .list").append(html);

			input.val('');
		}
	}

	$(".bots .add-form input[type=submit]").click(function() {
		addCustomToList($(this), "bot");
		return false;
	});

	$(".rulesets .add-form input[type=submit]").click(function() {
		addCustomToList($(this), "ruleset");
		return false;
	});


	// Selection of bots
	$(".bots .item").on("click", function() {
		$(this).toggleClass("selected");

		return false;
	});

	// Selection of ruleset
	$(".rulesets .item").on("click", function() {
		$(this).siblings(".item").removeClass("selected");
		$(this).addClass("selected");

		return false;
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
