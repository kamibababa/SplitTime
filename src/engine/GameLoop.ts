namespace SplitTime {
    export const FPS = 60;

    function mainGameLoop(gameLoop: GameLoop) {
        const isRunning = gameLoop.isRunning();
        const perspective = gameLoop.perspective;
        const startTime = new Date().getTime();

        if(isRunning) {
            try {
                mainGameLoopBody(gameLoop);
            } catch(ex) {
                console.error(ex);
            }
        }

        const endTime = new Date().getTime();
        const msElapsed = endTime - startTime;

        var displayFPS = FPS;
        const msPerFrame = (1/FPS)*1000;
        if(msElapsed < msPerFrame) {
            setTimeout(mainGameLoopBody, msPerFrame - msElapsed);
        } else {
            setTimeout(mainGameLoopBody, 2); //give browser a quick breath
            var secondsElapsed = msElapsed/1000;
            displayFPS = Math.round(1/secondsElapsed);
        }

        if(isRunning) {
            SplitTime.debug.setDebugValue("FPS", displayFPS);
            
            if(SplitTime.debug.ENABLED) {
                SplitTime.debug.renderCanvas(perspective.view.see);
            }
        }
    };

    function mainGameLoopBody(g: GameLoop) {
        const perspective = g.perspective;
        g.performanceCheckpoint("start loop", 999999);
        
        const level = perspective.levelManager.getCurrent();

        if(perspective.playerBody && perspective.playerBody.getLevel() !== level) {
            perspective.levelManager.transition(perspective.playerBody.getLevel());
            g.performanceCheckpoint("level transition", 10);
        }

        const secondsForFrame = 1/SplitTime.FPS;

        const region = level.getRegion();
        const timeline = region.getTimeline();

        timeline.notifyFrameUpdate(secondsForFrame);
        g.performanceCheckpoint("timeline frame update");

        region.notifyFrameUpdate(secondsForFrame);
        g.performanceCheckpoint("region frame update");

        g.notifyListenersFrameUpdate(secondsForFrame);
        g.performanceCheckpoint("notify listeners of update");
        
        SplitTime.debug.setDebugValue("Board Bodies", perspective.levelManager.getCurrent().bodies.length);
        SplitTime.debug.setDebugValue("Focus point", Math.round(perspective.camera.getFocusPoint().x) + "," + Math.round(perspective.camera.getFocusPoint().y) + "," + Math.round(perspective.camera.getFocusPoint().z));
    
        perspective.camera.notifyFrameUpdate(secondsForFrame);
        perspective.worldRenderer.renderBoardState(true);
        g.performanceCheckpoint("world state render");
        
        if(perspective.hud) {
            perspective.hud.render(perspective.view.see);
            g.performanceCheckpoint("render HUD");
        }
    };

    export class GameLoop {
        private running: boolean = false;
        private listeners: FrameNotified[] = [];

        constructor(public readonly perspective: SplitTime.player.Perspective) {
            Promise.resolve().then(() => mainGameLoop(this));
        }

        start() {
            this.running = true;
        };
        
        stop() {
            this.running = false;
        };

        onFrameUpdate(listener: FrameNotified) {
            this.listeners.push(listener);
        }

        notifyListenersFrameUpdate(seconds: number) {
            for(const listener of this.listeners) {
                listener.notifyFrameUpdate(seconds);
            }
        }

        isRunning() {
            return this.running;
        }

        private lastPerformanceCheck: Date | null = null;

        performanceCheckpoint(debugName: string, allow = 5) {
            if(SplitTime.debug.ENABLED) {
                var now = new Date();
                if(this.lastPerformanceCheck) {
                    var timePassed = now.getMilliseconds() - this.lastPerformanceCheck.getMilliseconds();
                    if(timePassed > allow) {
                        SplitTime.Logger.warn(debugName + ": " + timePassed + "ms taken when " + allow + "ms allotted");
                    }
                }
            }
        };
    }
}