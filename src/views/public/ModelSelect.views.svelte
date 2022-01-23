<script>
    import { replace } from 'svelte-spa-router';
    import { currentView, modelPath, modelTitle, modelPoster, modelDescription, navBarSize } from '../../stores.js';

    currentView.set('home');

    let testText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec venenatis molestie eleifend. Aliquam facilisis et odio in efficitur. Praesent tortor dolor, tristique egestas efficitur a, condimentum ac ante. Maecenas congue justo quam, non pharetra nisl tincidunt viverra. Nullam quis vehicula erat. Integer maximus risus at pellentesque sodales. Mauris consequat, augue sit amet malesuada sollicitudin, ligula est euismod orci, ac maximus libero elit id neque. Ut vehicula malesuada ex, et semper quam. Nam aliquam vestibulum tortor, vel pharetra mauris. 
    
    Cras lobortis in libero vitae condimentum. In a dolor sem. Etiam aliquam consequat mi sit amet sollicitudin. Nunc feugiat lobortis diam nec pretium. Quisque eget lectus eget ligula vestibulum ornare. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Phasellus ullamcorper eget ante id ornare. Nulla ut nisl et ante suscipit porttitor. 
    
    Nunc eu cursus odio, ut vehicula leo. Ut dolor ex, volutpat eget est ut, pellentesque semper lorem. Nulla facilisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    
    Cras placerat convallis dolor quis lobortis. Praesent vel eros consectetur, mattis arcu quis, suscipit elit. Pellentesque rutrum lorem eros, at pulvinar velit congue sit amet. Mauris dapibus est ex, in consectetur lorem vehicula lobortis. Ut pellentesque tortor eget mattis eleifend. Praesent porta purus sed libero pharetra, vel porta augue finibus.`;
    
    // firebase me
    function loadModel(path) {
        replace('/viewer')
        currentView.set('viewer');
        navBarSize.set('navbar-viewer');
        modelPath.set(path)

        // temp FOR EXAMPLE ONLY -- to be read off of firestore
        if (path.includes('normal')) {
            setModelInfo('Normal Heart', 'APIL', testText)
        } else if (path.includes('fontan')) {
            setModelInfo('Fontan Heart', 'Josh', 'This is a fontan heart!')    
        } else {
            console.log('unknown file path')
        }
    }

    function setModelInfo(title, poster, description) {
        modelTitle.set(title);
        modelPoster.set(poster)
        modelDescription.set(description);  
    }

</script>

<div id="modelSelectBox">
    <div id="modelSelectBoxInner">
        <h1>Model Select</h1>
        <p>
            Select Heart
        </p>
        <!-- temp paths: this will be the model database entry in firestore -->
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