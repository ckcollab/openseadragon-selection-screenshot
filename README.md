# openseadragon-selection-screenshot
Take a screenshot of a chunk of an openseadragon view

```html
<div id="view"></div>


<script type="text/javascript" src="static/jquery.js"></script>
<script type="text/javascript" src="static/openseadragon-3.1.0.js"></script>
<script type="text/javascript" src="static/openseadragon.scalebar.js"></script>
<script type="text/javascript" src="static/openseadragon.selector-screenshot.js"></script>

<script type="text/javascript">
    $(function () {
        var dzi_data = {{ dzi_data|default('{}')|safe }}
        var viewer = new OpenSeadragon({
            id: "view",
        })

        // Scalebar is required for this plugin!
        viewer.scalebar({
            xOffset: 10,
            yOffset: 10,
            barThickness: 3,
            color: '#555555',
            fontColor: '#333333',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
        })

        // Screenshotter..
        viewer.screenshotter()

    })
</script>
```
