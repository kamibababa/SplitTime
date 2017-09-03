dependsOn("/SLVD/Promise.js");

SplitTime.launch = function(callback, width, height, parentId) {
	SplitTime.startUp = callback || function() {};
	if(width && height) {
		SplitTime.SCREENX = width;
		SplitTime.SCREENY = height;
	}

	SLVD.randomSeed();

	SplitTime.launch.createCanvases(width, height, parentId);

	//Sets variables useful for determining what keys are down at any time.
	document.onkeydown = function(e) {
		//Prevent scrolling with arrows
	    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
	        e.preventDefault();
	    }

		var key = SplitTime.keyCodeKey[e.which || e.keyCode];//e.key.toLowerCase();

		if(key == " ")
		{
			key = "space";
		}
		//alert(key);

		if(key == "t")
		{
			alert("saving...");
			//alert("test second alert");
			SplitTime.fileSave("testFile");
			alert("saved!");
		}
		else if(key == "y")
		{
		/*	var seen = [];

			var alerter = JSON.stringify(SplitTime.player[SplitTime.currentPlayer], function(key, val) {
				if(val != null && typeof val == "object") {
					if(seen.indexOf(val) >= 0) return seen.push(val); }
					return val; });
			alert(alerter);*/
			alert(SplitTime.player[SplitTime.currentPlayer].x + ", " + SplitTime.player[SplitTime.currentPlayer].y + ", " + SplitTime.player[SplitTime.currentPlayer].z);
		}

		if(SplitTime.keyDown[key] === undefined)
		{
			SplitTime.keyFirstDown = key;
		}
		SplitTime.keyDown[key] = true;

		if(SplitTime.process == "wait" && SplitTime.mainPromise)
		{
			if(SplitTime.currentLevel)
			{
				SplitTime.process = SplitTime.currentLevel.type;
			}
			SplitTime.mainPromise.resolve(key);
		}
		else if(SplitTime.process == "waitForEnterOrSpace" && (SplitTime.keyFirstDown == "enter" || SplitTime.keyFirstDown == "space"))
		{
			delete SplitTime.keyFirstDown;

			if(SplitTime.currentLevel)
			{
				SplitTime.process = SplitTime.currentLevel.type;
			}
			SplitTime.mainPromise.resolve(key);
		}
	};

	//The clean-up of the above function.
	document.onkeyup = function(e) {
		var key = SplitTime.keyCodeKey[e.keyCode];//e.key.toLowerCase();

		if(key == SplitTime.keyFirstDown)
		{
			delete SplitTime.keyFirstDown;
		}

		delete SplitTime.keyDown[key];
	};

	//Initialize
	SLVD.getXML("dist/master.xml").then(function(master) {
		var itemsToLoad = master.getElementsByTagName("level").length + master.getElementsByTagName("image").length;
		var itemsLoaded = 0;
		var promiseCollection = new SLVD.Promise.collection();

		function incrementAndUpdateLoading() {
			itemsLoaded++;
			updateLoading();
		}

		function updateLoading() {
			//Display load "percentage"
			SplitTime.see.fillStyle = "#000000";
			SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
			SplitTime.see.font="30px Arial";
			SplitTime.see.fillStyle = "#FFFFFF";
			SplitTime.see.fillText("Loading: " + Math.round((itemsLoaded/itemsToLoad)*100) + "%", 250, 230);
		}

		updateLoading();

		var index, second, filename;
		for(index = 0; index < master.getElementsByTagName("image").length; index++) //Load all images referenced in master.xml outside of levels
		{
			filename = master.getElementsByTagName("image")[index].childNodes[0].nodeValue;
			promiseCollection.add(SplitTime.Image.load("preloaded/" + filename, filename, true).then(incrementAndUpdateLoading));
		}

		for(index = 0; index < master.getElementsByTagName("music").length; index++) //Load all SplitTime.audio
		{
			filename = master.getElementsByTagName("music")[index].childNodes[0].nodeValue;
			SplitTime.audio[index] = SplitTime.audioCreate("audio/music/" + filename, index);
			SplitTime.audio[index].loop = true;
			SplitTime.audio[filename] = SplitTime.audio[index];
		}
		for(second = index; second < master.getElementsByTagName("soundeffect") + index; second++)
		{
			filename = master.getElementsByTagName("soundeffect")[second - index].childNodes[0].nodeValue;
			SplitTime.audio[second] = SplitTime.audioCreate("audio/soundeffects/" + filname, second);
			SplitTime.audio[second].loop = false;
			SplitTime.audio[filename] = SplitTime.audio[second];
		}

		var iLevel = 0;

		function makeLevelXMLHandler(filename) {
			var levelName = filename.replace(/\.xml$/, "");
			return function(data) {
				var level = SplitTime.Level.get(levelName);

				level.filedata = data;
				level.layerImg = [];
				level.layerFuncData = [];
				level.type = data.getElementsByTagName("type")[0].textContent;
				level.width = 0;
				level.height = 0;
				level.load = new SLVD.Promise.collection();

				function onloadImage(layerImg) {
					if(layerImg.height > level.height)
					{
						level.height = layerImg.height;
					}
					if(layerImg.width > level.width)
					{
						level.width = layerImg.width;
					}
				}

				for(var iLayerImg = 0; iLayerImg < data.getElementsByTagName("background").length; iLayerImg++) {
					t = data.getElementsByTagName("background")[iLayerImg].textContent;
					level.layerImg[iLayerImg] = t;
					var loadProm = SplitTime.Image.load(t).then(onloadImage);
					level.load.add(loadProm);
				}

				//Pull positions from file
				for(index = 0; index < data.getElementsByTagName("position").length; index++) {
					var position = data.getElementsByTagName("position")[index];

					var obj = {};
					obj.levelId = levelName;
					obj.x = +position.getAttribute("x");
					obj.y = +position.getAttribute("y");
					obj.z = +position.getAttribute("layer");
					obj.dir = +position.getAttribute("dir");
					obj.stance = position.getAttribute("stance");

					var id = position.getAttribute("id");
					if(id) {
						level.registerPosition(id, obj);
					}
					else {
						console.warn("position missing id in level: " + levelName);
					}

					var actor = position.getElementsByTagName("alias")[0].getAttribute("actor");
					var alias = position.getElementsByTagName("alias")[0].textContent;

					if(actor && alias) {
						SplitTime.Actor[actor].registerPosition(alias, obj);
					}
				}

				incrementAndUpdateLoading();

				return loadOneLevel();
			};
		}

		function loadOneLevel() {
			var iLevelLocal = iLevel++;

			if(iLevelLocal >= master.getElementsByTagName("level").length) {
				return SLVD.Promise.as();
			}

			var filename = master.getElementsByTagName("level")[iLevelLocal].childNodes[0].nodeValue;
			//TODO: Why is this needed if we do lazy loading anyway?
			// SplitTime.Level.get(filename);
			return SLVD.getXML("levels/" + filename).then(makeLevelXMLHandler(filename));
		}

		for(var iLevelLane = 0; iLevelLane < 10; iLevelLane++) {
			promiseCollection.add(loadOneLevel());
		}

		//Begin recursion
		promiseCollection.then(function(data) {
			SplitTime.launch.load.resolve();

			//Begin main loop
			SplitTime.main();

			//If done SplitTime.loading, startup (in the initialize.js file)
			SplitTime.startUp();
		});
	});
};

SplitTime.launch.load = new SLVD.Promise();

SplitTime.launch.createCanvases = function(width, height, parentId) {
	var parent = document.body;
	if(parentId) {
		parent = document.getElementById(parentId);
	}

	SplitTime.seeB = document.createElement("canvas");
	SplitTime.seeB.innerHTML = "Your browser does not support the canvas element this engine relies on. Please get a more modern browser to use this.";
	SplitTime.seeB.setAttribute("id", "game-window");
	SplitTime.seeB.setAttribute("class", "center");
	SplitTime.seeB.setAttribute("width", SplitTime.SCREENX);
	SplitTime.seeB.setAttribute("height", SplitTime.SCREENY);
	SplitTime.seeB.setAttribute("style", "display: block; margin: auto; border:1px solid #d3d3d3;");
	parent.appendChild(SplitTime.seeB);
	SplitTime.see = SplitTime.seeB.getContext("2d");

	SplitTime.see.font="20px Arial";
	SplitTime.see.fillText("If this message persists for more than a few seconds,", 10, 30);
	SplitTime.see.fillText("this game will not run on your browser.", 10, 60);

	SplitTime.buffer = document.createElement("canvas");
	SplitTime.buffer.setAttribute("width", SplitTime.SCREENX);
	SplitTime.buffer.setAttribute("height", SplitTime.SCREENY);
	SplitTime.bufferCtx = SplitTime.buffer.getContext("2d");

	SplitTime.holderCanvas = document.createElement("canvas");
	SplitTime.holderCanvas.setAttribute("width", SplitTime.SCREENX);
	SplitTime.holderCanvas.setAttribute("height", SplitTime.SCREENY);

	SplitTime.snapShot = document.createElement("canvas");
	SplitTime.snapShot.setAttribute("width", SplitTime.SCREENX);
	SplitTime.snapShot.setAttribute("height", SplitTime.SCREENY);
	SplitTime.snapShotCtx = SplitTime.snapShot.getContext("2d");
};
