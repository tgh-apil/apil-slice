<script>
    import { currentView } from '../../stores.js';

    currentView.set('error page');
</script>

<div id="errorPageBox">
    <div id="errorPageBoxInner">
        <h1>Oops!</h1>
        <p>
            That page doesn't exist!
        </p>
    </div>
</div>

<style>
    #errorPageBox {
        position: absolute;
        top: 7%;
        width: 100%;
        height: 100%;
        text-align: left;
        z-index: 100;
    }

    #errorPageBoxInner {
        height: auto;
        width: 90%;
        height: 100%;
        margin: 0 auto;
        text-align: center;
    }
</style>