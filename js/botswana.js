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


	// Load custom bots/rulesets from localStorage
	function loadLocalStorage(type) {
		var customList = JSON.parse(localStorage.getItem('botswana_' + type));
		var listElement = $("." + type + "s .list");

		if (customList) {
			for (var i in customList.items) {
				var value = customList.items[i];

				var html = "<div class='" + type + " item custom selected' data-uri='" + value  + "'>";
				html += "<div class='name'>" + value + "</div>";
				html += "</div>";

				listElement.append(html);
			}
		}
	}

	loadLocalStorage("bot");
	loadLocalStorage("ruleset");


	// Add bot/ruleset to list
	// Type is "bot" or "ruleset"
	function addCustomToList(field, type) {
		var input = field.siblings("input[type=text]");
		var value = input.val().trim();

		if (value != '') {
			var html = "<div class='" + type + " item custom selected' data-uri='" + value  + "'>";
			html += "<div class='name'>" + value + "</div>";
			html += "</div>";
			$("." + type + "s .list").append(html);

			input.val('');

			// Get the localStorage list
			var customList = JSON.parse(localStorage.getItem('botswana_' + type));

			// Make sure the list is there
			if (!customList || !customList.items) {
				customList = {
					'items': [],
				};
			}

			// And now save it to localStorage
			customList.items.push(value);
			localStorage.setItem('botswana_' + type, JSON.stringify(customList));
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
