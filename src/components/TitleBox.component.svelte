<script>
    import { titleBox, titleBoxPosition } from '../stores.js';
</script>

<div id="{$titleBoxPosition}">
    <div id="titleBoxInner" hidden={!$titleBox}>
        <h1>
            Normal Heart
        </h1>
        <h3>
            Posted by: APIL
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
        width: 100%;
    }

    #titleBox-min-description {
        position: absolute;
        bottom: 20%;
        height: 20%;
        text-align: left;
        z-index: 100;
        overflow: auto;
        width: 100%;
    }

    #titleBox-hidden-description {
        position: absolute;
        bottom: 5%;
        height: 20%;
        text-align: left;
        z-index: 100;
        overflow: auto;
        width: 100%;
    }

    #titleBoxInner {
        width: 100%;
        margin: 0 auto;
    }
</style>