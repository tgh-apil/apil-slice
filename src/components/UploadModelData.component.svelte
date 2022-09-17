<script>
    import { uploadPanelShow, editModelDataOn, modelPath } from '../stores.js';
    import PopupBox from './PopupBox.component.svelte';

    import { app } from '../firebase.js';
    import { getFirestore, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
    import { getStorage, ref, uploadBytes } from 'firebase/storage';

    let modelFileName = '';
    let selectedModelType = '';
    let modelThumbnailFileName = '';

    // for popupbox
    let popupInputUiHidden = true;
    let popupType = 'confirm';
    let popupLabel = 'Not Set';
    let popupConfirmOptions = [];
    let popupCancelFunction = null;

    let modelTypes = [
        'Heart', 'Other'
    ];

    let defaultControlSpheres = {
        0: {
            x: 25.3,
            y: 126.75,
            z: 63.12
        },
        1: {
            x: 13.2,
            y: 25.0,
            z: 46.83,
        },
        2: {
            x: -52.74,
            y: -10.8,
            z: -70.77
        }
    }

    // extend this in the future
    let allowedModelFileExtensions = [
        'glb',
    ];

    let allowedModelThumbnailFileExtensions = [
        'png', 'jpg', 'jpeg',
    ];

    export let uploadModelId;
    export let uploadModelTitle;
    export let uploadModelDescription;
    export let uploadModelPinned;

    function checkInputData() {
        if (!$editModelDataOn) {
            let modelFile = document.getElementById('model-file-input');
            let modelThumbnailFile = document.getElementById('model-thumbnail-file-input');
    
            // remove the Drive letter://fakePath
            modelFileName = modelFile.value.split('\\').pop();
            
            // return the file extension for the model and then the thumbnail
            let modelFileNameExtension = modelFileName.split('.').pop();
    
            let modelFileExtensionAllowed = allowedModelFileExtensions.find(
                (str) => {
                    return str == modelFileNameExtension;
                }
            )
    
            // check that all fields have data
            if (uploadModelId.length == 0 || uploadModelTitle.length == 0 || uploadModelDescription.length == 0 || modelFileName.length == 0) {
                openInputPopup('NA', 'Error: Must fill out all fields!', [{text: 'Okay', fn: closeInputPopup}]);
                return;
            }

            // check if the model file is valid
            if (!modelFileExtensionAllowed) {
                openInputPopup('NA', 'Model must be in a glb file format!', [{text: 'Okay', fn: closeInputPopup}]);
                return
            }
    
            addNewModelData();
            addModelFiles(modelFile, true)
    
            // since thumbnails are optional, we have a separate check if the user is uploading one
            // and only if all other fields are setup and a valid model file is included
            if (modelThumbnailFile.files.length > 0) {
                modelThumbnailFileName = modelThumbnailFile.value.split('\\').pop();
                
                let modelThumbnailFileExtension = modelThumbnailFileName.split('.').pop();
    
                let modelThumbnailFileExtensionAllowed = allowedModelThumbnailFileExtensions.find(
                    (str) => {
                        return str == modelThumbnailFileExtension;
                    }
                )
    
                if (modelThumbnailFileExtensionAllowed) {
                    addModelFiles(modelThumbnailFile, false)                
                } else {
                    openInputPopup('NA', 'Thumbnail file type must be .png', [{text: 'Okay', fn: closeInputPopup}]);
                    return
                }    
            }

            openInputPopup('NA', `${uploadModelTitle} successfully uploaded!`, [{text: 'Great!', fn: closeInputPopup}]);
        } else {
            // check that all fields have data
            if (uploadModelId.length == 0 || uploadModelTitle.length == 0 || uploadModelDescription.length == 0) {
                openInputPopup('NA', 'Error: Must fill out all fields!', [{text: 'Okay', fn: closeInputPopup}]);
                return;
            }

            editExistingModelData();

            openInputPopup('NA', `${uploadModelTitle} successfully updated!`, [{text: 'Great!', fn: closeInputPopup}]);
        }

        clearInputs();
    }

    function clearInputs() {
        uploadModelId = '';
        uploadModelTitle = '';
        uploadModelDescription = '';
        modelFileName = '';
        selectedModelType = '';
        modelThumbnailFileName = '';
        uploadModelPinned = false;
    }

    async function addNewModelData() {
        let db = getFirestore(app);

        // we dont' need an esophageal path if it's not a heart
        if (selectedModelType != 'heart') {
            defaultControlSpheres = {}
        }

        let modelDocPath = modelFileName.slice(0, -4);

        let data = {
            annotations: [],
            bookmarks: [],
            controlSpheres: defaultControlSpheres,
            dateCreated: serverTimestamp(),
            description: uploadModelDescription,
            fileName: modelFileName,
            modelId: uploadModelId,
            modelTitle: uploadModelTitle,
            modelType: selectedModelType,
            pinned: uploadModelPinned,

            // by default, only APIL can post models for now
            poster: 'APIL',
        };
        
        await setDoc(doc(db, 'modelDb', modelDocPath), data);
    }

    async function editExistingModelData() {
        let db = getFirestore(app);

        let modelDocPath = $modelPath.slice(0, -4);

        let updatedData = {
            modelId: uploadModelId,
            modelTitle: uploadModelTitle,
            description: uploadModelDescription,
            pinned: uploadModelPinned,
            dateEdited: serverTimestamp(),
        };

        await updateDoc(doc(db, 'modelDb', modelDocPath), updatedData);
    }

    async function addModelFiles(file, isModelFile) {
        let storage = getStorage(app);
        let newFile;
        let fileType;

        if (isModelFile) {
            newFile = modelFileName;
            fileType = 'model';
        } else {
            let modelThumbnailFileExtension = modelThumbnailFileName.split('.').pop();

            newFile = `${modelFileName.slice(0, -4)}_thumbnail.${modelThumbnailFileExtension}`
            fileType = 'model thumbnail'
        }
        
        let modelFileRef = ref(storage, `models/${modelFileName.slice(0, -4)}/${newFile}`);

        await uploadBytes(modelFileRef, file.files[0])
            .then((snapshot) => {
                console.log(`uploaded a new ${fileType}!`);
            });
    }

    function openInputPopup(type, label, confirmFunction) {
        popupInputUiHidden = false;

        popupType = type;
        popupLabel = label;
        popupCancelFunction = closeInputPopup;
        popupConfirmOptions = confirmFunction;
    }

    function closeInputPopup() {
        popupInputUiHidden = true;
        closeUploadPanel();
    }

    function closeUploadPanel() {
        uploadPanelShow.set(false);

        if ($editModelDataOn) {
            editModelDataOn.set(false);
        
            // can't call replace and reload the window...have to do it like this
            window.location = '/#';

            // best way to dump the 3js scene when switching away??
            location.reload();
        }
    }

</script>

<PopupBox 
    popupInputUiHidden={popupInputUiHidden} 
    popupLabel={popupLabel} 
    popupType={popupType} 
    popupConfirmOptions={popupConfirmOptions} 
    popupCancelFunction={popupCancelFunction} 
/>

<div id='main' hiddden>
    <div id='upload-panel-main'>
        <div id='upload-panel-input-container'>
            <div id='upload-panel-left-col'>
                <div id='model-id-container'>
                    <label for='model-id-input'>Model ID</label>
                    <input id='model-id-input' bind:value={uploadModelId} />
                </div>
                <div id='model-title-container'>
                    <label for='model-title-input'>Model Title</label>
                    <input id='model-title-input' bind:value={uploadModelTitle} />
                </div>
                <!-- looks like crap -->
                <div>
                    <label for='model-pinned-input'>Pin Model?</label>
                    <input id='model-pinned-input' type='checkbox' bind:checked={uploadModelPinned} />
                </div>
                {#if !$editModelDataOn}
                    <div id='model-type-container'>
                        <label for='model-type-input'>Model Type</label>
                        <select id='model-type-input' bind:value={selectedModelType}>
                            {#each modelTypes as modelType}
                                <option value={modelType.toLowerCase()}>
                                    {modelType}
                                </option>
                            {/each}
                        </select>                
                    </div>
                {/if}
            </div>
            <div id='upload-panel-right-col'>
                <div id='model-description-container'>
                    <label for='model-description-input'>Model Description</label>
                    <textarea id='model-description-input' bind:value={uploadModelDescription} />
                </div>
                {#if !$editModelDataOn}
                    <div id='model-file-input-container'>
                        <div id='model-file-container'>
                            <label for='model-file-input'>Add Model (.glb)</label>
                            <input type='file' id='model-file-input' /> 
                        </div>
                        <div id='model-thumbnail-container'>
                            <label for='model-thumbnail-file-input'>Add Thumbnail (.png)</label>
                            <input type='file' id='model-thumbnail-file-input' /> 
                        </div>
                    </div>
                {/if}
            </div>
        </div>
        <div id='upload-panel-button-container'>
            <div>
                <button type='submit' on:click={() => checkInputData()}>
                    {#if $editModelDataOn}
                        Save Edited Model Data
                    {:else}
                        Upload Model
                    {/if}
                </button>
            </div>
            <div>
                <button on:click={() => closeUploadPanel()}>
                    {#if $editModelDataOn}
                        Close Editing Panel
                    {:else}
                        Close Upload Panel
                    {/if}
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    #main {
        background: #000;
        position: absolute;
        left: 0;
        top:0;
        z-index: 102;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #upload-panel-main {
        width: 70%;
        height: 60%;
        display: grid;
        grid-template-rows: 95% 5%;
    }

    #upload-panel-input-container {
        display: grid;
        column-gap: 5%;
        grid-template-columns: 1fr 1fr;
    }

    #upload-panel-left-col {
        display: grid;
        row-gap: 2%;
        grid-template-rows: 1fr 1fr 1fr;
    }

    #upload-panel-right-col {
        display: grid;
        row-gap: 2%;
        grid-template-rows: 1fr 1fr 1fr;
    }

    #model-id-input {
        width: 100%;
    }

    #model-type-input {
        width: 100%;
    }

    #model-title-input {
        width: 100%;
    }

    #model-description-container {
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #model-description-input {
        resize: none;
    }

    #model-file-input-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    #model-file-container {
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #model-thumbnail-container {
        display: grid;
        grid-template-rows: 1fr 1fr;
    }

    #upload-panel-button-container {
        display: grid;
        column-gap: 5%;
        grid-template-columns: 1fr 1fr;
    }

    #upload-panel-button-container button {
        width: 100%;
        height: 100%;
    }

    #model-file-input {
        border: none;
    }

    #model-thumbnail-file-input {
        border: none;
    }

    label {
        color: #bbbbbb;
        display: flex;
        align-items: flex-end;
        font-size: 1.25rem;
        font-style: bold;
        margin-bottom: 2rem;
    }

    input {
        font-size: 1.15rem;
    }

    select {
        height: 15%;
        font-size: 1.15rem;;
    }

    option {
        font-size: 1.15rem;
    }

    textarea {
        border: none;
        font-size: 1.15rem;
    }

    textarea:focus {
        outline: none;
    }

</style>