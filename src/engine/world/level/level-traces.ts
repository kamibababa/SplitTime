namespace splitTime.level {
    export namespace traces {
        export class ZRange {
            // FTODO: int?
            constructor(public minZ: number, public exMaxZ: number) {}
        }

        export class CollisionInfo {
            containsSolid: boolean
            levels: { [levelId: string]: Level }
            pointerTraces: { [levelId: string]: splitTime.Trace }
            zBlockedTopEx: int
            zBlockedBottom: int
            events: { [eventId: string]: ZRange }
            constructor() {
                this.containsSolid = false
                this.levels = {}
                this.pointerTraces = {}
                this.zBlockedTopEx = 0
                this.zBlockedBottom = splitTime.MAX_SAFE_INTEGER
                this.events = {}
            }
        }
    }

    export class Traces {
        level: splitTime.Level
        levelFileData: splitTime.level.FileData
        layerFuncData: ImageData[]
        _internalEventIdMap: any
        _internalPointerTraceMap: any
        debugTraceCanvas: HTMLCanvasElement | null = null

        constructor(
            level: splitTime.Level,
            levelFileData: splitTime.level.FileData,
            world: World
        ) {
            this.level = level
            this.levelFileData = levelFileData
            this.layerFuncData = []

            this.initCanvasData(world)
        }

        getEventIdFromPixel(r: number, g: number, b: number, a: number) {
            var eventIntId = splitTime.Trace.getEventIdFromColor(r, g, b, a)
            return this._internalEventIdMap[eventIntId]
        }

        /**
         * @return {splitTime.Trace}
         */
        getPointerTraceFromPixel(
            r: number,
            g: number,
            b: number,
            a: number
        ): splitTime.Trace {
            var pointerIntId = splitTime.Trace.getPointerIdFromColor(r, g, b, a)
            return this._internalPointerTraceMap[pointerIntId]
        }

        /**
         * Check that the volume is open in level collision canvas data.
         * @param exMaxZ (positive)
         */
        calculateVolumeCollision(
            collisionInfo: traces.CollisionInfo,
            startX: int,
            xPixels: int,
            startY: int,
            yPixels: int,
            minZ: int,
            exMaxZ: int
        ) {
            for (var y = startY; y < startY + yPixels; y++) {
                for (var x = startX; x < startX + xPixels; x++) {
                    this.calculatePixelColumnCollisionInfo(
                        collisionInfo,
                        x,
                        y,
                        minZ,
                        exMaxZ
                    )
                }
            }
        }

        /**
         * Check that the pixel is open in level collision canvas data.
         * @param exMaxZ (positive)
         */
        calculatePixelColumnCollisionInfo(
            collisionInfo: traces.CollisionInfo,
            x: int,
            y: int,
            minZ: int,
            exMaxZ: int
        ) {
            for (
                var iLayer = 0;
                iLayer < this.levelFileData.layers.length;
                iLayer++
            ) {
                var layerZ = this.levelFileData.layers[iLayer].z
                var nextLayer = this.levelFileData.layers[iLayer + 1]
                var nextLayerZ = nextLayer ? nextLayer.z : splitTime.MAX_SAFE_INTEGER
                if (exMaxZ > layerZ && minZ < nextLayerZ) {
                    this._calculatePixelCollision(
                        collisionInfo,
                        x,
                        y,
                        iLayer,
                        layerZ,
                        Math.max(layerZ, minZ),
                        Math.min(nextLayerZ, exMaxZ)
                    )
                }
            }
        }

        private _calculatePixelCollision(
            collisionInfo: traces.CollisionInfo,
            x: int,
            y: int,
            layer: int,
            layerZ: int,
            minZ: int,
            exMaxZ: int
        ) {
            var imageData = this.layerFuncData[layer]
            var dataIndex = pixCoordToIndex(x, y, imageData)
            var r = imageData.data[dataIndex++]
            var g = imageData.data[dataIndex++]
            var b = imageData.data[dataIndex++]
            var a = imageData.data[dataIndex++]
            let isOtherLevel = false
            if (a === 255) {
                switch (r) {
                    case splitTime.Trace.RColor.SOLID:
                        var height = layerZ + g
                        if (height >= minZ) {
                            collisionInfo.containsSolid = true
                            collisionInfo.zBlockedTopEx = Math.max(
                                height,
                                collisionInfo.zBlockedTopEx
                            )
                            collisionInfo.zBlockedBottom = Math.min(
                                layerZ,
                                collisionInfo.zBlockedBottom
                            )
                        }
                        break
                    case splitTime.Trace.RColor.EVENT:
                        var eventId = this.getEventIdFromPixel(r, g, b, a)
                        if (!(eventId in collisionInfo.events)) {
                            collisionInfo.events[eventId] = new traces.ZRange(
                                minZ,
                                exMaxZ
                            )
                        } else {
                            collisionInfo.events[eventId].minZ = Math.min(
                                minZ,
                                collisionInfo.events[eventId].minZ
                            )
                            collisionInfo.events[eventId].exMaxZ = Math.max(
                                exMaxZ,
                                collisionInfo.events[eventId].exMaxZ
                            )
                        }
                        break
                    case splitTime.Trace.RColor.POINTER:
                        isOtherLevel = true
                        var trace = this.getPointerTraceFromPixel(r, g, b, a)
                        if (!trace.level) {
                            throw new Error("Pointer trace has no level")
                        }
                        collisionInfo.pointerTraces[trace.level.id] = trace
                        collisionInfo.levels[trace.level.id] = trace.level
                        break
                }
            }

            if (!isOtherLevel) {
                collisionInfo.levels[this.level.id] = this.level
            }
        }

        initCanvasData(world: World) {
            this._internalEventIdMap = {}
            this._internalPointerTraceMap = {}
            var nextFunctionId = 1
            var nextPointerId = 1

            var holderCanvas = document.createElement("canvas")
            holderCanvas.width = this.level.width
            holderCanvas.height = this.level.yWidth
            var holderCtx = holderCanvas.getContext("2d")

            if (holderCtx === null) {
                throw new Error("Unable to initialize holderCtx")
            }

            var debugTraceCtx = null
            if (splitTime.debug.ENABLED) {
                this.debugTraceCanvas = document.createElement("canvas")
                this.debugTraceCanvas.width = this.level.width
                this.debugTraceCanvas.height = this.level.height
                debugTraceCtx = this.debugTraceCanvas.getContext("2d")
                if (debugTraceCtx === null) {
                    throw new Error("Unable to initialize debugTraceCtx")
                }
                debugTraceCtx.clearRect(
                    0,
                    0,
                    this.debugTraceCanvas.width,
                    this.debugTraceCanvas.height
                )
            }

            const tracesByLayer = this.getFragmentedTraces()

            //Initialize functional map
            for (
                var iLayer = 0;
                iLayer < this.levelFileData.layers.length;
                iLayer++
            ) {
                holderCtx.clearRect(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                var layerZ = this.levelFileData.layers[iLayer].z
                var nextLayer = this.levelFileData.layers[iLayer + 1]
                var nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_VALUE
                var layerHeight = nextLayerZ - layerZ

                //Draw traces
                const layerTraces = tracesByLayer[iLayer]

                holderCtx.translate(0.5, 0.5)

                for (
                    var iLayerTrace = 0;
                    iLayerTrace < layerTraces.length;
                    iLayerTrace++
                ) {
                    var trace = layerTraces[iLayerTrace]
                    var type = trace.type
                    switch (type) {
                        case splitTime.Trace.Type.EVENT:
                            var eventStringId = trace.event
                            var eventIntId = nextFunctionId++
                            this._internalEventIdMap[eventIntId] = eventStringId
                            var functionColor = splitTime.Trace.getEventColor(
                                eventIntId
                            )
                            splitTime.Trace.drawColor(
                                trace.vertices,
                                holderCtx,
                                functionColor
                            )
                            break
                        case splitTime.Trace.Type.SOLID:
                            var height = +trace.height || layerHeight
                            splitTime.Trace.drawColor(
                                trace.vertices,
                                holderCtx,
                                splitTime.Trace.getSolidColor(height)
                            )
                            break
                        case splitTime.Trace.Type.GROUND:
                            splitTime.Trace.drawColor(
                                trace.vertices,
                                holderCtx,
                                splitTime.Trace.getSolidColor(0)
                            )
                            break
                        case splitTime.Trace.Type.STAIRS:
                            var stairsUpDirection = trace.direction
                            var gradient = splitTime.Trace.calculateGradient(
                                trace.vertices,
                                holderCtx,
                                stairsUpDirection
                            )
                            gradient.addColorStop(
                                0,
                                splitTime.Trace.getSolidColor(0)
                            )
                            gradient.addColorStop(
                                1,
                                splitTime.Trace.getSolidColor(layerHeight)
                            )
                            splitTime.Trace.drawColor(
                                trace.vertices,
                                holderCtx,
                                gradient
                            )
                            break
                        case splitTime.Trace.Type.POINTER:
                            var pointerIntId = nextPointerId++
                            // TODO: actual splitTime.Trace object
                            this._internalPointerTraceMap[
                                pointerIntId
                            ] = splitTime.Trace.fromRaw(trace, layerZ, world)
                            var pointerColor = splitTime.Trace.getPointerColor(
                                pointerIntId
                            )
                            splitTime.Trace.drawColor(
                                trace.vertices,
                                holderCtx,
                                pointerColor
                            )
                            break
                        case splitTime.Trace.Type.TRANSPORT:
                            var transportTrace = splitTime.Trace.fromRaw(
                                trace,
                                layerZ,
                                world
                            )
                            var transportStringId = transportTrace.getLocationId()
                            var transportIntId = nextFunctionId++
                            this._internalEventIdMap[
                                transportIntId
                            ] = transportStringId
                            var transportColor = splitTime.Trace.getEventColor(
                                transportIntId
                            )
                            splitTime.Trace.drawColor(
                                trace.vertices,
                                holderCtx,
                                transportColor
                            )
                            break
                        default:
                            splitTime.Trace.draw(
                                layerTraces[iLayerTrace].vertices,
                                holderCtx,
                                type
                            )
                    }
                }

                // TODO: traces related to props

                holderCtx.translate(-0.5, -0.5)

                this.layerFuncData[iLayer] = holderCtx.getImageData(
                    0,
                    0,
                    holderCanvas.width,
                    holderCanvas.height
                )

                if (splitTime.debug.ENABLED && debugTraceCtx !== null) {
                    debugTraceCtx.drawImage(holderCanvas, 0, -layerZ)
                }
            }
        }

        /**
         * Potentially split up traces into smaller traces if crossing layer boundaries
         */
        getFragmentedTraces(): file_data.Trace[][] {
            let queuedSolidTraces: file_data.Trace[] = []
            let tracesByLayer: file_data.Trace[][] = []
            for (
                let iLayer = 0;
                iLayer < this.levelFileData.layers.length;
                iLayer++
            ) {
                const layerZ = this.levelFileData.layers[iLayer].z
                const nextLayer = this.levelFileData.layers[iLayer + 1]
                const nextLayerZ = nextLayer ? nextLayer.z : Number.MAX_VALUE
                const layerHeight = nextLayerZ - layerZ

                const allTracesForLayer = queuedSolidTraces.concat(this.levelFileData.layers[iLayer].traces)
                queuedSolidTraces = []
                tracesByLayer[iLayer] = []
                for (const trace of allTracesForLayer) {
                    switch (trace.type) {
                        case splitTime.Trace.Type.SOLID:
                            const height = +trace.height || layerHeight
                            if (height > layerHeight) {
                                const truncTrace = {} as file_data.Trace
                                Object.assign(truncTrace, trace)
                                truncTrace.height = "" + layerHeight
                                tracesByLayer[iLayer].push(truncTrace)
    
                                const upperTrace = {} as file_data.Trace
                                Object.assign(upperTrace, trace)
                                upperTrace.height = "" + (height - layerHeight)
                                queuedSolidTraces.push(upperTrace)
                            } else {
                                tracesByLayer[iLayer].push(trace)
                            }
                            break
                        default:
                            tracesByLayer[iLayer].push(trace)
                    }
                }
            }
            return tracesByLayer
        }
    
        getDebugTraceCanvas() {
            return this.debugTraceCanvas
        }
    }

    /**
     * Gets the index on canvas data of given coordinates
     * @param {int} x
     * @param {int} y
     * @param {ImageData} data Collision canvas data array
     * @returns {int}
     */
    function pixCoordToIndex(x: int, y: int, data: ImageData): int {
        return (y * data.width + x) * 4
    }
}
