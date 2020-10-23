namespace splitTime.editor.level {
    interface VueRenderedLayer {
        // props
        levelEditorShared: LevelEditorShared
        level: Level
        layer: Layer
        index: number
        width: number
        height: number
        isActive: boolean
        // computed
        containerWidth: number
        containerHeight: number
        viewBox: string
        layerAboveZ: number
        layerHeight: number
        styleObject: object
        thingsStyleObject: object
        traces: Trace[]
        props: Prop[]
        positions: Position[]
    }


    function containerWidth(this: VueRenderedLayer): number {
        return this.width + 2*EDITOR_PADDING
    }
    function containerHeight(this: VueRenderedLayer): number {
        var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].obj.z : 0
        return this.height + 2*EDITOR_PADDING + addedHeight
    }
    function viewBox(this: VueRenderedLayer): string {
        return "" + -EDITOR_PADDING + " " + -EDITOR_PADDING + " " + this.containerWidth + " " + this.containerHeight
    }
    function layerAboveZ(this: VueRenderedLayer): number {
        var layerAbove = this.level.layers[this.index + 1]
        return layerAbove ? layerAbove.obj.z : Number.MAX_VALUE
    }
    function layerHeight(this: VueRenderedLayer): number {
        return this.layerAboveZ - this.layer.obj.z
    }
    function styleObject(this: VueRenderedLayer): object {
        return {
            pointerEvents: this.isActive ? "initial" : "none"
        }
    }
    function thingsStyleObject(this: VueRenderedLayer): object {
        return {
            position: "absolute",
            left: EDITOR_PADDING + "px",
            top: EDITOR_PADDING + "px"
        }
    }
    function traces(this: VueRenderedLayer): Trace[] {
        var that = this
        return this.level.traces.filter(trace => {
            return trace.obj.z >= that.layer.obj.z && trace.obj.z < that.layerAboveZ
        })
    }
    function props(this: VueRenderedLayer): Prop[] {
        var that = this
        return this.level.props.filter(prop => {
            return prop.obj.z >= that.layer.obj.z && prop.obj.z < that.layerAboveZ
        })
    }
    function positions(this: VueRenderedLayer): Position[] {
        var that = this
        return this.level.positions.filter(pos => {
            return pos.obj.z >= that.layer.obj.z && pos.obj.z < that.layerAboveZ
        })
    }


    Vue.component("rendered-layer", {
        props: {
            levelEditorShared: Object,
            level: Object,
            layer: Object,
            index: Number,
            width: Number,
            height: Number,
            isActive: Boolean
        },
        computed: {
            containerWidth,
            containerHeight,
            viewBox,
            layerAboveZ,
            layerHeight,
            styleObject,
            thingsStyleObject,
            traces,
            props,
            positions
        },
        template: `
<div
    v-show="layer.metadata.displayed"
    :style="styleObject"
    class="rendered-layer"
>
    <svg
            style="position:absolute; left: 0; top: 0;"
            :width="containerWidth"
            :height="containerHeight"
            :viewBox="viewBox"
            class="trace-svg"
    >
        <rendered-trace v-for="trace in traces"
            :key="trace.metadata.editorId"
            :level-editor-shared="levelEditorShared"
            :metadata="trace.metadata"
            :trace="trace.obj"
        ></rendered-trace>
    </svg>
    <div :style="thingsStyleObject" class="things-container">
        <rendered-proposition v-for="prop in props"
            :key="prop.metadata.editorId"
            class="prop"
            :level-editor-shared="levelEditorShared"
            :p="prop"
        ></rendered-proposition>
        <rendered-proposition v-for="position in positions"
            :key="position.metadata.editorId"
            class="position"
            :level-editor-shared="levelEditorShared"
            :p="position"
        ></rendered-proposition>
    </div>
</div>
        `
    })
}