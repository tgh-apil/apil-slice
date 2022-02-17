<script>
    import { uploadPanelShow } from '../stores.js';

    import { app } from '../firebase.js';
    import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
    import { getStorage, ref, uploadBytes } from 'firebase/storage';
    
    let modelId = null;
    let modelTitle = null;
    let modelDescription = null;
    let modelFileName = null;
    let selectedModelType = null;
    let modelThumbnailFileName = null;

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

    function checkInputData() {
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
        if (modelId == null || modelTitle == null || modelDescription == null || modelFileName == null) {
            return console.log('must fill out all fields');
        } 

        // check if the model file is valid
        if (!modelFileExtensionAllowed) {
            return console.log('Model must be in a glb file format!');
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
                console.log('thumbnail file type must be png, jpg, or jpeg')
            }
            
        }
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
            description: modelDescription,
            fileName: modelFileName,
            modelId: modelId,
            modelTitle: modelTitle,
            modelType: selectedModelType,

            // by default, only APIL can post models for now
            poster: 'APIL',
        }
        
        await setDoc(doc(db, 'modelDb', modelDocPath), data);
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

    function closeUploadPanel() {
        uploadPanelShow.set(false);
    }

</script>

<div hiddden>
    <div id='upload-panel-input-container'>
        <div>
            <label for='model-id-input'>Model ID:</label>
            <input id='model-id-input' bind:value={modelId} />
        </div>
        <div>
            <label for='model-id-input'>Model Title:</label>
            <input id='model-title-input' bind:value={modelTitle} />
        </div>
        <div>
            <label for='model-type-input'>Model Type:</label>
            <select id='model-type-input' bind:value={selectedModelType}>
                {#each modelTypes as modelType}
                    <option value={modelType.toLowerCase()}>
                        {modelType}
                    </option>
                {/each}
            </select>                
        </div>
        <div>
            <label for='model-description-input'>Model Description:</label>
            <textarea id='model-description-input' cols='40' rows='20' bind:value={modelDescription} />
        </div>
        <div>
            <label for='model-file-input'>Add Model File (.glb)</label>
            <input type='file' id='model-file-input' /> 
        </div>
        <div>
            <label for='model-thumbnail-file-input'>Add Model Thumbnail (.png)</label>
            <input type='file' id='model-thumbnail-file-input' /> 
        </div>
        <div id='upload-panel-button-container'>
            <div>
                <button on:click={() => checkInputData()}>Save</button>
            </div>
            <div>
                <button on:click={() => closeUploadPanel()}>Cancel</button>
            </div>
        </div>
    </div>
</div>

<style>

#upload-panel-input-container {
    background: #000;
    position: absolute;
    z-index: 102;
    width: 100%;
    height: 100%;
    left: 0;
    top: 7%;
    display: grid;
    grid-auto-rows: min-content;
}

#upload-panel-button-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
}

#upload-panel-button-container button {
    width: 80%;
    height: 100%;
}

</style>