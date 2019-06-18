dependsOn("BodyMover.js");

var ZILCH = 0.000001;

/**
 * Advances SplitTime.Body up to maxDistance pixels as far as is legal.
 * Includes pushing other Bodys out of the way? (this part is currently unavailable)
 * @param {number} dir
 * @param {number} maxDistance
 * @returns {number} distance actually moved
 */
SplitTime.Body.Mover.prototype.zeldaStep = function(dir, maxDistance) {
    this.ensureInRegion();
    var level = this.level;

    var dy = -maxDistance * Math.sin(dir * (Math.PI / 2)); //Total y distance to travel
    if(Math.abs(dy) < ZILCH) {
        dy = 0;
    }
    var dyRounded = dy > 0 ? Math.ceil(dy) : Math.floor(dy);
    var ady = Math.abs(dyRounded);

    var dx = maxDistance * Math.cos(dir * (Math.PI / 2)); //Total x distance to travel
    if(Math.abs(dx) < ZILCH) {
        dx = 0;
    }
    var dxRounded = dx > 0 ? Math.ceil(dx) : Math.floor(dx);
    var adx = Math.abs(dxRounded);

    var jHat = dy === 0 ? 0 : dyRounded / ady;
    var iHat = dx === 0 ? 0 : dxRounded / adx;

    var maxIterations = adx + ady;
    var xPixelsRemaining = adx;
    var yPixelsRemaining = ady;

    var outY = false;
    var stoppedY = false;
    var pixelsMovedY = 0;

    var outX = false;
    var stoppedX = false;
    var pixelsMovedX = 0;

    var oldX = this.body.getX();
    var oldY = this.body.getY();
    var oldRoundX = Math.floor(oldX);
    var oldRoundY = Math.floor(oldY);
    var roundX = oldRoundX;
    var roundY = oldRoundY;
    var currentZ = this.body.getZ();

    var eventIdSet = {};
    var levelIdSet = {};
    for(var i = 0; i < maxIterations; i++) {
        if(xPixelsRemaining > 0) {
            var newRoundX = roundX + iHat;
            if(newRoundX >= level.width || newRoundX < 0) {
                outX = true;
            } else {
                var xCollisionInfo = this.calculateXPixelCollisionWithStepUp(roundX, roundY, currentZ, iHat);
                if(xCollisionInfo.blocked) {
                    stoppedX = true;
                    if(xCollisionInfo.bodies.length > 0) {
                        // Slow down when pushing
                        xPixelsRemaining--;
                        this.tryPushOtherBodies(xCollisionInfo.bodies, dx > 0 ? SplitTime.Direction.E : SplitTime.Direction.W);
                    }
                } else {
                    roundX = newRoundX;
                    currentZ = xCollisionInfo.adjustedZ;
                    xPixelsRemaining--;
                    pixelsMovedX++;
                    addArrayToSet(xCollisionInfo.events, eventIdSet);
                    addArrayToSet(xCollisionInfo.otherLevels, levelIdSet);
                }
            }
        }

        if(yPixelsRemaining > 0) {
            var newRoundY = roundY + jHat;
            //Check if out of bounds
            if(newRoundY >= level.yWidth || newRoundY < 0) {
                outY = true;
            } else {

                var yCollisionInfo = this.calculateYPixelCollisionWithStepUp(roundX, roundY, currentZ, jHat);
                if(yCollisionInfo.blocked) {
                    stoppedY = true;
                    if(yCollisionInfo.bodies.length > 0) {
                        // Slow down when pushing
                        yPixelsRemaining--;
                        this.tryPushOtherBodies(yCollisionInfo.bodies, dy > 0 ? SplitTime.Direction.S : SplitTime.Direction.N);
                    }
                } else {
                    roundY = newRoundY;
                    currentZ = yCollisionInfo.adjustedZ;
                    yPixelsRemaining--;
                    pixelsMovedY++;
                    addArrayToSet(yCollisionInfo.events, eventIdSet);
                }
            }
        }
    }

    if(ady > 0 && pixelsMovedY > 0) {
        var roundYMoved = roundY - oldRoundY;
        var newYFromSteps = oldY + roundYMoved;
        // Subtract off any overshoot
        var actualNewY = newYFromSteps - (dyRounded - dy);
        this.body.setY(actualNewY);
    }
    if(adx > 0 && pixelsMovedX > 0) {
        var roundXMoved = roundX - oldRoundX;
        var newXFromSteps = oldX + roundXMoved;
        // Subtract off any overshoot
        var actualNewX = newXFromSteps - (dxRounded - dx);
        this.body.setX(actualNewX);
    }
    this.body.setZ(currentZ);

    //If stopped, help person out by sliding around corner
    var stopped = stoppedX || stoppedY;
    var out = outX || outY;
    if(stopped && !out && pixelsMovedX + pixelsMovedY < maxDistance / 2) {
        this.zeldaSlide(maxDistance / 2);
    }

    this.level.runEventSet(eventIdSet, this.body);
    this.transportLevelIfApplicable(levelIdSet);

    return SplitTime.Measurement.distanceTrue(oldX, oldY, this.body.getX(), this.body.getY());
};

function addArrayToSet(arr, set) {
    for(var i = 0; i < arr.length; i++) {
        set[arr[i]] = true;
    }
}

SplitTime.Body.Mover.prototype.tryPushOtherBodies = function(bodies, dir) {
    this.bodyExt.pushing = true;
    for(var i = 0; i < bodies.length; i++) {
        var mover = new SplitTime.Body.Mover(bodies[i]);
        mover.zeldaBump(1, dir);
    }
    this.bodyExt.pushing = false;
};

/**
 *
 * @param {Object<string, boolean>} levelIdSet
 */
SplitTime.Body.Mover.prototype.transportLevelIfApplicable = function(levelIdSet) {
    var id = null;
    for(var key in levelIdSet) {
        if(id !== null) {
            return;
        }
        id = key;
    }
    if(id === null) {
        return;
    }
    var currentLevel = this.body.getLevel();
    // var levelTraces = currentLevel.getLevelTraces();
    // var cornerCollisionInfos = [new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo()];
    // var left = Math.round(this.body.getLeft());
    // var topY = Math.round(this.body.getTopY());
    // var roundBase = Math.round(this.baseLength);
    // var z = Math.round(this.body.getZ());
    // var topZ = z + Math.round(this.height);
    // levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[0], left, topY, z, topZ);
    // levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[1], left, topY + roundBase, z, topZ);
    // levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[2], left + roundBase, topY, z, topZ);
    // levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[3], left + roundBase, topY + roundBase, z, topZ);
    // for(var i = 0; i < cornerCollisionInfos.length; i++) {
    //     if(!cornerCollisionInfos[i].pointerTraces[id]) {
    //         return;
    //     }
    // }
    // var pointerTrace = cornerCollisionInfos[0].pointerTraces[id];
    var whereToNext = this._theNextTransport(currentLevel, id, this.body.getX(), this.body.getY(), this.body.getZ());
    var whereTo = null;
    while(whereToNext !== null && whereToNext.level !== currentLevel) {
        whereTo = whereToNext;
        whereToNext = this._theNextTransport(whereToNext.level, null, whereToNext.x, whereToNext.y, whereToNext.z);
    }
    var cyclicEnd = whereToNext !== null;
    if(cyclicEnd) {
        if(SplitTime.Debug.ENABLED) {
            console.warn("Cyclic pointer traces detected on level " + currentLevel.id + " near (" + this.body.getX() + ", " + this.body.getY() + ", " + this.body.getZ() + ")");
        }
    } else if(whereTo !== null) {
        this.body.put(whereTo.level, whereTo.x, whereTo.y, whereTo.z);
    }
    // var whereTo = this._shouldTransportLevel(currentLevel, id, this.body.getX(), this.body.getY(), this.body.getZ());
    // if(whereTo) {
    //     this.body.put(whereTo.level, x, y, z);
    // }
};

/**
 * @param {SplitTime.Level} levelFrom
 * @param {string|null} levelIdTo
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{level: SplitTime.Level, x: number, y: number, z: number}|null}
 */
SplitTime.Body.Mover.prototype._theNextTransport = function(levelFrom, levelIdTo, x, y, z) {
    var levelTraces = levelFrom.getLevelTraces();
    var cornerCollisionInfos = [new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo()];
    var left = Math.round(x - this.baseLength / 2);
    var topY = Math.round(y - this.baseLength / 2);
    var roundBase = Math.round(this.baseLength);
    var roundZ = Math.round(z);
    var topZ = roundZ + Math.round(this.height);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[0], left, topY, roundZ, topZ);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[1], left, topY + roundBase, roundZ, topZ);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[2], left + roundBase, topY, roundZ, topZ);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[3], left + roundBase, topY + roundBase, roundZ, topZ);
    for(var i = 0; i < cornerCollisionInfos.length; i++) {
        for(var key in cornerCollisionInfos[i].pointerTraces) {
            if(levelIdTo === null) {
                levelIdTo = key;
            } else if(key !== levelIdTo) {
                return null;
            }
        }
        if(!levelIdTo || !cornerCollisionInfos[i].pointerTraces[levelIdTo]) {
            return null;
        }
    }
    var pointerTrace = cornerCollisionInfos[0].pointerTraces[levelIdTo];
    return {
        level: pointerTrace.level,
        x: x + pointerTrace.offsetX,
        y: y + pointerTrace.offsetY,
        z: z + pointerTrace.offsetZ
    };
};

/**
 * @param {SplitTime.Level} levelFrom
 * @param {string|null} levelIdTo
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{level: SplitTime.Level, x: number, y: number, z: number}|null}
 */
SplitTime.Body.Mover.prototype._shouldTransportLevel = function(levelFrom, levelIdTo, x, y, z) {
    var levelTraces = levelFrom.getLevelTraces();
    var cornerCollisionInfos = [new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo(), new SplitTime.LevelTraces.CollisionInfo()];
    var left = Math.round(x - this.baseLength / 2);
    var topY = Math.round(y - this.baseLength / 2);
    var roundBase = Math.round(this.baseLength);
    var roundZ = Math.round(z);
    var topZ = roundZ + Math.round(this.height);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[0], left, topY, roundZ, topZ);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[1], left, topY + roundBase, roundZ, topZ);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[2], left + roundBase, topY, roundZ, topZ);
    levelTraces.calculatePixelColumnCollisionInfo(cornerCollisionInfos[3], left + roundBase, topY + roundBase, roundZ, topZ);
    for(var i = 0; i < cornerCollisionInfos.length; i++) {
        for(var key in cornerCollisionInfos[i].pointerTraces) {
            if(levelIdTo === null) {
                levelIdTo = key;
            } else if(key !== levelIdTo) {
                return null;
            }
        }
        if(!levelIdTo || !cornerCollisionInfos[i].pointerTraces[levelIdTo]) {
            return null;
        }
    }
    var pointerTrace = cornerCollisionInfos[0].pointerTraces[id];
    try {
        this._levelIdStack.push(levelFrom.id);
        var destination = this._shouldTransportLevel(pointerTrace.level, null, x + pointerTrace.offsetX, y + pointerTrace.offsetY, z + pointerTrace.offsetZ);
        if(!destination) {
            destination = {
                level: pointerTrace.level,
                x: x + pointerTrace.offsetX,
                y: y + pointerTrace.offsetY,
                z: z + pointerTrace.offsetZ
            };
        }
        return destination;
    } finally {
        this._levelIdStack.pop();
    }
};

/**
 * Check that the area is open in level collision canvas data.
 * @param {SplitTime.Level} level
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {number} z
 * @returns {{blocked: boolean, vStepUpEstimate: number, pointerTraces: SplitTime.Trace[], events: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateAreaTraceCollision = function(level, startX, xPixels, startY, yPixels, z) {
    var collisionInfo = {
        blocked: false,
        vStepUpEstimate: 0,
        pointerTraces: [],
        events: []
    };

    var originCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
    level.getLevelTraces().calculateVolumeCollision(originCollisionInfo, startX, xPixels, startY, yPixels, z, z + this.height);

    collisionInfo.vStepUpEstimate = originCollisionInfo.zBlockedTopEx - z;
    collisionInfo.blocked = originCollisionInfo.containsSolid && collisionInfo.vStepUpEstimate > 0;
    for(var levelId in originCollisionInfo.pointerTraces) {
        collisionInfo.pointerTraces.push(originCollisionInfo.pointerTraces[levelId]);
    }
    for(var eventId in originCollisionInfo.events) {
        collisionInfo.events.push(eventId);
    }

    return collisionInfo;
};
