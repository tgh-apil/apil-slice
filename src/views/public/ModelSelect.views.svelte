<script>
    import { replace } from 'svelte-spa-router';
    import { currentView, modelPath } from '../../stores.js';

    currentView.set('home');
    
    // firebase me
    function loadModel(path) {
        replace('/viewer')
        currentView.set('viewer');
        modelPath.set(path)
    }

</script>

<div id="modelSelectBox">
    <div id="modelSelectBoxInner">
        <h1>Model Select</h1>
        <p>
            Select Heart
        </p>
        <!-- temp paths -->
        <button on:click={() => loadModel('/gltf/normal.glb')}>Normal Heart</button>
        <button on:click={() => loadModel('/gltf/fontan.glb')}>Fontan Heart</button>
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

    button {
        height: 5%;
        width: 20%;
    }
</style>