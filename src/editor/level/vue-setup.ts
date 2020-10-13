namespace splitTime.editor.level {
    export interface VueApp {
        info: {
            x: number | undefined,
            y: number | undefined,
            z: number | undefined
        }
        level: any
        activeLayer: any
        traceOptions: any[]
        backgroundSrc: any
        containerWidth: any
        containerHeight: any
        leftPadding: any
        topPadding: any
        selectModeOption(mode: string): any
        selectTraceOption(type: string): any
        createLayer(): any
}

    function backgroundSrc(this: VueApp) {
        return imgSrc(this.level.background);
    }
    function containerWidth(this: VueApp) {
        return this.level.width + 2*EDITOR_PADDING;
    }
    function containerHeight(this: VueApp) {
        var addedHeight = this.level.layers.length > 0 ? this.level.layers[this.level.layers.length - 1].z : 0;
        return this.level.height + 2*EDITOR_PADDING + addedHeight;
    }
    function leftPadding(this: VueApp) {
        return EDITOR_PADDING + this.level.backgroundOffsetX;
    }
    function topPadding(this: VueApp) {
        return EDITOR_PADDING + this.level.backgroundOffsetY;
    }

    function selectModeOption(this: VueApp, mode: string) {
        setMode(mode);
    }
    function selectTraceOption(this: VueApp, type: string) {
        typeSelected = type;
        setMode("trace");
    }
    function createLayer(this: VueApp) {
        addNewLayer();
    }

    export const vueApp = new Vue({
        el: '#app',
        data: {
            info: {
                x: undefined,
                y: undefined,
                z: undefined
            },
            level: levelObject,
            activeLayer: 0,
            traceOptions: [
                {
                    type: splitTime.trace.Type.SOLID,
                    color: "rgba(0, 0, 255, .7)",
                    help: "Completely impenetrable areas bodies may not pass through (but may sit on top)"
                },
                {
                    type: splitTime.trace.Type.STAIRS,
                    color: "rgba(0, 200, 0, .7)",
                    help: "Solid trace slope up to the next layer"
                },
                {
                    type: splitTime.trace.Type.GROUND,
                    color: TRACE_GROUND_COLOR,
                    help: "Zero-height solid trace, perfect for bridges"
                },
                {
                    type: splitTime.trace.Type.EVENT,
                    color: "rgba(255, 0, 0, .7)",
                    help: "Indicates area of the level which will trigger a function call when a body moves into the area"
                },
                {
                    type: splitTime.trace.Type.PATH,
                    color: "rgba(0, 0, 0, 1)",
                    help: "Link positions together for walking purposes"
                },
                {
                    type: splitTime.trace.Type.POINTER,
                    color: "rgba(100, 50, 100, .8)",
                    help: "Link to another level. Traces from that level will affect this area, and a body fully moved into the pointer trace will be transported to that level."
                },
                {
                    type: splitTime.trace.Type.TRANSPORT,
                    color: "rgba(200, 100, 10, .8)",
                    help: "Link to another level regardless of what's on the other side. Note: You'll want to use opposite values for pairs of these traces, but be careful not to overlap the traces and leave enough room for the maximum expected base between."
                }
            ]
        },
        computed: {
            backgroundSrc,
            containerWidth,
            containerHeight,
            leftPadding,
            topPadding
        },
        methods: {
            selectModeOption,
            selectTraceOption,
            createLayer,
            createLevel: () => createLevel(""),
            clickFileChooser: clickFileChooser,
            downloadFile: downloadFile,
            showEditorLevel: showEditorLevel
        }
    }) as VueApp;
}