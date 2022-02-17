<script>
    import { onMount } from 'svelte';
    import { replace } from 'svelte-spa-router';
    import { currentView, modelPath, modelTitle, modelPoster, modelId, modelDescription, storeUrlList, 
            navBarSize, savedControlSphereList, userBookmarks, annotations, modelType, uploadPanelShow } from '../../stores.js';
    import ModelCard from '../../components/ModelCard.component.svelte';
    import UploadModelData from '../../components/UploadModelData.component.svelte';
    import SearchBar from '../../components/SearchBar.component.svelte';

    // -----------------STARTFIREBASE IMPORTS---------------
    import { app } from '../../firebase.js';
    import { getFirestore, getDocs, collection, query, orderBy, limit } from 'firebase/firestore/lite';
    import { getStorage, ref, getDownloadURL } from 'firebase/storage';
    // -----------------END FIREBASE IMPORTS---------------

    let db = getFirestore(app);
    let storageRef = getStorage(app);
    let docRef = collection(db, 'modelDb');
    let preData = [];
    let dbData = [];

    let sortOptions = [
        {
            label: 'Newest Model First',
            database_value: 'dateCreated',
            sort_direction: 'desc'
        },
        {
            label: 'Oldest Model First',
            database_value: 'dateCreated',
            sort_direction: 'asc'
        },
        {
            label: 'Alphabetically',
            database_value: 'modelTitle',
            sort_direction: 'desc'
        },
        {
            label: 'Reverse Alphabetically',
            database_value: 'modelTitle',
            sort_direction: 'asc'
        },
    ]

    let limitOptions = [3, 6, 9, 'all'];

    currentView.set('home');
    
    // get all models from the firestore directory and load the model select page with their name
    // reads the firestore db and populates the model select page with all the models
    // on page load, populates dbData;
    // PAGINATE ME!
    onMount(async function () {
        // reference for the firestore entry and filter by date created
        // newest models first
        let q = query(docRef, orderBy('dateCreated', 'desc'), limit(limitOptions[2]));
        let queryResult = await getDocs(q);

        try {
            queryResult.forEach(doc => {
                // data comes in order based on the query
                // so we store those in an array in their requested order before we fetch the thumbnails
                preData = [...preData, doc.data()];
            })
        } catch (err) {
            console.log(`error loading model data: ${err}`);

            return
        }

        getThumbnails();
    })

    // we assemble the final list by getting the pre-sorted data in the local array
    // then requesting their image URL one by one
    // otherwise as the data comes in, the order gets totally randomized
    async function getThumbnails() {        
        for (let i = 0; i < preData.length; i++) {
            let fileName = preData[i].fileName.slice(0, -4);
            let storageThumbnailRef = ref(storageRef, `models/${fileName}/${fileName}_thumbnail.png`);
            
            await getDownloadURL(storageThumbnailRef)
            .then(url => {
                preData[i]['thumbnailUrl'] = url;
                dbData = [...dbData, preData[i]];
            })
            .catch((err) => {
                // if no thumbnail set, we use a stand-in image instead
                preData[i]['thumbnailUrl'] = 'no_thumbnail.png';
                console.log(`Error downloading thumbnail: ${err}`)
                dbData = [...dbData, preData[i]];  
            })
        }
    }

    function loadModelInfo(selectedModelIndex) {
        let modelInfo = dbData[selectedModelIndex];
        
        modelTitle.set(modelInfo.modelTitle);
        modelPoster.set(modelInfo.poster);
        modelId.set(modelInfo.modelId);
        modelDescription.set(modelInfo.description);
        modelPath.set(modelInfo.fileName);
        modelType.set(modelInfo.modelType);
        userBookmarks.set(modelInfo.bookmarks);
        savedControlSphereList.set(modelInfo.controlSpheres);

        if (modelInfo.annotations) {
            annotations.set(modelInfo.annotations);
        } 

        if (modelInfo.storeUrlList) {
            storeUrlList.set(modelInfo.storeUrlList)
        }
        
        replace('/viewer');
        currentView.set('viewer');
        navBarSize.set('navbar-viewer');
    }

    async function queryBuilder() {
        let sortVal = document.getElementById('sort-by').value;
        let limitVal = document.getElementById('limit-sort').value;

        let databaseValue = sortOptions[sortVal].database_value;
        let sortDir = sortOptions[sortVal].sort_direction;

        let q; 

        if (limitVal != 'all') {
            q = query(docRef, orderBy(databaseValue, sortDir), limit(limitVal));
        } else {
            q = query(docRef, orderBy(databaseValue, sortDir));
        }

        dbData = [];
        preData = [];

        try {
            let queryResult = await getDocs(q);

            queryResult.forEach(doc => {
                preData = [...preData, doc.data()];
            })

        getThumbnails();

        } catch (err) {
            console.log(err);
        }
    }
</script>

{#if $uploadPanelShow}
    <div>
        <UploadModelData />
    </div>
{:else}
    <SearchBar sortOptions={sortOptions} limitOptions={limitOptions} queryBuilder={queryBuilder} />
    <div id='container'>
        <div id="model-select-box">
            {#each dbData as modelData, i}
                <ModelCard modelTitle={modelData.modelTitle} modelPoster={modelData.poster} modelId={modelData.modelId} modelDescription={modelData.description} modelThumbnailUrl={modelData.thumbnailUrl} buttonFunction={() => loadModelInfo(i)} />
            {:else}
                <div id='model-loading-box'>
                    <div>
                        <h1>Loading Models</h1>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    #container {
        position: absolute;
        z-index: 101;
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    #model-select-box {
        position: absolute;
        width: auto;
        height: auto;
        z-index: 101;
        display: grid;
        top: 14%;
        grid-template-columns: 1fr 1fr 1fr;
        column-gap: 1%;
        row-gap: 1%;
        margin-bottom: 5%;
    }

    #model-loading-box {
        position: absolute;
        z-index: 101;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>