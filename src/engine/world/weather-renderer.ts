namespace splitTime {
    // TODO: Try not to let these be global state like this.
    export let RAIN_IMAGE: string = "rain.png"
    export let CLOUDS_IMAGE: string = "stormClouds.png"

    const COUNTER_BASE = 25600

    export class WeatherRenderer {
        private readonly VIEW_WIDTH: int
        private readonly VIEW_HEIGHT: int

        private readonly buffer: splitTime.Canvas

        constructor(
            private readonly camera: Camera,
            private readonly view: splitTime.ui.View
        ) {
            // These are the dimensions of the entire window, not the dimensions of a particular level.
            this.VIEW_WIDTH = view.width
            this.VIEW_HEIGHT = view.height
            
            this.buffer = new splitTime.Canvas(this.VIEW_WIDTH, this.VIEW_HEIGHT)
        }

        render(level: Level, ctx: GenericCanvasRenderingContext2D) {
            const screen = this.camera.getScreenCoordinates()

            this.applyLighting(level, screen, ctx)

            const counter = Math.round(level.getRegion().getTimeMs()) % COUNTER_BASE

            //Weather
            if (level.weather.isRaining) {
                ctx.drawImage(
                    G.ASSETS.images.get(RAIN_IMAGE),
                    -((counter % 100) / 100) * this.VIEW_WIDTH,
                    ((counter % 25) / 25) * this.VIEW_HEIGHT -
                        this.VIEW_HEIGHT
                )
            }
            if (level.weather.isCloudy) {
                var CLOUDS_WIDTH = 2560
                var CLOUDS_HEIGHT = 480
                var xPixelsShift = -splitTime.mod(counter - screen.x, CLOUDS_WIDTH)
                var yPixelsShift = splitTime.mod(screen.y, CLOUDS_HEIGHT)
                ctx.globalAlpha = level.weather.cloudAlpha
                this.drawTiled(
                    G.ASSETS.images.get(CLOUDS_IMAGE),
                    ctx,
                    xPixelsShift,
                    yPixelsShift
                )
                ctx.globalAlpha = 1
            }
            if (level.weather.lightningFrequency > 0) {
                // TODO: tie to time rather than frames
                if (
                    splitTime.randomInt(splitTime.FPS * 60) <=
                    level.weather.lightningFrequency
                ) {
                    ctx.fillStyle = "rgba(255, 255, 255, .75)"
                    ctx.fillRect(
                        0,
                        0,
                        this.VIEW_WIDTH,
                        this.VIEW_HEIGHT
                    )
                }
            }
        }

        /**
         * @param {number} left x in image to start tiling at
         * @param {number} top y in image to start tiling at
         */
        private drawTiled(image: HTMLImageElement, ctx: GenericCanvasRenderingContext2D, left: number, top: number) {
            left = splitTime.mod(left, image.naturalWidth)
            top = splitTime.mod(top, image.naturalHeight)
            // Draw upper left tile
            ctx.drawImage(
                image,
                left,
                top,
                this.VIEW_WIDTH,
                this.VIEW_HEIGHT,
                0,
                0,
                this.VIEW_WIDTH,
                this.VIEW_HEIGHT
            )

            var xEnd = image.naturalWidth - left
            if (xEnd < this.VIEW_WIDTH) {
                // Draw upper right tile if needed
                ctx.drawImage(
                    image,
                    0,
                    top,
                    this.VIEW_WIDTH,
                    this.VIEW_HEIGHT,
                    xEnd,
                    0,
                    this.VIEW_WIDTH,
                    this.VIEW_HEIGHT
                )
            }

            var yEnd = image.naturalHeight - top
            if (yEnd < this.VIEW_HEIGHT) {
                // Draw lower left tile if needed
                ctx.drawImage(
                    image,
                    left,
                    0,
                    this.VIEW_WIDTH,
                    this.VIEW_HEIGHT,
                    0,
                    yEnd,
                    this.VIEW_WIDTH,
                    this.VIEW_HEIGHT
                )
            }

            if (xEnd < this.VIEW_WIDTH && yEnd < this.VIEW_HEIGHT) {
                // Draw lower right tile if needed
                ctx.drawImage(
                    image,
                    0,
                    0,
                    this.VIEW_WIDTH,
                    this.VIEW_HEIGHT,
                    xEnd,
                    yEnd,
                    this.VIEW_WIDTH,
                    this.VIEW_HEIGHT
                )
            }
        }

        private applyLighting(level: Level, screen: { x: number; y: number }, ctx: GenericCanvasRenderingContext2D) {
            //Transparentize buffer
            this.buffer.context.clearRect(
                0,
                0,
                this.VIEW_WIDTH,
                this.VIEW_HEIGHT
            )
            //Fill with light
            this.buffer.context.fillStyle = level.weather.getAmbientLight()
            this.buffer.context.fillRect(
                0,
                0,
                this.VIEW_WIDTH,
                this.VIEW_HEIGHT
            )

            this.buffer.context.globalCompositeOperation = "lighter"

            const bodies = level.getBodies()
            for (const body of bodies) {
                const drawable = body.drawable
                const light = drawable?.getLight()
                if (!drawable || !light) {
                    continue
                }
                const xCoord = body.x - screen.x
                const yCoord = body.y - body.z - screen.y
                this.buffer.withCleanTransform(() => {
                    this.buffer.context.translate(
                        Math.round(xCoord),
                        Math.round(yCoord)
                    )
                    light.applyLighting(this.buffer.context, drawable.opacityModifier)
                })
            }

            // Return to default
            this.buffer.context.globalCompositeOperation = "source-over"

            ctx.globalCompositeOperation = "multiply"
            //Render buffer
            ctx.drawImage(
                this.buffer.element,
                0,
                0,
                this.VIEW_WIDTH,
                this.VIEW_HEIGHT
            )

            //Return to default splitTime.image layering
            ctx.globalCompositeOperation = "source-over"
        }
    }
}