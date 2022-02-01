<script>
    import { onMount } from 'svelte';
    import { replace } from 'svelte-spa-router';
    import { currentView, modelPath, modelTitle, modelPoster, modelDescription, navBarSize, savedControlSphereList, userBookmarks, modelType, uploadPanelShow } from '../../stores.js';
    import ModelCard from '../../components/ModelCard.component.svelte';
    import UploadModelData from '../../components/UploadModelData.component.svelte';

    // -----------------STARTFIREBASE IMPORTS---------------
    import { app } from '../../firebase.js';
    import { getFirestore, getDocs, collection, query, orderBy, limit } from 'firebase/firestore/lite';
    import { getStorage, ref, getDownloadURL } from 'firebase/storage';
    // -----------------END FIREBASE IMPORTS---------------

    let db = getFirestore(app);
    let storageRef = getStorage(app);
    let dbData = [];

    currentView.set('home');
    
    // get all models from the firestore directory and load the model select page with their name
    // reads the firestore db and populates the model select page with all the models
    // on page load, populates dbData;
    // PAGINATE ME!
    onMount(async function () {
        
        // reference for the firestore entry and filter by date created;
        let docRef = collection(db, 'modelDb');
        let q = query(docRef, orderBy('dateCreated'), limit(10));
        let queryResult = await getDocs(q);

        try {
            queryResult.forEach(async doc => {
                // data is coming in sorted by date or whatever
                // but loading in the html is not?
                let obj = doc.data();
                
                let fileName = obj.fileName.slice(0, -4);

                let storageThumbnailRef = ref(storageRef, `models/${fileName}/${fileName}_thumbnail.png`);

                // it's because we're waiting for this download...
                await getDownloadURL(storageThumbnailRef)
                .then(url => {
                    obj['thumbnailUrl'] = url;

                }).catch((err) => {
                    // if no thumbnail set, we use a stand-in image instead
                    obj['thumbnailUrl'] = 'no_thumbnail.png';
                    console.log(`Error downloading thumbnail: ${err}`)

                })

                dbData = [...dbData, obj];
            })
        } catch (err) {
            console.log(`error loading model data!`);
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


{#if $uploadPanelShow}
    <div>
        <UploadModelData />
    </div>
{:else}
    <div id="modelSelectBox">
        {#each dbData as modelData, i}
            <ModelCard modelTitle={modelData.modelTitle} modelPoster={modelData.poster}  modelDescription={modelData.description} modelThumbnailUrl={modelData.thumbnailUrl} 
            buttonFunction={() => loadModelInfo(i)} />
        {/each}
    </div>
{/if}

<style>
    #modelSelectBox {
        position: absolute;
        top: 7%;
        width: 100%;
        height: 90%;
        z-index: 101;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 48%;
        column-gap: 1%;
        row-gap: 2%;
        overflow: auto;
    }
</style>