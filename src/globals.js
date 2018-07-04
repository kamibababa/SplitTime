var t, T; //Used in various places; declared here to avoid multiple declarations

var SplitTime = {};

//implied SplitTime.SAVE object from load.js
SplitTime.SAVE = {};

//var SplitTime.seeB, SplitTime.see;
SplitTime.audio = [];

SplitTime.location = {};
SplitTime.location.images = "images/";
SplitTime.location.audio = "audio/";
SplitTime.location.levels = "levels/";

SplitTime.player = [];
SplitTime.Actor = [];
SplitTime.Teams = {};

SplitTime.process = "hold"; //Input of master setInterval switch-case

SplitTime.currentAudio = undefined;
SplitTime.volume = 1;

SplitTime.SAVE.timeSeconds = 0; //Second hand displayed on clock out of 2560
SplitTime.SAVE.timeMinutes = 0;
SplitTime.SAVE.timeHours = 0;
SplitTime.SAVE.timeDays = 0;

// TODO: remove
SplitTime.currentPlayer = 0;
SplitTime.cTeam = undefined; //For TRPG, either SplitTime.player or boardNPC

SplitTime.SCREENX = 640;
SplitTime.SCREENY = 480;

SplitTime.FPS = 50;
SplitTime.msPerFrame = (1/SplitTime.FPS)*1000;
SplitTime.showFPS = false;

function dependsOn(filename) {
    // This function should never be called. Ordered concat uses a pretend function of this name.
    console.error("dependsOn() (" + filename + ") should have been removed by ordered concat");
}
