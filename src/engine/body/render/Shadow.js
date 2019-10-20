dependsOn("../Body.js");

/**
 * @param {SplitTime.Body} body
 * @constructor
 * @implements {SplitTime.Body.Drawable}
 */
SplitTime.Body.Shadow = function(body) {
    this.realBody = body;
    this.shadowBody = new SplitTime.Body();
    this.shadowBody.drawable = this;
    this.shadowBody.baseLength = body.baseLength;
    this.shadowBody.height = 0;

    this.minRadius = 4;
    this.maxRadius = this.shadowBody.baseLength;
    this.radius = this.maxRadius;
};

SplitTime.Body.Shadow.prototype.opacity = 1;
SplitTime.Body.Shadow.prototype.playerOcclusionFadeFactor = 0;

SplitTime.Body.Shadow.prototype.getCanvasRequirements = function(x, y, z) {
    return new SplitTime.Body.Drawable.CanvasRequirements(Math.round(x), Math.round(y), Math.round(z), this.radius, this.radius);
};

/**
 * @param {CanvasRenderingContext2D} ctx
 */
SplitTime.Body.Shadow.prototype.draw = function(ctx) {
    var
        // Radii of the white glow.
        innerRadius = 2,
        outerRadius = this.radius,
        // Radius of the entire circle.
        radius = this.radius;

    var gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, .7)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.scale(1, 0.5);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);

    ctx.fillStyle = gradient;
    ctx.fill();
};

SplitTime.Body.Shadow.prototype.notifyFrameUpdate = function(delta) {
    // Do nothing
};

SplitTime.Body.Shadow.prototype.prepareForRender = function() {
    this.shadowBody.put(this.realBody.level, this.realBody.x, this.realBody.y, this.realBody.z);
    var shadowFallInfo = this.shadowBody.mover.calculateDrop(this.realBody.level.highestLayerZ + 1000);
    this.shadowBody.setZ(shadowFallInfo.zBlocked);
    this.radius = (this.maxRadius - this.minRadius) / (0.05 * shadowFallInfo.distanceAllowed + 1) + this.minRadius;
};
SplitTime.Body.Shadow.prototype.cleanupAfterRender = function() {
    // Do nothing
};
