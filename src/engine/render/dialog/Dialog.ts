namespace SplitTime {
    export class Dialog {
        _speaker: any;
        _lines: string[];
        _currentLine: any;
        _charactersDisplayed: number;
        _startDelay: any;
        _isFinished: boolean;
        _location: any;
        _signaler: any;
        _playerInteractHandler: any;
        _dialogEndHandler: any;
        /**
        *
        * @param {string} speaker
        * @param {string[]} lines
        * @param {LevelLocation} [location]
        * @constructor
        */
        constructor(speaker, lines, location) {
            this._speaker = speaker;
            this._lines = lines;
            this.setLocation(location);
            this._currentLine = 0;
            this._charactersDisplayed = 0;
            this._startDelay = null;
            this._isFinished = false;
        };
        
        static readonly AdvanceMethod = {
            AUTO: "AUTO",
            INTERACTION: "INTERACTION",
            HYBRID: "HYBRID"
        };
        
        _advanceMethod = SplitTime.Dialog.AdvanceMethod.HYBRID;
        _delay: number = 2000;
        _speed = 25;
        
        /**
        * @return {LevelLocation}
        */
        getLocation() {
            return this._location;
        };
        /**
        * @param {LevelLocation} location
        */
        setLocation(location) {
            this._location = location;
            this._refreshSignaler();
        };
        
        setAdvanceMethod(advanceMethod, delay) {
            this._advanceMethod = advanceMethod;
            this._delay = delay || this._delay;
        };
        
        getSpeaker() {
            return this._speaker;
        };
        
        getFullCurrentLine() {
            return this._lines[this._currentLine];
        };
        
        getDisplayedCurrentLine() {
            return this.getFullCurrentLine().substr(0, this._charactersDisplayed);
        };
        
        notifyFrameUpdate() {
            if(this._signaler.isSignaling()) {
                this.step();
            }
        };
        
        /**
        * TODO: potentially support multiple
        * @param {PlayerInteractHandler} handler
        */
        registerPlayerInteractHandler(handler) {
            this._playerInteractHandler = handler;
        };
        
        /**
        * TODO: potentially support multiple
        * @param {DialogEndHandler|function} handler
        */
        registerDialogEndHandler(handler) {
            this._dialogEndHandler = handler;
        };
        
        onPlayerInteract() {
            if(this._playerInteractHandler) {
                this._playerInteractHandler.onPlayerInteract(this);
            } else if(this._advanceMethod === AdvanceMethod.INTERACTION || this._advanceMethod === AdvanceMethod.HYBRID) {
                this.advance();
            }
        };
        
        start() {
            SplitTime.dialog.submit(this);
        };
        
        advance() {
            this._startDelay = null;
            if(this._isFinished) {
                this.close();
            } else if(this._charactersDisplayed < this._getCurrentLineLength()) {
                this._charactersDisplayed = this._getCurrentLineLength();
            } else {
                if(this._currentLine + 1 < this._lines.length) {
                    this._currentLine++;
                    this._charactersDisplayed = 0;
                } else {
                    this._isFinished = true;
                }
            }
        };
        
        /**
        * Move forward one frame relative to the dialog speed
        */
        step() {
            if(this._charactersDisplayed < this._getCurrentLineLength()) {
                this._charactersDisplayed++;
            } else if(this._advanceMethod === AdvanceMethod.AUTO || this._advanceMethod === AdvanceMethod.HYBRID) {
                if(!this._startDelay) {
                    this._startDelay = this._getTimeMs();
                } else if(this._getTimeMs() > this._startDelay + this._delay) {
                    this.advance();
                }
            }
        };
        
        close() {
            SplitTime.dialog.remove(this);
            if(this._dialogEndHandler) {
                if(typeof this._dialogEndHandler === "function") {
                    this._dialogEndHandler(this);
                } else if(typeof this._dialogEndHandler.onDialogEnd === "function") {
                    this._dialogEndHandler.onDialogEnd(this);
                } else {
                    console.error("Invalid dialog end handler: ", this._dialogEndHandler);
                }
            }
        };
        
        isFinished() {
            return this._isFinished;
        };
        
        _refreshSignaler() {
            if(this._location) {
                this._signaler = this._location.getLevel().getRegion().getTimeStabilizer(this._getMsPerStep());
            } else {
                this._signaler = new SplitTime.FrameStabilizer(this._getMsPerStep());
            }
        };
        
        _getTimeMs() {
            if(this._location) {
                return this._location.getLevel().getRegion().getTimeMs();
            } else {
                return +(new Date());
            }
        };
        
        _getMsPerStep() {
            return Math.round(1000 / this._speed);
        };
        
        _getCurrentLineLength() {
            return this._lines[this._currentLine].length;
        };
    }
    var AdvanceMethod = SplitTime.Dialog.AdvanceMethod;
}