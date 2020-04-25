namespace splitTime {
    export class Canvas {
        public readonly element: HTMLCanvasElement
        public readonly context: CanvasRenderingContext2D

        public constructor(
            public readonly width: int,
            public readonly height: int
        ) {
            this.element = document.createElement("canvas")
            this.element.setAttribute("width", "" + width)
            this.element.setAttribute("height", "" + height)
            const ctx = this.element.getContext("2d")
            if (!ctx) {
                throw new Error("Failed to allocate new canvas context")
            }
            this.context = ctx
        }
    }
}
