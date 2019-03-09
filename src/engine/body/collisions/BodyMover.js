dependsOn("/body/Body.js");

/**
 * @type {Object.<int, BodyExt>}
 */
var bodyMap = {};

/**
 * @param {SplitTime.Body} body
 * @constructor
 */
function BodyExt(body) {
    this.bumped = false;
    this.pushing = false;
    this.sliding = false;
    this.previousGroundBody = null;
    this.previousGroundTraceX = null;
    this.previousGroundTraceY = null;
    this.previousGroundTraceZ = null;
}

/**
 * @param {SplitTime.Body} body
 * @returns {BodyExt}
 */
function getBodyExt(body) {
    if(!(body.ref in bodyMap)) {
        bodyMap[body.ref] = new BodyExt(body);
    }

    return bodyMap[body.ref];
}

/**
 * @param {SplitTime.Body} body
 * @constructor
 */
SplitTime.Body.Mover = function(body) {
    this.body = body;
    this.level = body.getLevel();
    /** @type {SplitTime.Level.BodyOrganizer} */
    this.levelBodyOrganizer = this.level.getBodyOrganizer();
    this.bodyExt = getBodyExt(this.body);

    this.baseLength = this.body.baseLength;
    this.halfBaseLength = Math.round(this.baseLength / 2);
    this.height = this.body.height;
};

SplitTime.Body.Mover.VERTICAL_FUDGE = 4;

/**
 * Zelda step with input direction
 * @param distance
 * @param direction
 * @returns {boolean}
 */
SplitTime.Body.Mover.prototype.zeldaBump = function(distance, direction) {
    this.ensureInLevel();
    //Prevent infinite recursion
    if(this.bodyExt.pushing || this.bodyExt.bumped) {
        return false;
    }
    this.bodyExt.bumped = true;

    //Save direction
    var tDir = this.dir;
    //Set direction
    this.dir = direction;
    //Bump
    var moved = this.zeldaStep(direction, distance);
    //Revert direction;
    this.dir = tDir;

    this.bodyExt.bumped = false;
    return moved > 0;
};

/**
 * Check that body is in current level
 */
SplitTime.Body.Mover.prototype.ensureInLevel = function() {
    if(this.body.getLevel() !== SplitTime.Level.getCurrent()) {
        throw new Error("Attempt to do zelda movement for body not on current board");
    }
};

/**
 * Move the body along the Z-axis up to the specified (maxZ) number of pixels.
 * @param {number} maxDZ
 * @returns {number} Z pixels actually moved
 */
SplitTime.Body.Mover.prototype.zeldaVerticalBump = function(maxDZ) {
    this.ensureInLevel();

    var groundBody = this.bodyExt.previousGroundBody;
    if(groundBody && isStandingOnBody(this.body, groundBody)) {
        return 0;
    }
    this.bodyExt.previousGroundBody = null;
    if(maxDZ < 0 && isGroundTracePixelRelevant(this.body, this.bodyExt.previousGroundTraceX, this.bodyExt.previousGroundTraceY, this.bodyExt.previousGroundTraceZ)) {
        return 0;
    }
    this.bodyExt.previousGroundTraceX = null;
    this.bodyExt.previousGroundTraceY = null;
    this.bodyExt.previousGroundTraceZ = null;

    var traceDZ;
    if(Math.abs(maxDZ) < 0.000001) {
        // do nothing
        return 0;
    } else if(maxDZ > 0) {
        traceDZ = this.zeldaVerticalRiseTraces(maxDZ);
        // TODO: check bodies
        return traceDZ;
    } else {
        traceDZ = this.zeldaVerticalDropTraces(-maxDZ);
        // TODO: check bodies
        return traceDZ;
    }
};

/**
 * @param {SplitTime.Body} standingBody
 * @param {SplitTime.Body} groundBody
 * @returns {boolean}
 */
function isStandingOnBody(standingBody, groundBody) {
    return false;
    // TODO
    // Check for perfect groundBody.z + groundBody.height === standingBody.z
    // Then check for horizontal overlap of bases
}

function isGroundTracePixelRelevant(body, x, y, z) {
    if(body._zeldaPreviousGroundTraceX && body._zeldaPreviousGroundTraceY && body._zeldaPreviousGroundTraceZ) {
        // TODO
        // Check if body still covers x and y
        // If so, check that z matches pixel
    }
    return false;
}