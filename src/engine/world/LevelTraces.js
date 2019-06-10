/**
 * @constructor
 * @property {ImageData[]} layerFuncData
 * @param {SplitTime.Level} level
 * @param {SplitTime.LevelFileData} levelFileData
 */
SplitTime.LevelTraces = function(level, levelFileData) {
    this.level = level;
    this.levelFileData = levelFileData;
    /** @type ImageData[] */
    this.layerFuncData = [];

    this.initCanvasData();
};

SplitTime.LevelTraces.CollisionInfo = function() {
    this.containsSolid = false;
    this.otherLevelInvolved = false;
    /** @type {int} */
    this.zBlockedTopEx = 0;
    /** @type {int} */
    this.zBlockedBottom = Number.MAX_SAFE_INTEGER;
    /** @type {Object.<string, ZRange>} */
    this.events = {};
};

function ZRange(minZ, exMaxZ) {
    this.minZ = minZ;
    this.exMaxZ = exMaxZ;
}

SplitTime.LevelTraces.prototype.getFunctionIdFromPixel = function(r, g, b, a) {
    var functionIntId = SplitTime.Trace.getFunctionIdFromColor(r, g, b, a);
    return this._internalEventIdMap[functionIntId];
};

/**
 * @return {SplitTime.Trace}
 */
SplitTime.LevelTraces.prototype.getPointerTraceFromPixel = function(r, g, b, a) {
    var pointerIntId = SplitTime.Trace.getPointerIdFromColor(r, g, b, a);
    return this._internalPointerTraceMap[pointerIntId];
};

/**
 * Check that the volume is open in level collision canvas data.
 * @param {SplitTime.LevelTraces.CollisionInfo} collisionInfo
 * @param {int} startX
 * @param {int} xPixels
 * @param {int} startY
 * @param {int} yPixels
 * @param {number} minZ
 * @param {number} exMaxZ (positive)
 */
SplitTime.LevelTraces.prototype.calculateVolumeCollision = function(collisionInfo, startX, xPixels, startY, yPixels, minZ, exMaxZ) {
    for(var y = startY; y < startY + yPixels; y++) {
        for(var x = startX; x < startX + xPixels; x++) {
            this.calculatePixelColumnCollisionInfo(collisionInfo, x, y, minZ, exMaxZ);
        }
    }
};

/**
 * Check that the pixel is open in level collision canvas data.
 * @param {SplitTime.LevelTraces.CollisionInfo} collisionInfo
 * @param {int} x
 * @param {int} y
 * @param {number} minZ
 * @param {number} exMaxZ (positive)
 */
SplitTime.LevelTraces.prototype.calculatePixelColumnCollisionInfo = function(collisionInfo, x, y, minZ, exMaxZ) {
    for(var iLayer = 0; iLayer < this.levelFileData.layers.length; iLayer++) {
        var layerZ = this.levelFileData.layers[iLayer].z;
        var nextLayer = this.levelFileData.layers[iLayer + 1];
        var nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_SAFE_INTEGER;
        if(exMaxZ > layerZ && minZ < nextLayerZ) {
            this._calculatePixelCollision(collisionInfo, x, y, iLayer, layerZ, Math.max(layerZ, minZ), Math.min(nextLayerZ, exMaxZ));
        }
    }
};

var fromPointerLevels = [];

SplitTime.LevelTraces.prototype._calculatePixelCollision = function(collisionInfo, x, y, layer, layerZ, minZ, exMaxZ) {
    var imageData = this.layerFuncData[layer];
    var dataIndex = SplitTime.pixCoordToIndex(x, y, imageData);
    var r = imageData.data[dataIndex++];
    var g = imageData.data[dataIndex++];
    var b = imageData.data[dataIndex++];
    var a = imageData.data[dataIndex++];
    if(a === 255) {
        switch(r) {
            case SplitTime.Trace.RColor.SOLID:
                var height = layerZ + g;
                if(height >= minZ) {
                    collisionInfo.containsSolid = true;
                    collisionInfo.zBlockedTopEx = Math.max(height, collisionInfo.zBlockedTopEx);
                    collisionInfo.zBlockedBottom = Math.min(layerZ, collisionInfo.zBlockedBottom);
                }
                break;
            case SplitTime.Trace.RColor.EVENT:
                var functionId = this.getFunctionIdFromPixel(r, g, b, a);
                if(!(functionId in collisionInfo.events)) {
                    collisionInfo.events[functionId] = new ZRange(minZ, exMaxZ);
                } else {
                    collisionInfo.events[functionId].minZ = Math.min(minZ, collisionInfo.events[functionId].minZ);
                    collisionInfo.events[functionId].exMaxZ = Math.max(exMaxZ, collisionInfo.events[functionId].exMaxZ);
                }
                break;
            case SplitTime.Trace.RColor.POINTER:
                var trace = this.getPointerTraceFromPixel(r, g, b, a);
                if(fromPointerLevels.indexOf(trace.level.id) < 0) {
                    fromPointerLevels.push(this.level.id);
                    try {
                        if(!SplitTime.Debug.ENABLED || this.level.getRegion() === trace.level.getRegion()) {
                            var otherCollisionInfo = new SplitTime.LevelTraces.CollisionInfo();
                            trace.level.getLevelTraces().calculatePixelColumnCollisionInfo(
                                otherCollisionInfo,
                                x + trace.offsetX,
                                y + trace.offsetY,
                                minZ + trace.offsetZ,
                                exMaxZ + trace.offsetZ
                            );
                            if(otherCollisionInfo.containsSolid) {
                                collisionInfo.containsSolid = true;
                                collisionInfo.zBlockedTopEx = Math.max(otherCollisionInfo.zBlockedTopEx - trace.offsetZ, collisionInfo.zBlockedTopEx);
                                collisionInfo.zBlockedBottom = Math.min(otherCollisionInfo.zBlockedBottom - trace.offsetZ, collisionInfo.zBlockedBottom);
                            }
                            // TODO: maybe harvest events from other level
                        } else {
                            console.warn("Pointer trace accessing level outside region: " + trace.level.id);
                        }
                        collisionInfo.otherLevelInvolved = true;
                    } finally {
                        fromPointerLevels.pop();
                    }
                }
                break;
        }
    }
};

SplitTime.LevelTraces.prototype.initCanvasData = function() {
    this._internalEventIdMap = {};
    this._internalPointerTraceMap = {};
    var nextFunctionId = 1;
    var nextPointerId = 1;

    var holderCanvas = document.createElement("canvas");
    holderCanvas.width = this.level.width/(this.level.type === SplitTime.main.State.OVERWORLD ? 32 : 1);
    holderCanvas.height = this.level.yWidth/(this.level.type === SplitTime.main.State.OVERWORLD ? 32 : 1);
    var holderCtx = holderCanvas.getContext("2d");

    var debugTraceCtx;
    if(SplitTime.Debug.DRAW_TRACES) {
        this.debugTraceCanvas = document.createElement("canvas");
        this.debugTraceCanvas.width = this.level.width;
        this.debugTraceCanvas.height = this.level.height;
        debugTraceCtx = this.debugTraceCanvas.getContext("2d");
        debugTraceCtx.clearRect(0, 0, this.debugTraceCanvas.width, this.debugTraceCanvas.height);
    }

    //Initialize functional map
    for(var iLayer = 0; iLayer < this.levelFileData.layers.length; iLayer++) {
        holderCtx.clearRect(0, 0, holderCanvas.width, holderCanvas.height);

        var layerZ = this.levelFileData.layers[iLayer].z;
        var nextLayer = this.levelFileData.layers[iLayer + 1];
        var nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_VALUE;
        var layerHeight = nextLayerZ - layerZ;

        //Draw traces
        var layerTraces = this.levelFileData.layers[iLayer].traces;

        holderCtx.translate(0.5, 0.5);

        for(var iLayerTrace = 0; iLayerTrace < layerTraces.length; iLayerTrace++) {
            var trace = layerTraces[iLayerTrace];
            var type = trace.type;
            switch(type) {
                case SplitTime.Trace.Type.EVENT:
                    var eventStringId = trace.event;
                    var eventIntId = nextFunctionId++;
                    this._internalEventIdMap[eventIntId] = eventStringId;
                    var functionColor = SplitTime.Trace.getFunctionColor(eventIntId);
                    SplitTime.Trace.drawColor(trace.vertices, holderCtx, functionColor);
                    break;
                case SplitTime.Trace.Type.SOLID:
                    var height = trace.height || layerHeight;
                    SplitTime.Trace.drawColor(trace.vertices, holderCtx, SplitTime.Trace.getSolidColor(height));
                    break;
                case SplitTime.Trace.Type.GROUND:
                    SplitTime.Trace.drawColor(trace.vertices, holderCtx, SplitTime.Trace.getSolidColor(0));
                    break;
                case SplitTime.Trace.Type.STAIRS:
                    var stairsUpDirection = trace.direction;
                    var gradient = SplitTime.Trace.calculateGradient(trace.vertices, holderCtx, stairsUpDirection);
                    gradient.addColorStop(0, SplitTime.Trace.getSolidColor(0));
                    gradient.addColorStop(1, SplitTime.Trace.getSolidColor(layerHeight));
                    SplitTime.Trace.drawColor(trace.vertices, holderCtx, gradient);
                    break;
                case SplitTime.Trace.Type.POINTER:
                    var pointerIntId = nextPointerId++;
                    // TODO: actual SplitTime.Trace object
                    this._internalPointerTraceMap[pointerIntId] = SplitTime.Trace.fromRaw(trace);
                    var pointerColor = SplitTime.Trace.getPointerColor(pointerIntId);
                    SplitTime.Trace.drawColor(trace.vertices, holderCtx, pointerColor);
                    break;
                default:
                    SplitTime.Trace.draw(layerTraces[iLayerTrace].vertices, holderCtx, type);
            }
        }
        
        // TODO: traces related to props
        
        holderCtx.translate(-0.5, -0.5);

        this.layerFuncData[iLayer] = holderCtx.getImageData(0, 0, holderCanvas.width, holderCanvas.height);

        if(SplitTime.Debug.DRAW_TRACES) {
            debugTraceCtx.drawImage(holderCanvas, 0, -layerZ);
        }
    }
};

SplitTime.LevelTraces.prototype.getDebugTraceCanvas = function() {
    return this.debugTraceCanvas;
};