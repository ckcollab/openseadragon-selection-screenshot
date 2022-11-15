(function($) {

    if (!$.version || $.version.major < 3) {
        throw new Error('This version of OpenSeadragonScalebar requires ' +
                'OpenSeadragon version 3.0.0+');
    }

    $.Viewer.prototype.screenshotter = function(options) {
        if (!this.screenshotterInstance) {
            options = options || {};
            options.viewer = this;
            this.screenshotterInstance = new $.Screenshotter(options);
        } else {
            // this.screenshotterInstance.refresh(options);
            console.error("Trying to initialize screenshotter again, already initialized!?")
        }
    };

    /**
     * Initializer..
     *
     * @param options
     * @constructor
     */
    $.Screenshotter = function(options) {
        options = options || {};
        if (!options.viewer) {
            throw new Error("A viewer must be specified.");
        }
        this.viewer = options.viewer;

        // This is our overlay canvas, grayed out with a selector box on mouse
        // down, move, and then up -- kind of like StarCraft unit selection
        this.screenshot_overlay = document.createElement('canvas')
        this.screenshot_overlay.style.position = 'absolute'
        this.screenshot_overlay.style.top = '0'
        this.screenshot_overlay.style.left = '0'
        this.screenshot_overlay.style.bottom = '0'
        this.screenshot_overlay.style.right = '0'
        this.screenshot_overlay.style.zIndex = '100'
        this.screenshot_overlay.style.width = '100vw'
        this.screenshot_overlay.style.height = '100vh'
        this.screenshot_overlay.style.display = 'none'
        document.body.appendChild(this.screenshot_overlay);

        this.screenshot_overlay_context = this.screenshot_overlay.getContext('2d')

        // Actual canvas with the OpenSeaDragon stuff on it
        this.canvas = document.querySelector("#view canvas")
        this.canvas_context = this.canvas.getContext('2d')

        this.in_screenshot_mode = false
        this.origin = null  // first position we click when we start to click and drag

        // -------------------------------------------------------------------
        // Window events - Make sure canvas always fullscreen
        const resizeOverlay = () => {
            this.screenshot_overlay.width = window.innerWidth
            this.screenshot_overlay.height = window.innerHeight
        }
        window.addEventListener('resize', resizeOverlay, false)
        resizeOverlay()  // start out with nice resize

        // -------------------------------------------------------------------
        // Keyboard hotkeys
        document.addEventListener('keyup', (event) => {
            if (event.key === 'p') {
                // Screenshot time!
                console.log("Screenshot time! Showing overlay..")

                // Make the cursor different so it's more apparent we're in screenshot mode
                document.body.style.cursor = 'pointer'

                // Show overlay...
                this.screenshot_overlay.style.display = 'block'

                // Track our state
                this.in_screenshot_mode = true
            }
        })

        // -------------------------------------------------------------------
        // Mouse hotkeys
        this.screenshot_overlay.addEventListener('mousedown', (e) => {
            // The mouse down click sets where our selection origin is
            this.origin = {x: e.offsetX, y: e.offsetY}
        })
        this.screenshot_overlay.addEventListener('mouseup', (e) => {
            // Now capture the image data within this square
            this.make_selection(e)

            this.origin = null
            //render(e)

            // Hide overlay now, we're done with it
            //this.screenshot_overlay.style.display = 'none'
            this.in_screenshot_mode = false
        })
        this.screenshot_overlay.addEventListener('mousemove', (e) => {
            if(!this.in_screenshot_mode) return

            // The mouse moves, which adjusts the selection box
            this.clear()

            // Re-render our screenshot canvas whenever we're moving the mouse
            if (this.origin) this.render(e)
        })
    };

    $.Screenshotter.prototype = {
        render: function(e) {
            if(!origin) return

            // Get bounds
            const bounds = this.get_snapped_bounds(e)

            // Draw outline box
            this.screenshot_overlay_context.strokeStyle = "#42ff00"
            this.screenshot_overlay_context.beginPath()
            this.screenshot_overlay_context.rect(this.origin.x, this.origin.y, bounds.width, bounds.height)
            this.screenshot_overlay_context.stroke()

            // Make a transparent window where our selection currently is
            this.screenshot_overlay_context.clearRect(this.origin.x, this.origin.y, bounds.width, bounds.height)
        },
        clear: function() {
            // Remove all previously drawn stuff
            this.screenshot_overlay_context.strokeStyle = "#fff"
            this.screenshot_overlay_context.clearRect(0, 0, this.screenshot_overlay.width, this.screenshot_overlay.height)

            // Fill in our background with a slight gray transparent color
            this.screenshot_overlay_context.fillStyle = "rgba(0, 0, 0, 0.2)"
            this.screenshot_overlay_context.fillRect(0, 0, this.canvas.width, this.canvas.height)
        },
        make_selection: function(e) {
            // OK we lifted the mouse up, let's get our top left and bottom right coordinates
            // TODO: get top left/right properly

            // Get offset relative to canvas, not overlay
            const canvas_offset = this.canvas.getBoundingClientRect()

            // Get bounds (snapped to 1:1 ratio)
            const bounds = this.get_snapped_bounds(e)

            console.log("this.canvas_context", this.canvas_context)

            console.log(
                // Adjust to top left of canvas, then take into account pixel device ratio
                // to put our x/y in the exact right spot
                (this.origin.x - canvas_offset.x) * window.devicePixelRatio,
                (this.origin.y - canvas_offset.y) * window.devicePixelRatio,

                // Width and Height * window.devicePixelRatio because of pixel density -- 2 on retina
                bounds.width * window.devicePixelRatio,
                bounds.height * window.devicePixelRatio,
            )

            // Get image data from ORIGINAL canvas, with the cell image stuff, not our overlay canvas!
            const image_data = this.canvas_context.getImageData(
                // Adjust to top left of canvas, then take into account pixel device ratio
                // to put our x/y in the exact right spot
                (this.origin.x - canvas_offset.x) * window.devicePixelRatio,
                (this.origin.y - canvas_offset.y) * window.devicePixelRatio,

                // Width and Height * window.devicePixelRatio because of pixel density -- 2 on retina
                bounds.width * window.devicePixelRatio,
                bounds.height * window.devicePixelRatio,
            )


            this.screenshot_overlay_context.putImageData(image_data, 0, 0)

            //
            // Get scale numbers and stuff
            //
            // Draw scalebar
            const scalebarCanvas = this.viewer.scalebarInstance.getAsCanvas();
            const bottom_y_value = bounds.height - scalebarCanvas.height - 5  // 5 pixels padding from the bottom
            this.screenshot_overlay_context.drawImage(
                scalebarCanvas,
                5,
                bottom_y_value * window.devicePixelRatio
            )


            // Get text of scale
            /*
            var viewport = viewer.viewport
            var tiledImage = viewer.world.getItemAt(0)
            function tiledImageViewportToImageZoom(tiledImage, viewportZoom) {
                var ratio = tiledImage._scaleSpring.current.value * tiledImage.viewport._containerInnerSize.x / tiledImage.source.dimensions.x
                return ratio * viewportZoom
            }
            var zoom = tiledImageViewportToImageZoom(tiledImage, viewport.getZoom(true))
            var currentPPM = zoom * viewer.scalebarInstance.pixelsPerMeter

            var props = viewer.scalebarInstance.sizeAndTextRenderer(currentPPM, viewer.scalebarInstance.minWidth)

            console.log(viewer.scalebarInstance)
            console.log("currentPPM", currentPPM)
            console.log("props", props)

            // Draw text
            var bottom_y_value = (bounds.height - 2.5) * window.devicePixelRatio  // 2.5 pixels padding from the bottom
            this.screenshot_overlay_context.font = '18px monospaced'

            this.screenshot_overlay_context.strokeStyle = 'rgba(0, 0, 0, 1)'  // outline color
            this.screenshot_overlay_context.lineWidth = 4
            this.screenshot_overlay_context.strokeText(props.text, 5, bottom_y_value)

            this.screenshot_overlay_context.fillStyle = '#fff'  // text color
            this.screenshot_overlay_context.fillText(props.text, 5, bottom_y_value)
            */





            // Save screenshot to desktop..
            const screenshot_data = this.screenshot_overlay_context.getImageData(
                0,
                0,

                // Width and Height * window.devicePixelRatio because of pixel density -- 2 on retina
                bounds.width * window.devicePixelRatio,
                bounds.height * window.devicePixelRatio,
            )
            const screenshot_canvas = document.createElement("canvas")
            screenshot_canvas.width = bounds.width * window.devicePixelRatio
            screenshot_canvas.height = bounds.height * window.devicePixelRatio
            const screenshot_canvas_context = screenshot_canvas.getContext('2d')
            screenshot_canvas_context.putImageData(screenshot_data, 0, 0)

            var link = document.createElement('a')
            link.download = 'filename.jpg';
            link.href = screenshot_canvas.toDataURL('image/jpeg')
            link.click();

            // reset things
            this.clear()
            this.origin = null
            this.in_screenshot_mode = false

            // Hide overlay...
            this.screenshot_overlay.style.display = 'none'
        },
        get_snapped_bounds: function(e) {
            // Draw our selection box thing
            let width = e.offsetX - this.origin.x
            let height = e.offsetY - this.origin.y

            // Snap dimensions to 1:1 ratio
            if(width > height) width = height
            if(height > width) height = width

            return {width, height}
        }
    };
}(OpenSeadragon));
