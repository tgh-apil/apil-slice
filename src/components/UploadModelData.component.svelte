<script>
    import { uploadPanelShow } from '../stores.js';

    import { app } from '../firebase.js';
    import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore/lite';
    import { getStorage, ref, uploadBytes } from 'firebase/storage';
    

    let modelId;
    let modelTitle;
    let modelType;
    let modelDescription;
    let modelFileName;

    async function addNewModelData() {
        let db = getFirestore(app);

        // remove the Drive letter://fakePath
        let file = document.getElementById('model-file-input')
        modelFileName = file.value.slice(12);

        let data = {
            bookmarks: [],
            controlSpheres: {
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
            },
            dateCreated: serverTimestamp(),
            description: modelDescription,
            fileName: modelFileName,
            modelId: modelId,
            modelTitle: modelTitle,
            modelType: modelType,
            poster: 'APIL',
        }

        // await setDoc(doc(db, 'modelDb', data.fileName), data);
        addModelFiles(file)

        console.log(data.fileName);
    }

    function addModelFiles(file) {
        let storage = getStorage(app);

        let modelFileRef = ref(storage, `models/${modelFileName.slice(0, -4)}/${modelFileName}`);

        uploadBytes(modelFileRef, file)
            .then((snapshot) => {
                console.log('uploaded a new model!');
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
            <label for='model-id-input'>Model Type:</label>
            <input id='model-type-input' bind:value={modelType} />
        </div>
        <div>
            <label for='model-description-input'>Model Description:</label>
            <textarea id='model-description-input' cols='40' rows='20' bind:value={modelDescription} />
        </div>
        <div>
            <label for='model-file-input'>Add Model File (.glb)</label>
            <input type='file' id='model-file-input' /> 
        </div>
        <div id='upload-panel-button-container'>
            <div>
                <button on:click={() => addNewModelData()}>Save</button>
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