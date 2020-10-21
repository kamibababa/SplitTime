namespace splitTime.editor.level {
    interface VueRenderedTrace {
        // props
        levelEditorShared: LevelEditorShared
        trace: Trace
        // data
        uid: string
        // computed
        hasClose: boolean
        height: number
        vertices: Coordinates3D[]
        pointsArray: (Readonly<Coordinates2D> | null)[]
        points: string
        pointsShadow: string
        pointsStairsSlope: string
        traceFill: string
        traceStroke: string
        traceShadowFill: string
        traceShadowStroke: string
        traceShadowDisplayed: boolean
        otherLevelDisplayed: boolean
        // asyncComputed
        otherLevel: splitTime.level.FileData
        otherLevelImgSrc: string
        // methods
        track(point: Coordinates2D): void
        toggleHighlight(highlight: boolean): void
    }

    function hasClose(this: VueRenderedTrace): boolean {
        var pointArray = this.pointsArray
        return pointArray.length > 0 && pointArray[pointArray.length - 1] === null
    }
    function height(this: VueRenderedTrace): number {
        return this.trace.obj.height
    }
    function vertices(this: VueRenderedTrace): Coordinates3D[] {
        var pointsArray = this.pointsArray
        const nonNullPoints = pointsArray.filter(point => {
            return point !== null
        }) as Readonly<Coordinates2D>[]
        return nonNullPoints.map(point => {
            return {
                x: point.x,
                y: point.y,
                z: this.trace.obj.z
            }
        })
    }

    function pointsArray(this: VueRenderedTrace): (Readonly<Coordinates2D> | null)[] {
        return safeExtractTraceArray(this.levelEditorShared.level, this.trace.obj.vertices)
    }

    function points(this: VueRenderedTrace): string {
        var that = this
        var pointsArray = this.pointsArray
        return pointsArray.map(point => {
            if(point !== null) {
                const y = point.y - that.trace.obj.z
                return point.x + "," + y
            } else if(pointsArray.length > 0 && pointsArray[0] !== null) {
                const y = pointsArray[0].y - that.trace.obj.z
                return pointsArray[0].x + "," + y
            }
            return ""
        }).join(" ")
    }
    function pointsShadow(this: VueRenderedTrace): string {
        const pointsArray2D = this.pointsArray
        const pointsArray3D = pointsArray2D.map(point => {
            if(!point) {
                return null
            }
            const point3D = {
                x: point.x,
                y: point.y,
                z: this.trace.obj.z + this.trace.obj.height
            }
            return point3D
        })
        return pointsArray3D.reduce((pointsStr, point) => {
            var y
            if(point !== null) {
                y = point.y - point.z
                return pointsStr + " " + point.x + "," + y
            } else if(pointsArray3D.length > 0 && pointsArray3D[0] !== null) {
                y = pointsArray3D[0].y - pointsArray3D[0].z
                return pointsStr + " " + pointsArray3D[0].x + "," + y
            }
            return pointsStr
        }, "")
    }
    function pointsStairsSlope(this: VueRenderedTrace): string {
        var that = this
        const pointsArray2D = this.pointsArray
        let pointsArray3D: (Coordinates3D | null)[] = []
        if(this.trace.obj.type === splitTime.trace.Type.STAIRS && !!this.trace.obj.direction && pointsArray2D.length >= 3) {
            var officialTrace = splitTime.trace.TraceSpec.fromRaw(this.trace.obj)
            var extremes = officialTrace.calculateStairsExtremes()
            var stairsVector = new splitTime.Vector2D(extremes.top.x - extremes.bottom.x, extremes.top.y - extremes.bottom.y)
            var stairsLength = stairsVector.magnitude
            var totalDZ = that.trace.obj.height
            pointsArray3D = pointsArray2D.map(point => {
                if(!point) {
                    return point
                }
                var partUpVector = new splitTime.Vector2D(point.x - extremes.bottom.x, point.y - extremes.bottom.y) 
                var distanceUp = stairsVector.times(partUpVector.dot(stairsVector) / (stairsLength * stairsLength)).magnitude
                var height = Math.min(Math.round(totalDZ * (distanceUp / stairsLength)), totalDZ)
                const point3D = {
                    x: point.x,
                    y: point.y,
                    z: that.trace.obj.z + height
                }
                return point3D
            })
        }
        return pointsArray3D.reduce(function(pointsStr, point) {
            var y
            if(point !== null) {
                y = point.y - point.z
                return pointsStr + " " + point.x + "," + y
            } else if(pointsArray3D.length > 0 && pointsArray3D[0] !== null) {
                y = pointsArray3D[0].y - pointsArray3D[0].z
                return pointsStr + " " + pointsArray3D[0].x + "," + y
            }
            return pointsStr
        }, "")
    }
    function traceFill(this: VueRenderedTrace): string {
        if (!this.hasClose) {
            return "none"
        }
        if (this.otherLevelDisplayed && this.otherLevelImgSrc) {
            return "url(#img-" + this.uid + ")"
        }
        return safeGetColor(this.trace)
    }
    function traceStroke(this: VueRenderedTrace): string {
        return this.hasClose ? "black" : safeGetColor(this.trace)
    }
    function traceShadowFill(this: VueRenderedTrace): string {
        return this.trace.metadata.highlighted ? client.TRACE_GROUND_HIGHLIGHT_COLOR : client.TRACE_GROUND_COLOR
    }
    function traceShadowStroke(this: VueRenderedTrace): string {
        return "black"
    }
    function traceShadowDisplayed(this: VueRenderedTrace): boolean {
        return this.hasClose && this.height > 0
    }
    function otherLevelDisplayed(this: VueRenderedTrace): boolean {
        const isTypeOtherLevel = this.trace.obj.type === splitTime.trace.Type.POINTER ||
            this.trace.obj.type === splitTime.trace.Type.TRANSPORT
        return isTypeOtherLevel && this.trace.metadata.highlighted
    }

    async function otherLevel(this: VueRenderedTrace): Promise<splitTime.level.FileData> {
        if (!this.trace.obj.level) {
            return exportLevel(new Level())
        }
        const s = this.levelEditorShared.server
        return s.api.levelJson.fetch(s.withProject({ levelId: this.trace.obj.level }))
    }
    function otherLevelImgSrc(this: VueRenderedTrace): PromiseLike<string> {
        return this.levelEditorShared.server.imgSrc(this.otherLevel.background)
    }

    function track(this: VueRenderedTrace, point?: Coordinates2D): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            return
        }
        const trace = this.trace.obj
        const originalPointString = trace.vertices
        const originalPoint = point ? new Coordinates2D(point.x, point.y) : null
        const traceSpec = splitTime.trace.TraceSpec.fromRaw(trace)
        const originalPoints = traceSpec.vertices.filter(instanceOf.Coordinates2D)
        const snappedMover = new client.GridSnapMover(this.levelEditorShared.gridCell, originalPoints)
        const follower = {
            shift: (dx: number, dy: number) => {
                snappedMover.applyDelta(dx, dy)
                const snappedDelta = snappedMover.getSnappedDelta()
                var regex = /\((-?[\d]+),\s*(-?[\d]+)\)/g
                if (originalPoint) {
                    regex = new RegExp("\\((" + originalPoint.x + "),\\s*(" + originalPoint.y + ")\\)", "g")
                }
                trace.vertices = originalPointString.replace(regex, function(match, p1, p2) {
                    var newX = Number(p1) + snappedDelta.x
                    var newY = Number(p2) + snappedDelta.y
                    return "(" + newX + ", " + newY + ")"
                })
            }
        }
        this.levelEditorShared.follow(follower)
        this.levelEditorShared.propertiesPaneStuff = getTracePropertiesStuff(this.trace)
    }
    function toggleHighlight(this: VueRenderedTrace, highlight: boolean): void {
        if(this.levelEditorShared.shouldDragBePrevented()) {
            this.trace.metadata.highlighted = false
            return
        }
        this.trace.metadata.highlighted = highlight
    }


    Vue.component("rendered-trace", {
        props: {
            levelEditorShared: Object,
            trace: Object
        },
        data: function() {
            return {
                uid: generateUID()
            }
        },
        computed: {
            hasClose,
            height,
            vertices,
            pointsArray,
            points,
            pointsShadow,
            pointsStairsSlope,
            traceFill,
            traceStroke,
            traceShadowFill,
            traceShadowStroke,
            traceShadowDisplayed,
            otherLevelDisplayed
        },
        asyncComputed: {
            otherLevel: {
                get: otherLevel,
                default: exportLevel(new Level())
            },
            otherLevelImgSrc: {
                get: otherLevelImgSrc,
                default: ""
            }
        },
        methods: {
            track,
            toggleHighlight
        },
        template: `
<g>
    <defs>
        <!-- Window to linked level FTODO: change to showing more than just background -->
        <!-- Also FTODO: back with black -->
        <pattern
            v-if="otherLevelDisplayed"
            :id="'img-' + uid"
            :x="-trace.obj.offsetX"
            :y="-trace.obj.offsetY + trace.obj.offsetZ"
            :width="otherLevel.width + 1000"
            :height="otherLevel.height + 1000"
            patternUnits="userSpaceOnUse"
        >
            <image
                :width="otherLevel.width"
                :height="otherLevel.height"
                preserveAspectRatio="none"
                :href="otherLevelImgSrc"
            />
        </pattern>
    </defs>
    <!-- Base outline and fill -->
    <polyline
            v-show="trace.metadata.displayed"
            v-on:dblclick.prevent
            v-on:mousedown.left="track(null)"
            v-on:mouseenter="toggleHighlight(true)"
            v-on:mouseleave="toggleHighlight(false)"
            :points="points"
            :stroke="traceStroke"
            :fill="traceFill"
    ></polyline>
    <!-- Points/vertices -->
    <circle
            class="hoverable"
            v-for="(vertex) in vertices"
            :cx="vertex.x"
            :cy="vertex.y - vertex.z"
            r="3"
            v-on:mousedown.left="track(vertex)"
    />
    <!-- Outline for ramp/slope part of stairs; adds more of a 3D look -->
    <polyline
            v-show="trace.metadata.displayed"
            :points="pointsStairsSlope"
            stroke="red" stroke-width="5" fill="none"
            v-if="pointsStairsSlope"
            style="pointer-events: none;"
    ></polyline>
    <!-- Up-arrows fill pattern on ramp/slope plus additional dashed outline on top of the previous -->
    <polyline
            v-show="trace.metadata.displayed"
            :points="pointsStairsSlope"
            stroke="black" stroke-width="2" stroke-dasharray="10,5" :fill="'url(#up-arrows-pattern)'"
            v-if="pointsStairsSlope"
            style="pointer-events: none;"
    ></polyline>
    <!-- Outline and fill for the top (z-axis/height) face area of the trace's volume -->
    <polyline
            v-show="trace.metadata.displayed"
            :points="pointsShadow"
            :fill="traceShadowFill"
            :stroke="traceShadowStroke"
            v-if="traceShadowDisplayed"
            style="pointer-events: none;"
    ></polyline>
</g>
        `
    })
}
