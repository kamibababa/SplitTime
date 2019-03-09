SplitTime.main = function() {
	var clock = SplitTime.FrameStabilizer.getSimpleClock(1000);
	var startTime = new Date().getTime();

	var agentCount = 0;

    try {
        var a = new Date(); //for speed checking
        switch(SplitTime.process) {
            case SplitTime.main.State.LOADING: {
                SplitTime.see.fillStyle = "#000000";
                SplitTime.see.fillRect(0, 0, SplitTime.SCREENX, SplitTime.SCREENY);
                SplitTime.see.font = "30px Arial";
                SplitTime.see.fillStyle = "#FFFFFF";
                SplitTime.see.fillText("Loading...", 250, 230);
                break;
            }
            case SplitTime.main.State.ACTION: {
                var region = SplitTime.Region.getCurrent();
                //Advance one second per second (given 20ms SplitTime.main interval)
                // if(clock.isSignaling()) {
                    region.getTime().advance(SplitTime.msPerFrame);
                // }
                region.TimeStabilizer.notifyFrameUpdate();
                var b = new SLVD.speedCheck("SplitTime.Time.advance", a);
                b.logUnusual();

                region.forEachBody(function(body) {
                    body.zVelocity += body.getPixelGravityForFrame();
                });

                region.forEachAgent(function(agent) {
                    try {
                        if(typeof agent.notifyFrameUpdate === "function") {
                            agent.notifyFrameUpdate();
                        }
                    } catch(ex) {
                        console.error(ex);
                    }
                });

                region.forEachBody(function(body) {
                    if(Math.abs(body.zVelocity) > 0.00001) {
                        var expectedDZ = body.getPixelZVelocityForFrame();
                        var mover = new SplitTime.Body.Mover(body);
                        var actualDZ = mover.zeldaVerticalBump(expectedDZ);
                        if(Math.abs(actualDZ) < Math.abs(expectedDZ)) {
                            body.zVelocity = 0;
                        }
                    }
                });

                var c = new SLVD.speedCheck("agents update", b.date);
                c.logUnusual();

                var currentLevel = SplitTime.Level.getCurrent();
                if(currentLevel.getBodies().length === 0) {
                    currentLevel.refetchBodies();
                } else {
                    currentLevel.sortBodies();
                }
                var e = new SLVD.speedCheck("SplitTime sort board bodies", c.date);
                e.logUnusual();

                if(SplitTime.process !== SplitTime.main.State.ACTION) {
                    break;
                }

                SplitTime.BoardRenderer.renderBoardState(true);
                var f = new SLVD.speedCheck("SplitTime.BoardRenderer.renderBoardState", e.date);
                f.logUnusual(5);

                SplitTime.DialogManager.notifyFrameUpdate();
                var g = new SLVD.speedCheck("SplitTime.DialogManager.notifyFrameUpdate", e.date);
                g.logUnusual();

                break;
            }
            // case "TRPG": {
            //     if(SplitTime.cTeam == SplitTime.player) {
            //         SplitTime.TRPGPlayerMotion();
            //     }
            //     else if(SplitTime.cTeam == boardNPC) {
            //         SplitTime.TRPGNPCMotion();
            //     }
            //     SplitTime.onBoard.sortBodies();
            //
            //     SplitTime.renderBoardState(true);
            //     break;
            // }
            default: {}
        }

        SplitTime.FrameStabilizer.notifyFrameUpdate();
    } catch(ex) {
		console.error(ex);
	}

	try {
	    SplitTime.HUD.render(SplitTime.see);
    } catch(ex) {
	    console.error(ex);
    }

	var endTime = new Date().getTime();
	var msElapsed = endTime - startTime;

	var displayFPS = SplitTime.FPS;
	if(msElapsed < SplitTime.msPerFrame) {
		setTimeout(SplitTime.main, SplitTime.msPerFrame - msElapsed);
		SplitTime.see.fillStyle="#00FF00";
	}
	else {
		setTimeout(SplitTime.main, 2); //give browser a quick breath
		var secondsElapsed = msElapsed/1000;
		displayFPS = Math.round(1/secondsElapsed);
		SplitTime.see.fillStyle="#FF0000";
	}

    SplitTime.Debug.update({
        "FPS": displayFPS,
        "Board Bodies": SplitTime.BoardRenderer.countBodies(),
        "Agents": agentCount,
        "HUD Layers": SplitTime.HUD.getRendererCount(),
        "Joystick Direction": SplitTime.Controls.JoyStick.getDirection()
    });
};

SplitTime.main.State = {
    LOADING: "loading",
    ACTION: "action",
    OVERWORLD: "overworld",
    OTHER: "other"
};

/**
 * @interface
 */
function FrameNotified() {}

FrameNotified.prototype.notifyFrameUpdate = function() {};