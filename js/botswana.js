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


	// Toggle tray
	$("#tray").click(function() {
		if ($("header").hasClass("active")) {
			$("header").removeClass("active");
		} else {
			$("header").addClass("active");
		}

		server.togglePause();

		return false;
	});

	
	// Get localStorage store
	function getLocalStorage(type) {
		return JSON.parse(localStorage.getItem('botswana_' + type));
	}


	// Add an item to localStorage
	function addToLocalStorage(value, type) {
		// Get the localStorage list
		var customList = getLocalStorage(type);

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

	// Remove an item from localStorage
	function removeFromLocalStorage(value, type) {
		// Get the localStorage list
		var customList = getLocalStorage(type);

		// Make sure the list is there
		var i = customList.items.indexOf(value);
		if (i != -1) {
			customList.items.splice(i, 1);
		}

		// And now save it to localStorage
		localStorage.setItem('botswana_' + type, JSON.stringify(customList));
	}


	// Add an item to a list
	function addItemToList(type, value) {
		var listElement = $("." + type + "s .list");

		var html = "<div class='" + type + " item custom " + (type == 'bot' ? 'selected' : '') + "' data-uri='" + value  + "'>";
		html += "<span class='delete'>&times;</span>";
		html += "<div class='name'>" + value + "</div>";
		html += "</div>";

		listElement.append(html);
	}


	// Load custom bots/rulesets from localStorage
	function loadLocalStorage(type) {
		var customList = getLocalStorage(type);
		var listElement = $("." + type + "s .list");

		if (customList) {
			for (var i in customList.items) {
				var value = customList.items[i];
				addItemToList(type, value);
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
			addItemToList(type, value);

			input.val('');

			// Get the localStorage list
			addToLocalStorage(value, type);
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


	// Deleting bots/rulesets
	$(".list").on("click", ".item .delete", function() {
		var item = $(this).parents(".item");
		var value = item.attr("data-uri");
		var type = item.hasClass("bot") ? "bot" : "ruleset";

		// Delete it from the DOM
		item.slideUp(200, function() {
			// Delete it from localStorage
			removeFromLocalStorage(value, type);
		});

		return false;
	});


	// Selection of bots
	$(".bots .item").on("click", function() {
		$(this).toggleClass("selected");
	});

	// Selection of ruleset
	$(".rulesets .item").on("click", function() {
		$(this).siblings(".item").removeClass("selected");
		$(this).addClass("selected");
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


// Array Remove - By John Resig (MIT Licensed)
// http://ejohn.org/blog/javascript-array-remove/
function removeFromArray(array, from, to) {
	var rest = array.slice((to || from) + 1 || array.length);
	array.length = from < 0 ? array.length + from : from;
	return array.push.apply(array, rest);
};
