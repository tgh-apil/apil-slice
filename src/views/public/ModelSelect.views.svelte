<script>
    import { onMount } from 'svelte';
    import { replace } from 'svelte-spa-router';
    import { currentView, modelPath, modelTitle, modelPoster, modelId, modelDescription, storeUrlList, 
            navBarSize, savedControlSphereList, userBookmarks, annotations, modelType, uploadPanelShow, editModelDataOn } from '../../stores.js';
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

        // not very useful -- disable for now
        // {
        //     label: 'Alphabetically',
        //     database_value: 'modelTitle',
        //     sort_direction: 'desc'
        // },
        // {
        //     label: 'Reverse Alphabetically',
        //     database_value: 'modelTitle',
        //     sort_direction: 'asc'
        // },
    ]

    let limitOptions = [4, 8, 12, 'all'];

    // for model upload/editing
    let uploadModelTitle = '';
    let uploadModelId = '';
    let uploadModelDescription = '';
    let uploadModelPinned = '';

    currentView.set('home');
    
    // get all models from the firestore directory and load the model select page with their name
    // reads the firestore db and populates the model select page with all the models
    // on page load, populates dbData;
    // PAGINATE ME!
    onMount(async function () {
        // reference for the firestore entry and filter by date created
        // newest models first

        // set the default number of search results returned on page load
        let limitSearchNum = limitOptions[3];
        let q;

        if (limitSearchNum == 'all') {
            q = query(docRef, orderBy('dateCreated', 'desc'));
        } else {
            // if the default number of serach results to load is not all, load the limit selected
            q = query(docRef, orderBy('dateCreated', 'desc'), limit(limitSearchNum));
        }

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
        
        // check if the model has been 'pinned' to always show at the top of the list
        preData.forEach((data, idx) => {
            if (data.pinned) {
                preData.splice(idx, 1);
                preData.unshift(data);
            }
        })

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

    function editModelInfo(selectedModelIndex) {
        let modelInfo = dbData[selectedModelIndex];
        
        uploadModelTitle = modelInfo.modelTitle;
        uploadModelId = modelInfo.modelId;
        uploadModelDescription = modelInfo.description;
        
        if (modelInfo.pinned == true) {
            uploadModelPinned = modelInfo.pinned;
        } else {
            uploadModelPinned = false;
        }

        uploadPanelShow.set(true);

        console.log(uploadModelPinned);

        modelPath.set(modelInfo.fileName);
    }

    async function queryBuilder() {
        let sortVal = document.getElementById('sort-by').value;
        let limitVal = document.getElementById('limit-sort').value;

        let databaseValue = sortOptions[sortVal].database_value;
        let sortDir = sortOptions[sortVal].sort_direction;

        let q; 

        if (limitVal == 'all') {
            q = query(docRef, orderBy(databaseValue, sortDir));
        } else {
            q = query(docRef, orderBy(databaseValue, sortDir), limit(limitVal));
        }

        dbData = [];
        preData = [];

        try {
            let queryResult = await getDocs(q);

            queryResult.forEach(doc => {
                preData = [...preData, doc.data()];
            })

            // check if the model has been 'pinned' to always show at the top of the list
            preData.forEach((data, idx) => {
                if (data.pinned) {
                    preData.splice(idx, 1);
                    preData.unshift(data);
                }
            })

        getThumbnails();

        } catch (err) {
            console.log(err);
        }
    }
</script>

{#if $uploadPanelShow}
    {#if $editModelDataOn}
        <div>
            <UploadModelData uploadModelId={uploadModelId} uploadModelTitle={uploadModelTitle} uploadModelDescription={uploadModelDescription} uploadModelPinned={uploadModelPinned} />
        </div>
    {:else}
        <div>
            <UploadModelData uploadModelId={''} uploadModelTitle={''} uploadModelDescription={''} />
        </div>
    {/if}
{:else}
    <SearchBar sortOptions={sortOptions} limitOptions={limitOptions} queryBuilder={queryBuilder} />
    <div id='container'>
        <div id="model-select-box">
            {#each dbData as modelData, i}
                {#if $editModelDataOn}
                    <ModelCard modelTitle={modelData.modelTitle} modelPoster={modelData.poster} modelId={modelData.modelId} modelDescription={modelData.description} modelThumbnailUrl={modelData.thumbnailUrl} modelPinned={modelData.pinned} buttonFunction={() => editModelInfo(i)} />
                {:else}
                    <ModelCard modelTitle={modelData.modelTitle} modelPoster={modelData.poster} modelId={modelData.modelId} modelDescription={modelData.description} modelThumbnailUrl={modelData.thumbnailUrl} modelPinned={modelData.pinned} buttonFunction={() => loadModelInfo(i)} />
                {/if}
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
        top: 17vh;
        width: 100vw;
        height: 80vh;
        overflow: auto;
    }

    #model-select-box {
        position: absolute;
        width: auto;
        height: auto;
        z-index: 101;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
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