<script>
    import { onMount } from 'svelte';
    import { replace } from 'svelte-spa-router';
    import { currentView, modelPath, modelTitle, modelPoster, modelDescription, navBarSize, savedControlSphereList, userBookmarks, modelType } from '../../stores.js';

    // -----------------STARTFIREBASE IMPORTS---------------
    import { app } from '../../firebase.js';
    import { getFirestore, getDocs, collection } from 'firebase/firestore/lite';
    // -----------------END FIREBASE IMPORTS---------------


    let db = getFirestore(app);
    let dbData = [];

    currentView.set('home');
    
    // get all models from the firestore directory and load the model select page with their name
    // reads the firestore db and populates the model select page with all the models
    // on page load, populates dbData;
    // PAGINATE ME!
    onMount(async function () {
        let docSnap = await getDocs(collection(db, 'modelDb'));

        try {
            docSnap.forEach(async doc => {
                // to be reactive, we can't just do array.push.
                // needs to be in this format
                dbData = [...dbData, doc.data()];
            })
        } catch (err) {
            console.log(`Something went wrong loadModelData: ${err}`)
        }
    })

    // 
    function loadModelInfo(selectedModelIndex) {
        let modelInfo = dbData[selectedModelIndex];
        
        modelTitle.set(modelInfo.modelTitle);
        modelPoster.set(modelInfo.poster)
        modelDescription.set(modelInfo.description);
        modelPath.set(modelInfo.fileName);
        modelType.set(modelInfo.modelType);
        userBookmarks.set(modelInfo.bookmarks);
        savedControlSphereList.set(modelInfo.controlSpheres);
        
        replace('/viewer');
        currentView.set('viewer');
        navBarSize.set('navbar-viewer');
    }
</script>

<div id="modelSelectBox">
    <div id="modelSelectBoxInner">
        <h1>Model Select</h1>
            Select Heart
        <!-- temp paths: this will be the model database entry in firestore -->
        {#each dbData as data, i}
            <button on:click={() => loadModelInfo(i)}>{data.modelTitle}</button>
        {:else}
            <h1>Loading Models!</h1>
        {/each}
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