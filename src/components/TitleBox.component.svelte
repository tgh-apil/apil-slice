<script>
    import { titleBox } from '../stores.js';
</script>

<div id="titleBox">
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
    #titleBox {
        position: absolute;
        bottom: 15%;
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