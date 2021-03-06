namespace splitTime {
    export class IntervalStabilizer implements Signaler {
        msPerFrame: number
        maxCounter: number
        currentTimeGetter: () => number
        _counterSetAt: number = Number.NEGATIVE_INFINITY
        _previousCounterSetAt: number = Number.NEGATIVE_INFINITY
        _counter: number = 0
        _isClockFrame: boolean = false
        constructor(
            msPerFrame = 100,
            maxCounter = 1,
            currentTimeGetter: () => number
        ) {
            this.msPerFrame = msPerFrame || 100
            this.maxCounter = maxCounter || 1
            this.currentTimeGetter = currentTimeGetter
            this.reset()
        }

        howManyMsSinceLastFrame() {
            this.checkUpdate()
            return this._counterSetAt - this._previousCounterSetAt
        }

        reset() {
            this._counter = 0
            this._counterSetAt = this.currentTimeGetter()
            this._isClockFrame = true
        }

        checkUpdate() {
            var newTime = this.currentTimeGetter()
            if (this._counterSetAt < newTime) {
                this._counter +=
                    (newTime - this._counterSetAt) / this.msPerFrame
                this._isClockFrame = this._counter >= this.maxCounter
                this._counter %= this.maxCounter
                this._previousCounterSetAt = this._counterSetAt
                this._counterSetAt = newTime
            } else {
                this._isClockFrame = false
            }
        }

        howManyMsSinceLastTick() {
            this.checkUpdate()
            return this._counterSetAt - this._previousCounterSetAt
        }

        getUnroundedCounter() {
            this.checkUpdate()
            return this._counter
        }

        getCounter() {
            this.checkUpdate()
            return Math.round(this._counter)
        }

        isSignaling() {
            this.checkUpdate()
            return this._isClockFrame
        }
    }
}
