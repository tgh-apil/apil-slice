<script>
    import { replace } from 'svelte-spa-router';
    import { currentView } from '../../stores.js';

    currentView.set('home');
    
    function loadModel() {
        replace('/viewer')
        currentView.set('viewer');
    }

</script>

<div id="modelSelectBox">
    <div id="modelSelectBoxInner">
        <h1>Model Select</h1>
        <p>
            MODEL SELECT GOES HERE
        </p>
        <button on:click={() => loadModel()}>LOAD NORMAL MODEL</button>
    </div>
</div>

<style>
    #modelSelectBox {
        position: absolute;
        top: 7%;
        width: 100%;
        height: 100%;
        text-align: left;
        z-index: 100;
    }

    #modelSelectBoxInner {
        height: auto;
        width: 90%;
        height: 100%;
        margin: 0 auto;
        text-align: center;
    }
</style>