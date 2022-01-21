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
    #titleBox-max-description {
        position: absolute;
        bottom: 40%;
        height: 20%;
        text-align: left;
        z-index: 100;
        overflow: auto;
    }

    #titleBox-min-description {
        position: absolute;
        bottom: 20%;
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