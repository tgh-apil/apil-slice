<script>
    import { titleBox, titleBoxPosition, modelTitle, modelPoster } from '../stores.js';
</script>

<div id="{$titleBoxPosition}">
    <div id="titleBoxInner" hidden={!$titleBox}>
        <h1>
            {$modelTitle}
        </h1>
        <h3>
            Posted by: {$modelPoster}
        </h3>
    </div>
</div>

<style>
    #titleBox-show-description {
        position: absolute;
        bottom: 38%;
        height: 20%;
        text-align: left;
        z-index: 100;
        overflow: auto;
    }

    #titleBox-hidden-description {
        position: absolute;
        bottom: 5%;
        height: 20%;
        text-align: left;
        z-index: 100;
        overflow: auto;
    }

    #titleBoxInner {
        width: 100%;
        margin: 0 auto;
    }
</style>