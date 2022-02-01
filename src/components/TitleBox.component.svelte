<script>
    import { titleBox, titleBoxPosition, modelTitle, modelPoster } from '../stores.js';
</script>

<div id="{$titleBoxPosition}">
    <div id="titleBoxInner" hidden={!$titleBox}>
        <h2>
            {$modelTitle}
        </h2>
        <p>
            Posted by: <b>{$modelPoster}</b>
        </p>
    </div>
</div>

<style>
    #titleBox-show-description {
        position: absolute;
        bottom: 35%;
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

    #titleBoxInner h2 {
        color: #00acac;
    }
</style>