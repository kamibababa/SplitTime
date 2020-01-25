namespace G {
	// Generated by Grunt; not intended for access outside of loading sequence
	export var _GAME_DATA: {
		levels: SplitTime.level.FileData[],
		musicFiles: string[],
		preloadedImageFiles: string[],
		soundEffectFiles: string[]
	};
}

namespace SplitTime {
	/**
	 * Launch the game
	 * @param {int} width pixel width of game
	 * @param {int} height pixel height of the game
	 * @param {string} [parentId] ID of HTML element within which the game canvas will be placed.
	 *                       If unspecified, parent element will be document.body
	 * @param {string} [additionalCanvasClass] CSS class string to apply to game canvas element (e.g. for stretching)
	 */
	export function launch(width: int = 640, height: int = 360, parentId?: string, additionalCanvasClass: string = "") {
		var parent = document.body;
		if(parentId) {
			const foundParent = document.getElementById(parentId);
			if(!foundParent) {
				throw new Error("Failed to find element \"" + parentId + "\" to attach game window");
			}
			parent = foundParent;
		}
	
		SLVD.randomSeed();
		
		const view = new SplitTime.player.View(width, height, parent, additionalCanvasClass);
		const perspective = new player.Perspective(G.WORLD, view);
		const loadingScreen = new LoadingScreen(view);
		loadingScreen.show();

		if(SplitTime.debug.ENABLED) {
			SplitTime.debug.attachDebug(parent);
		}
		
		document.onkeydown = SplitTime.keyboard.onKeyDown;
		document.onkeyup = SplitTime.keyboard.onKeyUp;
		
		var masterData = G._GAME_DATA;
		var itemsToLoad = masterData.levels.length + masterData.preloadedImageFiles.length;
		var itemsLoaded = 0;
		var promiseCollection: PromiseLike<any>[] = [];
		
		function incrementAndUpdateLoading() {
			itemsLoaded++;
			loadingScreen.show(Math.round((itemsLoaded/itemsToLoad)*100));
		}

		G.ASSETS = new SplitTime.Assets(SLVD.getScriptDirectory());
		
		var i, fileName;
		for(i = 0; i < masterData.preloadedImageFiles.length; i++) {
			fileName = masterData.preloadedImageFiles[i];
			promiseCollection.push(G.ASSETS.images.load("preloaded/" + fileName, fileName, true).then(incrementAndUpdateLoading));
		}
		
		for(i = 0; i < masterData.musicFiles.length; i++) {
			fileName = masterData.musicFiles[i];
			G.ASSETS.audio.registerMusic(fileName);
		}
		for(i = 0; i < masterData.soundEffectFiles.length; i++) {
			fileName = masterData.soundEffectFiles[i];
			G.ASSETS.audio.registerSoundEffect(fileName);
		}
		
		for(i = 0; i < masterData.levels.length; i++) {
			var levelData = masterData.levels[i];
            var levelName = levelData.fileName.replace(/\.json$/, "");
            var level = G.WORLD.getLevel(levelName);
			promiseCollection.push(level.load(G.WORLD, levelData).then(incrementAndUpdateLoading));
		}
		
		//Begin recursion
		Promise.all(promiseCollection).then(function() {
			//Begin main loop
			const main = new SplitTime.GameLoop(perspective);
			main.start();
			
			//If done SplitTime.loading, launch game-defined launch script
			if(typeof launchCallback === "function") {
				launchCallback(main, perspective);
			} else if(SplitTime.debug.ENABLED) {
				SplitTime.Logger.warn("Game launch callback not set. (You should probably call SplitTIme.onGameEngineLoaded().)");
			}
		});
	};

	type engine_loaded_callback = (main: GameLoop, perspective: player.Perspective) => void;
	var launchCallback: engine_loaded_callback | null = null;
	export function onGameEngineLoaded(callback: engine_loaded_callback) {
		if(launchCallback) {
			throw new Error("onGameEngineLoaded() has already been called");
		}
		launchCallback = callback;
	}
}