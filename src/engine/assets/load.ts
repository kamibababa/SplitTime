namespace G {
    // Generated by Grunt; not intended for access outside of loading sequence
    export var _GAME_DATA: {
        levels: splitTime.level.FileData[]
        musicFiles: string[]
        preloadedImageFiles: string[]
        soundEffectFiles: string[]
    }
}

namespace splitTime {
    export function load(perspective: Perspective) {
        const loadingScreen = new LoadingScreen(perspective.view)
        loadingScreen.show()

        var masterData = G._GAME_DATA
        var itemsToLoad =
            masterData.levels.length + masterData.preloadedImageFiles.length
        var itemsLoaded = 0
        var promiseCollection: PromiseLike<any>[] = []

        function incrementAndUpdateLoading() {
            itemsLoaded++
            loadingScreen.show(Math.round((itemsLoaded / itemsToLoad) * 100))
        }

        G.ASSETS = new splitTime.Assets(splitTime.getScriptDirectory())

        var i, fileName
        for (i = 0; i < masterData.preloadedImageFiles.length; i++) {
            fileName = masterData.preloadedImageFiles[i]
            promiseCollection.push(
                G.ASSETS.images
                    .load("preloaded/" + fileName, fileName, true)
                    .then(incrementAndUpdateLoading)
            )
        }

        for (i = 0; i < masterData.musicFiles.length; i++) {
            fileName = masterData.musicFiles[i]
            G.ASSETS.audio.registerMusic(fileName)
        }
        for (i = 0; i < masterData.soundEffectFiles.length; i++) {
            fileName = masterData.soundEffectFiles[i]
            G.ASSETS.audio.registerSoundEffect(fileName)
        }

        for (i = 0; i < masterData.levels.length; i++) {
            var levelData = masterData.levels[i]
            var levelName = levelData.fileName.replace(/\.json$/, "")
            var level = perspective.world.getLevel(levelName)
            promiseCollection.push(
                level.load(perspective.world, levelData).then(incrementAndUpdateLoading)
            )
        }

        return Promise.all(promiseCollection)
    }
}
