// NOTE: This file has a sister that is nearly identical: collisionsHorizontalX.js
// Currently, the implementations are separate for performance concerns, but merging is a consideration.

dependsOn("BodyMover.js");

/**
 * Check that dy can be accomplished, potentially with vertical adjustment.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dy should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], adjustedZ: number, functions: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateYPixelCollisionWithStepUp = function(x, y, z, dy) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        adjustedZ: z,
        functions: []
    };

    var simpleCollisionInfo = this.calculateYPixelCollision(x, y, z, dy);
    if(simpleCollisionInfo.blocked && simpleCollisionInfo.vStepUpEstimate <= SplitTime.Body.Mover.VERTICAL_FUDGE) {
        var stepUpZ = this.calculateRiseThroughTraces(x, y + dy, z, SplitTime.Body.Mover.VERTICAL_FUDGE).zEnd;
        var simpleStepUpCollisionInfo = this.calculateYPixelCollision(x, y, stepUpZ, dy);
        if(!simpleStepUpCollisionInfo.blocked) {
            collisionInfo.adjustedZ = this.calculateDropThroughTraces(x, y + dy, stepUpZ, SplitTime.Body.Mover.VERTICAL_FUDGE).zBlocked;
            simpleCollisionInfo = simpleStepUpCollisionInfo;
        }
    }
    collisionInfo.blocked = simpleCollisionInfo.blocked;
    collisionInfo.bodies = simpleCollisionInfo.bodies;
    collisionInfo.functions = simpleCollisionInfo.functions;

    return collisionInfo;
};

/**
 * Check that dy can be accomplished.
 * @param {int} x
 * @param {int} y
 * @param {number} z
 * @param {int} dy should be -1 or 1
 * @returns {{blocked: boolean, bodies: SplitTime.Body[], vStepUpEstimate: number, functions: string[]}}
 */
SplitTime.Body.Mover.prototype.calculateYPixelCollision = function(x, y, z, dy) {
    var collisionInfo = {
        blocked: false,
        bodies: [],
        vStepUpEstimate: 0,
        functions: []
    };
    var me = this;
    function handleFoundBody(otherBody) {
        if(isZOverlap(z, me.height, otherBody.getZ(), otherBody.height)) {
            collisionInfo.blocked = true;
            collisionInfo.bodies.push(otherBody);
            collisionInfo.vStepUpEstimate = otherBody.getZ() + otherBody.height - z;
        }
    }
    if(dy > 0) {
        this.levelBodyOrganizer.forEachYTop(y + dy, handleFoundBody);
    } else {
        this.levelBodyOrganizer.forEachYBottom(y + dy, handleFoundBody);
    }

    if(!collisionInfo.blocked) {
        var edgeY = dy > 0 ? y + dy + this.halfBaseLength : y + dy - this.halfBaseLength;
        var left = x - this.halfBaseLength;
        var traceCollision = this.calculateAreaTraceCollision(left, this.baseLength, edgeY, 1, z);
        collisionInfo.blocked = traceCollision.blocked;
        collisionInfo.functions = traceCollision.functions;
    }
    return collisionInfo;
};

function isZOverlap(z1, height1, z2, height2) {
    var noOverlap = z1 + height1 <= z2 || z2 + height2 <= z1;
    return !noOverlap;
}
