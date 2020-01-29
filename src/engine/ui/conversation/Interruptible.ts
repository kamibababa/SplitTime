namespace SplitTime.conversation {
    export class Interruptible {
        private _triggered: boolean = false;

        constructor(private condition: any, private callback: Function, public readonly body?: Body) {

        }

        get triggered(): boolean {
            return this._triggered;
        }

        get conditionMet(): boolean {
            if(typeof this.condition === "function") {
                return this.condition();
            } else if(this.condition === true) {
                return true;
            } else {
                // TODO: add in mappy thing
                return false;
            }
        }

        trigger(): void {
            this._triggered = true;
        }

        runCallback(): void {
            this.callback();
        }
    }
}