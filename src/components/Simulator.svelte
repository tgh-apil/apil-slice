<script>
    import { onMount } from 'svelte';
    import * as THREE from 'three';
    import { GUI } from 'lil-gui';
    import { OrbitControls}  from 'three/examples/jsm/controls/OrbitControls';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
    import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
    import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
    import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
    
    import { viewWidth, descriptionBoxShow, decsriptionBoxHeight, modelPath, navBarSize, helpBox,
            savedControlSphereList, userBookmarks, annotations, modelType, userData, modelId, modelDownloadUrl } from '../stores.js';

    import PopupBox from './PopupBox.component.svelte';
    
    // -----------------STARTFIREBASE IMPORTS---------------
    import { app } from '../firebase.js';
    import { getStorage, ref, getDownloadURL } from 'firebase/storage';
    import { getFirestore, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore/lite';
    // -----------------END FIREBASE IMPORTS---------------

    // -----------------START GLOBAL VARIABLES---------------
    let scene, renderer, viewCubeScene, viewCubeRenderer;
    let orbitControls, teeMouseControls, transformControls;
    let camXPos, camYPos, camZPos;
    let splitView = false;
    let viewCubeReady = false;
    let loader, dracoLoader;
    let db = getFirestore(app);

    // FOR USER PERMISSIONS
    let isAdmin;

    if ($userData) {
        if ($userData.email == 'apiltgh@gmail.com') {
            isAdmin = true;
        } else {
            isAdmin = false;
        }        
    }

    // FOR ITEM SELECTION
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    // FOR MESH DATA
    let myocardium = null;
    let myocardiumNoClip = null;
    let modelParts = [];
    let septalDefectParts = [];

    // FOR SPLINE EDITING
    let path, pointCount, points, controlSphere, splineObject;

    let localControlSphereList = [];

    // number of points between each control sphere
    let numPathPoints = 50;
    let positionAlongPath = 0;

    // ULTRASOUND PROBE, BEAM, POSITIONAL MARKER, AND CABLE/TUBE
    let ultrasoundGroup;
    let ultrasoundProbeHead;
    let ultrasoundCamPivot;
    let ultrasoundOverlay;
    let beamMesh;
    let circleMarker;
    let ultrasoundTube;

    // FOR CAMERAS
    let pointerLockCam, camera, ultrasoundCamera, viewCubeCamera;
    // control this for ultrasound zoom level 
    let frustumSize = 220;
    let SCREEN_WIDTH = window.innerWidth;
    let SCREEN_HEIGHT = window.innerHeight;
    let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    // amount to split the screen by when in ultrasound mode
    // splits evenly between 3d view (main cam) and ultrasound view (ortho cam)
    let screenSplit = 0.4

    let ultrasoundCamHeight = 50;

    // FOR STENCIL
    let backFaceStencilMat, frontFaceStencilMat, planeStencilMat;
    let frontMesh, backMesh, planeMesh;

    // FOR CLIPPING PLANE
    let pointA, pointB, pointC;
    let clippingPlane, tubeClippingPlane;
    let axClippingPlane, sagClippingPlane, corClippingPlane;
    let axPlaneHelper, sagPlaneHelper, corPlaneHelper;

    let sceneClippingPlanes = [];

    // FOR ANNOTATIONS
    let annotationList = [];
    let annotationTarget;

    // FOR OBJECT RENDERING VIA LAYERS
    // subscribing to layer 0 means every camera sees it
    let mainCamLayer = 1;
    let ultrasoundCamLayer = 2;
    let raycastHelperLayer = 3;
    let ultrasoundOverlayLayer = 4;
    let hiddenLayer = 10;

    // FOR START MIN/MAX VALUES OF ULTRASOUND PROBE + BEAM
    let ultrasoundStartMaxValues = {
        anteflexMin: -45.0,
        anteflexMax: 45.0,
        rightLeftFlexMin: -30,
        rightLeftFlexMax: 30,
        twistMin: -90.0,
        twistMax: 90.0,
        omniplaneMin: -180.0,
        omniplaneMax: 180.0,
    }

    // FOR LOCAL BOOKMARKING
    // this is only used for the user's current session -- it is not persistent
    // persistence is on firebase
    // only use the $userBookmarks store (data loaded from firestore) as read only at this stage
    let localBookmarks = $userBookmarks;

    // FOR GUI CONTROL PARAMETERS
    let gui = new GUI({width: 250});

    let bottomGuiHidden = false;
    let bookmarkUiHidden = true;
    let controlUiHidden = true;
    let omniplaneReadoutHidden = true;

    // for popupbox
    let popupInputUiHidden = true;
    let popupType = 'confirm';
    let popupLabel = 'Not Set';
    let popupConfirmOptions = [];
    let popupCancelFunction = null;

    // for lilgui
    let modelControlFolder, controlFolder, adminFolder, clippingPlaneFolder, septalDefectFolder;
    let annotationDisplay;

    let modeParams = {
        activate_ultrasound: false,
    }

    // empty object
    // as model is loaded, the different parts get added
    // so we can control individual model part visibility in the GUI
    // is empty to scale to hold as many parts the model has
    let partListObject = new Object();
    let septalDefectListObject = new Object();
    
    let modelControlParams = {
        toggle_myocardium: 2,
        toggle_all_models: 0,
        toggle_all_septal_models: 2,
        toggle_ax_clipping: false,
        toggle_sag_clipping: false,
        toggle_cor_clipping: false,
        ax_negate: false,
        sag_negate: false,
        cor_negate: false,
        ax_pos: 50,
        sag_pos: 0,
        cor_pos: 0,
        annotations_hidden: false,
    }

    // object for probe controls in the GUI
    // when dealing with controling the probe, call these objects so the GUI also updates!
    let controlParams = {
        anteflex: 0,
        rightLeftFlex: 0,
        twist: 0,
        omniplane: 0,
        advance: 0,
        xtee: function() {
            controlFolder.open();

            if (teeMouseControls.isLocked) {
                teeMouseControls.unlock();
                orbitControls.enabled = true;
                modelControlFolder.open();
                bottomGuiHidden = false;

            } else {
                bottomGuiHidden = true;
                teeMouseControls.lock();
                orbitControls.enabled = false;
                modelControlFolder.close();
            }
        },

        reset: function () {
            resetProbe();
        }
    }

    // default control mode is keyboard (and the UI sliders which are always on)
    let inputControlOptions = 'keyboard';

    let adminParams = {
        toggle_editing: false,

        add_control_sphere: function() {
            generateControlSphere();
            generateSpline();
        },

        save_sphere_position: function() {
            saveControlSpherePosition();
        },
    }

    // handles movemnt of the probe + beam
    let probeControls = {
        anteflex: function (v) {
            ultrasoundProbeHead.rotation.x = -v * Math.PI/180;
            matchCoPlanar(pointA, pointB, pointC);                
        },

        omniplane: function(v) {
            ultrasoundCamPivot.rotation.y = -v * Math.PI/180;
            matchCoPlanar(pointA, pointB, pointC);
        },

        rightLeftFlex: function(v) {
            ultrasoundProbeHead.rotation.y = v * Math.PI/180;
            matchCoPlanar(pointA, pointB, pointC);
        },

        twist: function(v) {
            ultrasoundProbeHead.rotation.z = v * Math.PI/180;
            matchCoPlanar(pointA, pointB, pointC);
        },

        // v coming in as an integer from 0 -> 100 representing a percentage of amount traveled on the path
        advance: function(v) {
            if (path) {
                // convert v to decimal and round to nearest lowest int
                try {
                    positionAlongPath = Math.floor((v / 100) * (points.length - 1));

                    ultrasoundGroup.position.x = points[positionAlongPath].x;
                    ultrasoundGroup.position.y = points[positionAlongPath].y;
                    ultrasoundGroup.position.z = points[positionAlongPath].z;
                
                    rotateAlongCurve(path);
                    matchCoPlanar(pointA, pointB, pointC);
                } catch (e) {
                    return;
                }
            } else {
                console.log('path needed before probe can move!')
            }
        }
    }
    // -----------------END GLOBAL VARIABLES-----------------

    // -----------------START GLOBAL SCENE HELPER FUNCTIONS-----------------
    // responsible for getting the selected 3D model from firebase storage
    let loadingBarHidden = false;
    function modelLoader(path) {
        // get reference to storage service used to create references in storage bucket
        let storage = getStorage(app);

        let modelFolder = path.slice(0, -4);

        // create storage reference from google storage service
        let storageRef = ref(storage);

        // points to a sub directory within the root storage called 'models'
        let modelDirRef = ref(storageRef, `models/${modelFolder}/${path}`);
            
        return new Promise((resolve, reject) => {
            getDownloadURL(modelDirRef)
                .then((url) => {
                    // args: file path, returns a promise on resolve, shows progress of the load, reject the promise if there's an error
                    loader.load(url, 
                                res => resolve(res),
                                xhr => ((xhr.loaded / xhr.total * 100) < 99) ? loadingBarHidden = false : loadingBarHidden = true,
                                reject);
                    
                    modelDownloadUrl.set(url);
                })
        });
    }

    //calculates the bounding box or myocardium/largest obecjt in the scene and sets scene camera
    function setCamPosition(targetModel) {
        targetModel.computeBoundingBox;

        let modelCenter = new THREE.Vector3();
        let modelSize = new THREE.Vector3();

        targetModel.geometry.boundingBox.getCenter(modelCenter);
        targetModel.geometry.boundingBox.getSize(modelSize);

        // the taller the object the further back we go
        let offset = (modelSize.y /3);

        // set to 0 so we're always looking at the model from the anterior position
        camXPos = 0;

        // place y a little over the middle of the model
        camYPos = (modelSize.y + 20);
        camZPos = -(modelSize.z + offset);

        camera.position.set(camXPos, camYPos, camZPos);
        orbitControls.target = new THREE.Vector3(0, modelCenter.y, 0);

        orbitControls.update();
    }

    // responsbile for setting up the selected 3D model (colours, clipping, etc...)
    async function modelParser(path) {       
        let data = await modelLoader(path);
        let models = data.scene;

        scene.add(models);

        if ($modelType.toLowerCase() != 'heart') {
            let modelList = [];
            let boundingBoxSizeList = [];
            let targetModel;

            models.children.forEach(model => {
                model.computeBoundingBox;
                
                let tempSize = new THREE.Vector3();
                
                model.geometry.boundingBox.getSize(tempSize);
                
                let tempVolume = (tempSize.x * tempSize.y * tempSize.z);
                
                modelList.push(model);

                boundingBoxSizeList.push(tempVolume);
            })

            let maxVolume = Math.max(...boundingBoxSizeList);
            let maxVolumeIndex = boundingBoxSizeList.indexOf(maxVolume);

            targetModel = modelList[maxVolumeIndex];

            setCamPosition(targetModel);
        }

        models.children.forEach(model => {
            if (model.name.toLowerCase() == 'myocardium') {
                // set the camera position according to the myocardium's size
                setCamPosition(model);

                // create two copies: one clippable, one not
                myocardium = model;
                myocardiumNoClip = model.clone();
                
                myocardium.material = modelMat(0xb50d0d);
                myocardium.layers.set(hiddenLayer);
                myocardium.material.clippingPlanes = [clippingPlane];
                scene.add(myocardium);
                
                frontMesh = new THREE.Mesh(myocardium.geometry, frontFaceStencilMat);
                frontMesh.layers.set(hiddenLayer);
                scene.add(frontMesh);
                
                backMesh = new THREE.Mesh(myocardium.geometry, backFaceStencilMat);
                backMesh.layers.set(hiddenLayer);
                scene.add(backMesh);
                
                myocardiumNoClip.material = modelMat(0xb50d0d);
                myocardiumNoClip.layers.set(hiddenLayer);
                myocardiumNoClip.material.clippingPlanes = sceneClippingPlanes;
                scene.add(myocardiumNoClip);
            } else {
                // puts all models (other than myocardium) into a single object to make toggling visibility easier
                // limited colour pallete targeted more specifically to the heart for now
                if (model.name.includes("1_")) {
                    modelParts.push(model);
                    model.material = modelMat(0xe62e2e);
                } else if (model.name.includes("2_")) {
                    modelParts.push(model);
                    model.material = modelMat(0x372ee6);
                } else if (model.name.includes("3_")) {
                    modelParts.push(model);
                    model.material = modelMat(0xe6682e);
                } else if (model.name.includes("4_")) {
                    modelParts.push(model);
                    model.material = modelMat(0x2ebee6);
                } else if (model.name.includes("5_")) {
                    modelParts.push(model);
                    model.material = modelMat(0xe6bb2e);
                } else if (model.name.includes("6_")) {
                    modelParts.push(model);
                    model.material = modelMat(0x2ee662);
                } else if (model.name.includes("7_")) {
                    septalDefectParts.push(model);
                    model.material = modelMat(0xc06858);
                } else if (model.name.includes("8_")) {
                    septalDefectParts.push(model);
                    model.material = modelMat(0x80ae80);
                } else if (model.name.includes("9_")) {
                    septalDefectParts.push(model);
                    model.material = modelMat(0x6fb8d2);
                } else if (model.name.includes("10_")) {
                    septalDefectParts.push(model);
                    model.material = modelMat(0x00aaff);
                } else if (model.name.includes("IVS")) {
                    septalDefectParts.push(model);
                    model.material = modelMat(0x4f4241);
                } else if (model.name.includes("*")) {
                    septalDefectParts.push(model);
                    model.material = modelMat(0xedebd8);
                } else {
                    modelParts.push(model);
                    model.material = modelMat('white');
                }

                model.material.clippingPlanes = sceneClippingPlanes;
                model.layers.set(mainCamLayer);

                if (septalDefectParts.length > 0) {
                    septalDefectParts.forEach(part => {
                        part.layers.set(hiddenLayer);
                    })
                }
            }
        })
        
        // spawn annotations

        if ($annotations) {
            annotationList = $annotations;
    
            annotationList.forEach(annotation => {
                applyAnnotationStyle(annotation.name, true);
            })
        }

        addModelControlFolder();
    }

    function handleRaycast(e) {
        // used for raycasting as per: https://threejs.org/docs/#api/en/core/Raycaster
        // calculate mouse position in normalized device coordinates
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        raycaster.layers.set(mainCamLayer);

        // un-comment the next 3 lines for debugging the raycaster
        // let rayHelper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 1500, 0xff0000);
        // rayHelper.layers.set(raycastHelperLayer);
        // scene.add(rayHelper);

        let intersects = raycaster.intersectObjects(scene.children);
        let previousObject;

        if (intersects.length > 0) {
            let target = intersects[0];

            if (target.object.name == 'control_sphere') {
                generateTransformControl(target.object);
                previousObject = target.object;
                previousObject.material = new THREE.LineBasicMaterial({color: 'pink'});
            }

            // for annotations -- not quite working ignore for now
            if (target.object.type == 'Mesh' && target.object.name != 'control_sphere') {
                if ($userData) {
                    annotationTarget = target;
                    // hide all annotations
                    modelControlParams.annotations_hidden = true;

                    // turn off any open annotation content boxes
                    toggleAllAnnotations(true);

                    openInputPopup('input', 'Add annotation', [{text: 'Save Annotation', fn: addAnnotation}]);
                } else {
                    openInputPopup('NA', 'Must be logged in to add an annotation', [{text: 'Okay', fn: closeInputPopup}]);
                }
            }
        }
    }

    function spawnLights() {
        let ambientLight = new THREE.AmbientLight('white', 0.5);
        ambientLight.name = 'ambient_light';
        scene.add(ambientLight);

        let spotLightOne = new THREE.SpotLight('white', 0.3);
        spotLightOne.position.set(100, 500, 100);
        spotLightOne.name = 'spotlight_one';
        scene.add(spotLightOne);

        let spotLightTwo = new THREE.SpotLight('white', 0.3);
        spotLightTwo.position.set(-100, 500, 100);
        spotLightTwo.name = 'spotlight_two';
        scene.add(spotLightTwo);

        let spotLightThree = new THREE.SpotLight('white', 0.3);
        spotLightThree.position.set(0, 500, -100);
        spotLightThree.name = 'spotlight_three';
        scene.add(spotLightThree);

        let spotLightFour = new THREE.SpotLight('white', 0.3);
        spotLightFour.position.set(0, -200, -100);
        spotLightFour.name = 'spotlight_four';
        scene.add(spotLightFour);
    }

    // only the main cam and dummy cam are called here.
    // the ortho/ultrasound camera is called in spawnUltrasoundBeam()
    function spawnCameras() {
        // Main camera for the scene
        camera = new THREE.PerspectiveCamera(75, 0.5 * aspect, 0.1, 1000);
        camera.layers.enable(mainCamLayer);
        camera.layers.enable(ultrasoundCamLayer);
        
        // Dummy camera for the pointer lock
        // so screen doesn't move when pointer lock is on.
        // does not render anything
        pointerLockCam = new THREE.PerspectiveCamera(1, 1, 0.1, 1);
    }
    // -----------------END GLOBAL SCENE HELPER FUNCTIONS-----------------

    // -----------------START ANNOTATION HELPER FUNCTIONS-----------------
    async function addAnnotation() {
        popupInputUiHidden = true;

        let annotationContent = document.getElementById('input-field').value;

        if (annotationContent == '' || annotationContent === undefined) {
            openInputPopup('NA', 'Annotation cannot be empty!',  [{text: 'Okay', fn: closeInputPopup}]);

            modelControlParams.annotations_hidden = false;
            return
        }

        let newAnnotation = {
            name: `annotation-${annotationList.length}`,
            // why can't i just set annoPos = target.point?
            // the renderer won't let me?
            point: 
            {
                x: annotationTarget.point.x,
                y: annotationTarget.point.y,
                z: annotationTarget.point.z,
            },
            targetParentName: annotationTarget.object.name,
            content: annotationContent,
            poster: $userData.displayName,
        };

        annotationList = [...annotationList, newAnnotation];

        // write new data to firebase
        let docName = $modelPath;
        docName = docName.slice(0, -4);
        
        // get reference to this specific bookmark from firebase
        // database, collection, document
        let bookmarkRef = doc(db, 'modelDb', docName);

        await updateDoc(bookmarkRef, {
            // newest entry to the local bookmarks is always going to be the last one
            annotations: arrayUnion(annotationList.at(-1)),
        })

        applyAnnotationStyle(annotationList[annotationList.length - 1].name, false);

        modelControlParams.annotations_hidden = false;

        updateAnnotationPosition();
    }

    function applyAnnotationStyle(newAnnotation, contentBoxHidden) {
        // wait for the new annotation to load then apply style and open the content box
        let observer = new MutationObserver((mutation, obs) => {
            let annoRef = document.getElementById(newAnnotation);
            let annoContentRef = document.getElementById(newAnnotation + '-content-box');

            if (annoRef && annoContentRef) {
                annoContentRef.hidden = contentBoxHidden;

                annoRef.style.position = 'absolute';
                annoRef.style.zIndex = '102';
                annoRef.style.background = '#00000099';
                annoRef.style.width = '2em';
                annoRef.style.height = '2em';
                annoRef.style.color = '#fff';
                annoRef.style.display = 'flex';
                annoRef.style.justifyContent = 'center';
                annoRef.style.alignItems = 'center';
                annoRef.style.borderRadius = '100%';
                annoRef.style.border = '0.2rem solid #00acac';
                annoRef.style.cursor = 'pointer';

                annoContentRef.style.position = 'absolute';
                annoContentRef.style.zIndex = '103';
                annoContentRef.style.width = '15em';
                annoContentRef.style.height = '10em';
                annoContentRef.style.color = '#fff';

                obs.disconnect();
                return
            } 
        })

        observer.observe(document, {
                childList: true,
                subtree: true,
        })
    }

    function updateAnnotationPosition() {
        let canvas = renderer.domElement;

        for (let i = 0; i < annotationList.length; i++) {
            let annoPos = new THREE.Vector3(annotationList[i].point.x, annotationList[i].point.y, annotationList[i].point.z);
    
            // converts the intersect point to normazlied device coordinate (2D);
            annoPos.project(camera);
    
            // from https://manu.ninja/webgl-three-js-annotations/
            annoPos.x = Math.round((0.5 + annoPos.x / 2) * (canvas.width / window.devicePixelRatio));
            
            annoPos.y = Math.round((0.5 - annoPos.y / 2) * (canvas.height / window.devicePixelRatio));
            
            // set this mutation observer to get a callback to fire when the html element has actually loaded
            // otherwise the style won't be applied until the next double click.
            let observer = new MutationObserver((mutations, obs) => {
                let annoRef = document.getElementById(annotationList[i].name);
                let annoContentRef = document.getElementById(annotationList[i].name + '-content-box'); 

                if (annoRef && annoContentRef) {
                    annoRef.style.top = `${annoPos.y}px`;
                    annoRef.style.left = `${annoPos.x}px`;
                    annoContentRef.style.top = `${annoPos.y + 36}px`;
                    annoContentRef.style.left = `${annoPos.x + 36}px`;

                    let parentMesh = scene.getObjectByName(annotationList[i].targetParentName);
                    let distanceToParentMesh = camera.position.distanceTo(parentMesh.position);

                    let annotationPoint = new THREE.Vector3(
                        annotationList[i].point.x,
                        annotationList[i].point.y,
                        annotationList[i].point.z,
                    )

                    let distanceToAnnotation = camera.position.distanceTo(annotationPoint);

                    if (distanceToAnnotation > distanceToParentMesh) {
                        annoRef.style.opacity = 0.25;
                        annoContentRef.style.opacity = 0.25;
                    } else {
                        annoRef.style.opacity = 1.0;
                        annoContentRef.style.opacity = 1.0;
                    }

                    obs.disconnect();
                    return
                }
            })

            observer.observe(document, {
                childList: true,
                subtree: true,
            })
        }
    }

    function openAnnotation(annotation) {
        // turn off all annotation content boxes
        toggleAllAnnotations(true);

        // turn on only the content box associated wutg the clicked on marker
        let requestedContentBox = document.getElementById(annotation + '-content-box');
        requestedContentBox.hidden = false;
    }

    function closeAnnotation(annotation) {
        let requestedContentBox = document.getElementById(annotation + '-content-box');
        requestedContentBox.hidden = true;
    }

    function toggleAllAnnotations(isHidden) {
        if (annotationList.length > 0) {
            annotationList.forEach(anno => {
                let otherContentBox = document.getElementById(anno.name + '-content-box');
                otherContentBox.hidden = isHidden;
            });            
        }
    }
    // -----------------END ANNOTATION HELPER FUNCTIONS-----------------

    // -----------------START ULTRASOUND CONTROL FUNCTIONS-----------------
    // MOUSE CONTROLS: SCROLL WHEEL (Anteflex/Retroflex)
    function xteeControlWheel() {
        if (teeMouseControls.isLocked) {
            let e = window.event;
            if (e.deltaY > 0) {
                if (controlParams.anteflex < ultrasoundStartMaxValues.anteflexMax) {
                    e.preventDefault();
                    probeControls.anteflex(controlParams.anteflex += 1);                        
                }
            } else if (e.deltaY < 0) {
                if (controlParams.anteflex > ultrasoundStartMaxValues.anteflexMin) {
                    e.preventDefault();
                    probeControls.anteflex(controlParams.anteflex -= 1);                        
                }
            }
        }

        return;
    }

    // MOUSE CONTROLS: CLICK (Omniplane CCW/CW)
    // theis variable is  used ONLY for the mouse click omniplane control
    // leave as global so onMouseUp can access it and stop the interval
    let mouseOmniInterval;

    // tracks whether we were in xtee mode when the middle moouse button
    // is clicked.  This way we know to go back when the user has finished
    // selecting an option from the popup after middle mouse is clicked
    let wasInXteeMode;
    function xTeeControlClick(mouseButtonNumber) {
        let interval = 50;
        if (mouseButtonNumber == 0) {
            mouseOmniInterval = setInterval(() => {
                if (controlParams.omniplane > ultrasoundStartMaxValues.omniplaneMin) {
                    probeControls.omniplane(controlParams.omniplane -= 1);                    
                }
            }, interval);
        } else if (mouseButtonNumber == 1) {
            if (inputControlOptions == 'mouse') {
                controlParams.xtee();
                wasInXteeMode = true;

                openInputPopup(
                    'NA', 
                    'Select an option', 
                    [
                        {
                            text: 'Reset Probe',
                            fn: () => {
                                resetProbe();
                                closeInputPopup();
                            },
                        },
                        {
                            text: 'Save Bookmark',
                            fn: () => {
                                openInputPopup('input', 'Name your view', [{text: 'Save', fn: saveBookmark}])
                            },
                        },
                        {
                            text: `Disable ${inputControlOptions} mode`,
                            fn: () => {
                                wasInXteeMode = false;
                                inputControlOptions = 'keyboard';
                                closeInputPopup();
                            }
                        }
                    ]
                )
            } else {
                resetProbe();
            }
        } else if (mouseButtonNumber == 2) {
            mouseOmniInterval = setInterval(() => {
                if (controlParams.omniplane < ultrasoundStartMaxValues.omniplaneMax) {
                    probeControls.omniplane(controlParams.omniplane += 1);                        
                }
            }, interval);   
        } else {
            clearTimeout(mouseOmniInterval);
        }
    }

    // MOUSE CONTROLS: MOVEMENT (Advance/Retract/TWIST LEFT/TWIST RIGHT)
    function xTeeControlMove(mouseX, mouseY) {
        // set direction of movement of the probe depending on controller type
        let dir;

        // larger the number, the more movement from the mouse is needed to move the probe 
        let vertSpeed;
        let horSpeed;

        // reverses control direction depending on contoller input
        if (inputControlOptions == 'rod controller' || inputControlOptions == 'tee controller') {
            dir = -1;
            vertSpeed = 30;
            horSpeed = 25;
        } else {
            dir = 1;
            vertSpeed = 14;
            horSpeed = 8;
        }

        if (Math.abs(mouseY) > Math.abs(mouseX)) {
            let vertMoveAmount = (mouseY * dir) / vertSpeed;
            
            if (controlParams.advance < 100 && controlParams.advance > 0) {
                probeControls.advance(controlParams.advance -= vertMoveAmount);                
            } else if (controlParams.advance >= 100) {
                // probe forced to go backwards
                probeControls.advance(controlParams.advance -= (Math.abs(vertMoveAmount)));            
            } else if (controlParams.advance <= 0){
                // probe forced to go forwards
                probeControls.advance(controlParams.advance += (Math.abs(vertMoveAmount)));            
            } else {
                console.log('something went wrong with the advance');
            }
        }

        if (Math.abs(mouseX) > Math.abs(mouseY)) {
            // slow down the twist compared to the advance/retract
            let horMoveAmount = (mouseX * dir) / horSpeed;

            if (controlParams.twist < ultrasoundStartMaxValues.twistMax && controlParams.twist > ultrasoundStartMaxValues.twistMin) {
                probeControls.twist(controlParams.twist += horMoveAmount);
            } else if (controlParams.twist >= ultrasoundStartMaxValues.twistMax) {
                probeControls.twist(controlParams.twist -= (Math.abs(horMoveAmount)));            
            } else if (controlParams.twist <= ultrasoundStartMaxValues.twistMin) {
                probeControls.twist(controlParams.twist += (Math.abs(horMoveAmount)));            
            } else {
                console.log('something went wrong with the twist');
            }
        }
    }

    function keyboardControls(isOn) {
        if (isOn) {
            document.onkeydown = function(e) {
                switch (e.key) {
                    case 'ArrowUp':
                        if (controlParams.advance < 100) {
                            e.preventDefault();
                            probeControls.advance(controlParams.advance += 1);
                        }
                    break;

                    case 'ArrowDown':
                        if (controlParams.advance > 0) {
                            e.preventDefault();
                            probeControls.advance(controlParams.advance -= 1);
                        }
                    break;

                    case 'ArrowLeft':
                        if (controlParams.twist > ultrasoundStartMaxValues.twistMin) {
                            e.preventDefault();
                            probeControls.twist(controlParams.twist -= 1);
                        }
                    break;

                    case 'ArrowRight':
                        if (controlParams.twist < ultrasoundStartMaxValues.twistMax) {
                            e.preventDefault();
                            probeControls.twist(controlParams.twist += 1);
                        }
                    break;

                    case 'q':
                        if (controlParams.omniplane > ultrasoundStartMaxValues.omniplaneMin) {
                            probeControls.omniplane(controlParams.omniplane -= 1);
                        }
                    break;

                    case 'e':
                        if (controlParams.omniplane < ultrasoundStartMaxValues.omniplaneMax) {
                            probeControls.omniplane(controlParams.omniplane += 1);
                        }
                    break;

                    case 'w':
                        if (controlParams.anteflex < ultrasoundStartMaxValues.anteflexMax) {
                            probeControls.anteflex(controlParams.anteflex += 1);                        
                        }
                    break;

                    case 's':
                        if (controlParams.anteflex > ultrasoundStartMaxValues.anteflexMin) {
                            probeControls.anteflex(controlParams.anteflex -= 1);                        
                        }
                    break;

                    case 'a':
                        if (controlParams.rightLeftFlex > ultrasoundStartMaxValues.rightLeftFlexMin) {
                            probeControls.rightLeftFlex(controlParams.rightLeftFlex -= 1);                        
                        }
                    break;

                    case 'd':
                        if (controlParams.rightLeftFlex < ultrasoundStartMaxValues.rightLeftFlexMax) {
                            probeControls.rightLeftFlex(controlParams.rightLeftFlex += 1);                        
                        }
                    break;

                    case 't' || 'Escape':
                        controlParams.xtee();
                        
                        if (inputControlOptions != 'keyboard') {
                            inputControlOptions = 'keyboard';
                        } else {
                            inputControlOptions = 'mouse';
                        }
                    break;

                }
            };
        } else {
            document.onkeydown = function() {
                null;
            };
        }

        return;
    }

    function resetProbe() {
        if (wasInXteeMode) {
            controlParams.xtee();
            wasInXteeMode = false;
        }

        controlParams.anteflex = 0;
        controlParams.omniplane = 0;
        controlParams.rightLeftFlex = 0;
        controlParams.twist = 0;
        controlParams.advance = 0;

        probeControls.anteflex(controlParams.anteflex);
        probeControls.omniplane(controlParams.omniplane);
        probeControls.rightLeftFlex(controlParams.rightLeftFlex);
        probeControls.twist(controlParams.twist);
        probeControls.advance(controlParams.advance);
    }
    // -----------------END ULTRASOUND CONTROL FUNCTIONS-----------------

    // -----------------START BOOKMARK CONTROL FUNCTIONS-----------------
    function bookmarkMove() {
        let i = document.getElementById('bookmark-ui-1').value;

        // we can have i = -1 since the first 'option' in the dropdown is just a label for the dropdown
        if (i >= 0) {
            controlParams.anteflex = localBookmarks[i].value.retroAnteflex;
            probeControls.anteflex(controlParams.anteflex);
    
            controlParams.rightLeftFlex = localBookmarks[i].value.leftRightFlex;
            probeControls.rightLeftFlex(controlParams.rightLeftFlex);
    
            controlParams.twist = localBookmarks[i].value.leftRightTwist;
            probeControls.twist(controlParams.twist);
    
            controlParams.omniplane = localBookmarks[i].value.omniplaneRot;
            probeControls.omniplane(controlParams.omniplane);
    
            controlParams.advance = localBookmarks[i].value.advanceRetract;
            probeControls.advance(controlParams.advance);
        }
    }

    async function saveBookmark() {
        if ($userData) {
            keyboardControls(false);
            let bookmarkName = document.getElementById('input-field').value;

            if (bookmarkName !== "") {
                let newVal = {
                    retroAnteflex: controlParams.anteflex,
                    leftRightFlex: controlParams.rightLeftFlex,
                    leftRightTwist: controlParams.twist,
                    omniplaneRot: controlParams.omniplane,
                    advanceRetract: controlParams.advance,  
                }
        
                popupInputUiHidden = true;
        
                localBookmarks = [...localBookmarks, {name: bookmarkName, value: newVal}]
        
                // since we are using the index of the bookmark as the value in bookmarkMove() to choose the correct value of moves
                // and since we are appending to the userBookmarks by 1 every time this function is called
                // we can use userBookmarks.length - 1 as the new value to the new option being added to the dropdown
                document.getElementById('bookmark-ui-1').add(new Option(bookmarkName, localBookmarks.length - 1))

                // write new data to firebase
                let docName = $modelPath;
                docName = docName.slice(0, -4);
                
                // get reference to this specific bookmark from firebase
                // database, collection, document
                let bookmarkRef = doc(db, 'modelDb', docName);

                await updateDoc(bookmarkRef, {
                    // newest entry to the local bookmarks is always going to be the last one
                    bookmarks: arrayUnion(localBookmarks.at(-1)),
                })

                openInputPopup('NA', 'View saved!', [{text: 'Close', fn: closeInputPopup}]);
            } else {
                openInputPopup('input', 'Must enter a name to save a view!', [{text: 'Save View', fn: saveBookmark}]);
            }            
        } else {
            openInputPopup('NA', 'Must be logged in to save a view!', [{text: 'Okay', fn: closeInputPopup}]);
        }
    }

    async function updateBookmark() {
        if ($userData) {
            // reference the currently selected bookmark
            let bookmarkToUpdate = document.getElementById('bookmark-ui-1');
            keyboardControls(false);

            // this index starts at 1...
            let bookmarkIndex = bookmarkToUpdate.selectedIndex;
            let bookmarkName = bookmarkToUpdate.options[bookmarkIndex].text;

            // get current probe control values
            let currentVal;
            if (bookmarkName !== "") {
                currentVal = localBookmarks[bookmarkToUpdate.selectedIndex - 1].value;
            }
            
            // get updated values
            let newVal;
            if (bookmarkName !== "") {
                newVal = {
                    retroAnteflex: controlParams.anteflex,
                    leftRightFlex: controlParams.rightLeftFlex,
                    leftRightTwist: controlParams.twist,
                    omniplaneRot: controlParams.omniplane,
                    advanceRetract: controlParams.advance,  
                }
            }

            let bookmarkToDelete = {name: bookmarkName, value: currentVal};

            localBookmarks.splice(bookmarkIndex - 1, 1, {name: bookmarkName, value: newVal});

            popupInputUiHidden = true;

            let docName = $modelPath;
            docName = docName.slice(0, -4);
            
            // get reference to this specific bookmark from firebase
            // database, collection, document
            let bookmarkRef = doc(db, 'modelDb', docName);

            // delete the previous entry of the bookmark
            await updateDoc(bookmarkRef, {
                // does this shit count as two document write events?  It does, right?
                // why is there no direct arrayUpdate method??
                bookmarks: arrayRemove(bookmarkToDelete),
            })

            // add our newly updated bookmark back
            await updateDoc(bookmarkRef, {
                // bookmark we've modified
                bookmarks: arrayUnion(localBookmarks[bookmarkIndex - 1]),
            })
            
            openInputPopup('NA', 'View updated!', [{text: 'Close', fn: closeInputPopup}]);
        } else {
            openInputPopup('NA', 'Must be logged in to update a view!', [{text: 'Okay', fn: closeInputPopup}]);
        }
    }

    async function deleteBookmark() {
        if ($userData) {
            let bookmarkToRemove = document.getElementById('bookmark-ui-1');

            // this index starts at 1...
            // removes the bookmark as an option in dropdown
            let bookmarkIndex = bookmarkToRemove.selectedIndex
            bookmarkToRemove.remove(bookmarkIndex);
            popupInputUiHidden = true;

            // returns as an array of a single value
            let bookmarkToRemoveFirestore = localBookmarks.slice(bookmarkIndex - 1);

            let docName = $modelPath;
            docName = docName.slice(0, -4);
            
            // get reference to this specific bookmark from firebase
            // database, collection, document
            let bookmarkRef = doc(db, 'modelDb', docName);

            await updateDoc(bookmarkRef, {
                // bookmark to remove is an array and the actual entry we want to remove is in position 0 of the array
                // it should be the only entry in the array
                bookmarks: arrayRemove(bookmarkToRemoveFirestore[0]),
            })

            openInputPopup('NA', 'View deleted!', [{text: 'Close', fn: closeInputPopup}]);
        } else {
            openInputPopup('NA', 'Must be logged in to delete a view!', [{text: 'Okay', fn: closeInputPopup}]);
        }
    }
    // -----------------END BOOKMARK CONTROL FUNCTIONS-----------------

    // -----------------START ULTRASOUND MODE HELPER FUNCTIONS-----------------
    // generates a clipping plane co-planar with the 'ultrasound beam'/ultrasound camera
    // uses three co-planar points: point1, point2, point3 which are initiallized in init()
    function matchCoPlanar(point1, point2, point3) {
        // holy shit this is ugly as hell...

        point1.updateWorldMatrix(true);
        point2.updateWorldMatrix(true);
        point3.updateWorldMatrix(true);

        let newObj1 = new THREE.Object3D();
        let newObj2 = new THREE.Object3D();
        let newObj3 = new THREE.Object3D();

        let worldPoint1 = point1.localToWorld(newObj1.position);
        let worldPoint2 = point2.localToWorld(newObj2.position);
        let worldPoint3 = point3.localToWorld(newObj3.position);

        clippingPlane.setFromCoplanarPoints(worldPoint3, worldPoint2, worldPoint1);

        // the clipping plane to hide the tube is the same as the ultrasound clipping plane
        // just with its normal in the opposite direction
        tubeClippingPlane.setFromCoplanarPoints(worldPoint3, worldPoint2, worldPoint1).negate();
    }

    function generateTransformControl(mesh) {
        // remove existing transform controls in the scene before adding a new one
        scene.children.forEach(element => {
            if (element.name == 'transform_controls') {
                element.detach();
                element.dispose();
            }
        })

        transformControls = new TransformControls(camera, renderer.domElement);
        transformControls.name = 'transform_controls';

        transformControls.attach(mesh);
        
        transformControls.addEventListener('mouseDown', () => {
            orbitControls.enabled = false;
        });

        transformControls.addEventListener('mouseUp', () => {
            orbitControls.enabled = true;
            generateSpline();
        });

        transformControls.layers.set(mainCamLayer);
        scene.add(transformControls);
    }
    
    // spawns a controllable point (as a sphere) 
    // used to generate anchor points for a spline for the esophagus
    function generateControlSphere() {
        let geometry = new THREE.SphereBufferGeometry(10, 32, 16);
        let material = new THREE.LineBasicMaterial({color: 'white'});
        controlSphere = new THREE.Mesh(geometry, material);
        controlSphere.name = 'control_sphere';

        controlSphere.layers.set(mainCamLayer);
        scene.add(controlSphere);
        localControlSphereList.push(controlSphere);
    }

    function generateSpline() {
        let splinePoints = [];

        if (localControlSphereList.length <= 1) {
            console.log(`more spheres required`);
        }
        else {
            scene.remove(scene.getObjectByName('splinePath'));

            for (let i = 0; i < localControlSphereList.length; i++) {
                let xPos = localControlSphereList[i].position.x;
                let yPos = localControlSphereList[i].position.y;
                let zPos = localControlSphereList[i].position.z;
                splinePoints.push(new THREE.Vector3(xPos, yPos, zPos));
            }

            path = new THREE.CatmullRomCurve3(splinePoints);
            path.curveType = 'catmullrom';
            path.tension = 0.25;

            // scale the number of points between controls
            pointCount = localControlSphereList.length * numPathPoints;

            points = path.getPoints(pointCount);
            let curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
            let curveMaterial = new THREE.LineBasicMaterial({
                color: 'white',
            });

            splineObject = new THREE.Line(curveGeometry, curveMaterial);
            splineObject.name = 'splinePath';
            
            splineObject.layers.set(mainCamLayer);

            scene.add(splineObject);
        }
    }

    async function saveControlSpherePosition() {
        // take the current local control spheres and update the entry on firebase with their positions
        if (path) {
            // convert our array of control sphere positions back into an object to be saved to firebase
            let toControlSphereObj = {};

            localControlSphereList.forEach((controlSphereVec, i) => {
                let positionObj = {};
                positionObj = Object.assign({x: controlSphereVec.position.x, y: controlSphereVec.position.y, z: controlSphereVec.position.z})

                toControlSphereObj[i] = positionObj;
            })

            // write new data to firebase
            let docName = $modelPath;
            docName = docName.slice(0, -4);
            let docRef = doc(db, 'modelDb', docName);

            await updateDoc(docRef, {
                controlSpheres: toControlSphereObj,
            })

        } else {
            console.log('cannot save path: no path in scene');
        }
    }

    // rotate the probe head along a generated path
    // where the path is the esophagus
    // rotates so the forward (z) vector is pointed to the tangent at the point in the path
    // so that the ultrasound clipping plane (xy) is perpendicular to the path
    function rotateAlongCurve(path) {
        let t = positionAlongPath / pointCount;
        let tangent = path.getTangent(t);

        let dir = tangent.normalize();

        // // temp -- assume tha the heart's apex is always towards the -z-axis
        // let absZ = Math.abs(dir.z) * -1;

        // let absLookAtVector = new THREE.Vector3(dir.x, dir.y, absZ);

        // apply some huge multiplier to the tangent point so it points outwards into space
        ultrasoundGroup.lookAt(dir.multiplyScalar(1000));
        // prevent camera flipping
        ultrasoundGroup.up = new THREE.Vector3(0, 1, 0);
    }
    // -----------------END ULTRASOUND MODE HELPER FUNCTIONS-----------------

    // -----------------START ULTRASOUND PROBE FUNCTIONS-----------------
    function spawnUltrasoundProbe() {
        let geometry = new THREE.BoxBufferGeometry(15, 10, 25);
        let material = modelMat(0x121212);

        ultrasoundProbeHead = new THREE.Mesh(geometry, material);
        ultrasoundProbeHead.layers.set(mainCamLayer);

        scene.add(ultrasoundProbeHead);
    }

    // change this to position the ultrasound FOV higher or lower on the screen
    let ultrasoundCamOffset = -100;
    function spawnUltrasoundBeam() {
        ultrasoundCamPivot = new THREE.Group();
        let beamGeom = new THREE.CircleBufferGeometry(175, 32, Math.PI/4, Math.PI/2);
        let beamMat = new THREE.MeshBasicMaterial({
            color: 0x00acac,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
        });
        beamMesh = new THREE.Mesh(beamGeom, beamMat);

        // set slight offset so it doesn't intersect the clipped surface mesh 
        beamMesh.position.z = -0.3;
        beamMesh.layers.set(mainCamLayer);

        // handles appearance of clipped meshes w/shaders
        initStencilMaterials();
        
        frontFaceStencilMat.clippingPlanes = [clippingPlane];
        backFaceStencilMat.clippingPlanes = [clippingPlane];

        // mesh to cover the clipped faces
        let planeGeom = new THREE.PlaneBufferGeometry();
        planeMesh = new THREE.Mesh(planeGeom, planeStencilMat);
        
        planeMesh.onAfterRender = function (renderer) {
            renderer.clearStencil();
        }
        
        planeMesh.scale.setScalar(500);
        planeMesh.renderOrder = 1;

        // orthogragphic camera settings to create ultrasound 'image'
        let ultrasoundCamLeft = - frustumSize * aspect / 4;
        let ultrasoundCamRight = -ultrasoundCamLeft;

        // i think this works?
        // take the amount of screen space that the ultrasound cam will take up (here, 40%)
        // and multiply the divisor found in ultrasoundCamLeft
        // to keep proper aspect ratio for the orthocam
        let ultrasoundCamTop = frustumSize / (4 * screenSplit);
        let ultrasoundCamBottom = -ultrasoundCamTop;
        
        ultrasoundCamera = new THREE.OrthographicCamera(
            ultrasoundCamLeft, 
            ultrasoundCamRight, 
            ultrasoundCamTop, 
            ultrasoundCamBottom, 
            -1, 
            300
        );
        
        ultrasoundCamera.layers.enable(ultrasoundCamLayer);
        ultrasoundCamera.layers.enable(ultrasoundOverlayLayer);

        ultrasoundCamPivot.add(ultrasoundCamera);
        ultrasoundCamPivot.add(planeMesh);
        ultrasoundCamPivot.add(beamMesh);
        
        scene.add(ultrasoundCamPivot);

        // to control where the clippingPlane is created,
        // we build the plane from 3 co-planar points
        // these points move with the ultrasoundCamPivot
        // and as the points are transformed, so is the clippingPlane
        let pointGeom = new THREE.SphereBufferGeometry(5, 32, 16);
        let pointMat = new THREE.MeshBasicMaterial({color: 'green'});
        
        pointA = new THREE.Mesh(pointGeom, pointMat);
        pointA.position.x = 0;
        pointA.position.y = 0;
        pointA.position.z = 0;
        pointA.layers.set(hiddenLayer);

        pointB = new THREE.Mesh(pointGeom, pointMat);
        pointB.position.x = 1;
        pointB.position.y = 0;
        pointB.position.z = 0;
        pointB.layers.set(hiddenLayer);
        
        pointC = new THREE.Mesh(pointGeom, pointMat);
        pointC.position.x = 0;
        pointC.position.y = 1;
        pointC.position.z = 0;
        pointC.layers.set(hiddenLayer);

        ultrasoundCamPivot.add(pointA);
        ultrasoundCamPivot.add(pointB);
        ultrasoundCamPivot.add(pointC);

        // order matters!
        // this fuction gets called AFTER:
        // (1) clippingPlane is added to the scene
        // (2) co-planar points are added to ultrasoundCamPivot to get its transforms
        matchCoPlanar(pointA, pointB, pointC);

        let circleMarkerRadius = 5;
        let circleMarkerGeom = new THREE.CircleGeometry(circleMarkerRadius, 32);
        let circleMarkerMat = new THREE.MeshBasicMaterial({
            color: 0x00acac,
            side: THREE.DoubleSide,
        })

        circleMarker = new THREE.Mesh(circleMarkerGeom, circleMarkerMat);
        
        circleMarker.translateY(circleMarkerRadius);
        circleMarker.translateX(-30);

        // must be above 0 to be on top of the ultrasoundOverlay geometry
        circleMarker.translateZ(0.3);
        circleMarker.layers.set(hiddenLayer);

        ultrasoundCamPivot.add(circleMarker)

        ultrasoundCamPivot.rotateY(-Math.PI);
        ultrasoundCamera.rotateZ(Math.PI);
        ultrasoundCamera.translateY(ultrasoundCamOffset);
    }

    function spawnUltrasoundOverlay() {
        let overlayHeight = 150;
        // this has to be greater than the height
        let overlayBuffer = overlayHeight + 250;

        let overlayShapeRectangle = new THREE.Shape()
            .moveTo(overlayHeight, overlayHeight)
            .lineTo(overlayHeight, overlayBuffer)
            .lineTo(-overlayHeight, overlayBuffer)
            .lineTo(-overlayHeight, overlayHeight)
            .lineTo(overlayHeight, overlayHeight);

        let overlayShapeLeft = new THREE.Shape()
            .moveTo(0, overlayHeight)
            .lineTo(overlayHeight, 0)
            .lineTo(overlayHeight, overlayHeight)
            .lineTo(0, overlayHeight);
        
        let overlayShapeRight = new THREE.Shape()
            .moveTo(0, overlayHeight)
            .lineTo(-overlayHeight, 0)
            .lineTo(-overlayHeight, overlayHeight)
            .lineTo(0, overlayHeight);
        
        let overlayExtrudeSettings = {
            depth: 1,
            steps: 1,
        };

        // these require a small offset to render properly on the ultrasound cam
        let overlayEdgePoints = [
            new THREE.Vector3(-(overlayHeight -0.5), 0, 0),
            new THREE.Vector3(0, (overlayHeight -0.5), 0),
            new THREE.Vector3((overlayHeight -0.5), 0, 0),
        ];

        let overlayRectangleGeometry = new THREE.ExtrudeBufferGeometry(overlayShapeRectangle, overlayExtrudeSettings);
        let overlayLeftGeometry = new THREE.ExtrudeBufferGeometry(overlayShapeLeft, overlayExtrudeSettings);
        let overlayRightGeometry = new THREE.ExtrudeBufferGeometry(overlayShapeRight, overlayExtrudeSettings);
        let overlayEdgeGeometry = new THREE.BufferGeometry().setFromPoints(overlayEdgePoints);
        
        let overlayMat = new THREE.MeshBasicMaterial({
            color: 'black',
        });

        let overlayEdgeGeometryMat = new THREE.LineBasicMaterial({
            color: 'white',
        });
        
        let overlayMeshRectangle = new THREE.Mesh(overlayRectangleGeometry, overlayMat);
        let overlayMeshLeft = new THREE.Mesh(overlayLeftGeometry, overlayMat);
        let overlayMeshRight = new THREE.Mesh(overlayRightGeometry, overlayMat);
        
        let overlayEdge = new THREE.Line(overlayEdgeGeometry, overlayEdgeGeometryMat);

        ultrasoundOverlay = new THREE.Group();
        ultrasoundOverlay.add(overlayMeshLeft, overlayMeshRight, overlayMeshRectangle, overlayEdge);

        ultrasoundOverlay.rotateX(Math.PI);

        // huh?
        // honestly i have no idea why this is working?
        ultrasoundOverlay.translateY(-ultrasoundCamera.position.y - (-ultrasoundCamOffset/2));

        // so the beam mesh always follows the ultrasound overlay's position
        beamMesh.position.y = ultrasoundOverlay.position.y - overlayHeight;

        scene.add(ultrasoundOverlay);
    }

    // instructions for circle from:
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_shapes.html
    // only spawns when:
    // (1) on init() if a path exists
    // (2) we switch into U/S mode (if a tube hasn't been created yet)
    // this is really laggy to spawn...
    function spawnUltrasoundTube() {
        let radius = 3;
        let tubeShape = new THREE.Shape();

        tubeShape.moveTo(0, radius)
        .quadraticCurveTo( radius, radius, radius, 0 )
        .quadraticCurveTo( radius, - radius, 0, - radius )
        .quadraticCurveTo( - radius, - radius, - radius, 0 )
        .quadraticCurveTo( - radius, radius, 0, radius );
        
        let extrudeSettings = {
            steps: pointCount/5,
            depth: 1,
            bevelEnabled: false,
            extrudePath: path,
        };
        
        let geometry = new THREE.ExtrudeBufferGeometry(tubeShape, extrudeSettings);
        let mat = new THREE.MeshStandardMaterial({
            color: 0x3d3d3d,
            clippingPlanes: [tubeClippingPlane],
        })
        
        ultrasoundTube = new THREE.Mesh(geometry, mat);
        ultrasoundTube.layers.set(mainCamLayer);

        scene.add(ultrasoundTube);
    }
    // -----------------END ULTRASOUND PROBE FUNCTIONS-----------------

    // -----------------START MOUSE EVENT HELPER FUNCTIONS-----------------
    function handleMouseClick() {
        let e = window.event;

        if (teeMouseControls.isLocked) {
            xTeeControlClick(e.button);
        }
    }

    function handleMouseMove() {
        // when tee mouse controls are on, prevent scene rotation
        // allow for mouse movements to track to probe movements
        if (teeMouseControls.isLocked) {
            let e = window.event;

            mouse.y = e.movementY;
            mouse.x = e.movementX;

            xTeeControlMove(mouse.x, mouse.y);
        }
    }

    function handleMouseUp() {
        if (teeMouseControls.isLocked) {
            clearInterval(mouseOmniInterval);
        }
    }
    // -----------------END HMOUSE EVENT HELPER FUNCTIONS-----------------

    // -----------------START MODE SWITCH FUNCTIONS-----------------
    function handleEditMode(isOn) {
        let layer;

        let modeSwitchButtonDiv = document.getElementById('mode-switch-ui');
        modeSwitchButtonDiv.hidden = isOn;

        if (isOn) {
            layer = mainCamLayer;
        } else {
            layer = hiddenLayer;
        }
        
        if (localControlSphereList.length > 0) {
            localControlSphereList.forEach(sphere => {
                sphere.layers.set(layer);
            });            
        }

        if (splineObject) {
            splineObject.layers.set(layer);
        }

        // remove instances of the ultrasound tube
        // since it won't regenerate on the fly when the path is updated
        // WATCH THIS!! MIGHT BE CAUSING A MEMORY LEAK!!
        // if (ultrasoundTube) {
        //     scene.remove(ultrasoundTube);
        //     ultrasoundTube.geometry.dispose();
        //     ultrasoundTube.material.dispose();

        //     // clear references to the tube for garbage collection
        //     ultrasoundTube = undefined;
        // } else {
        //     if (localControlSphereList.length > 0) {
        //         spawnUltrasoundTube();
        //         ultrasoundTube.layers.set(layer);
        //         console.log('regenerating ultrasound tube');
        //     }
        // }

        // remove existing transform controls in the scene before adding a new one
        scene.children.forEach(element => {
            if (element.name == 'transform_controls') {
                element.detach();
                element.dispose();
            }
        })
    }

    function handleTeeMode(isOn) {
        camera.updateProjectionMatrix();

        splitView = isOn;
        modeParams.activate_ultrasound = isOn;

        if (septalDefectParts.length > 0) {
            septalDefectFolder.close()
        }

        // deal with the UI
        bookmarkUiHidden = !isOn;
        controlUiHidden = !isOn;
        omniplaneReadoutHidden = !isOn;
        descriptionBoxShow.set(false);
        decsriptionBoxHeight.set('15%');
        
        // deal with annotations
        modelControlParams.annotations_hidden = isOn;
        annotationDisplay.enable(!isOn);
        toggleAllAnnotations(true);

        // deal with the gui slider controls
        controlOptions.forEach(option => {
            option.enable(isOn);
        })

        // deal with the scene clipping planes
        clippingPlaneOptions.forEach(option => {
            option.enable(false);
        })

        displayClippingPlanes(axClippingPlane, false);
        displayClippingPlanes(sagClippingPlane, false);
        displayClippingPlanes(corClippingPlane, false);

        modelControlParams.toggle_ax_clipping = false;
        modelControlParams.toggle_sag_clipping = false;
        modelControlParams.toggle_cor_clipping = false;

        axPlaneHelper.visible = false;
        sagPlaneHelper.visible = false;
        corPlaneHelper.visible = false;
        
        clippingPlaneFolder.close();

        if (isOn) {
            helpBox.set(true);
            controlFolder.open();
            navBarSize.set('navbar-ultrasound');
            viewWidth.set('half');
            keyboardControls(true);

            if (isAdmin) {
                adminFolder.close()
                toggleEditing.enable(false);
            }

        } else {
            controlFolder.close();
            navBarSize.set('navbar-viewer');
            viewWidth.set('full');
            keyboardControls(false);

            clippingPlaneOptions[0].enable(true);
            clippingPlaneOptions[1].enable(true);
            clippingPlaneOptions[2].enable(true);
            
            if (isAdmin) {
                adminFolder.open();
                toggleEditing.enable(true);
            }
        }

        // if (!ultrasoundTube) {
        //     spawnUltrasoundTube();
        // }
        
        // default to hiding the non-clippable myocardium when switching modes
        // to keep it simple
        // 0: visible, 1: wireframe, 2: hidden
        displayNoClipMyocardium(2);

        let layer;

        if (isOn) {
            layer = mainCamLayer;
            myocardium.material.clippingPlanes = [clippingPlane];

            // 0: visible, 1: wireframe, 2: hidden
            displayModelParts(2);

            // leave these two here
            // these two must be set to the ultrasoundCamLayer when ultrasound is on
            frontMesh.layers.set(ultrasoundCamLayer);
            backMesh.layers.set(ultrasoundCamLayer);
            
            // remove existing transform controls in the scene when entering ultrasound mode
            scene.children.forEach(element => {
                if (element.name == 'transform_controls') {
                    element.detach();
                }
            })
            
            localControlSphereList.forEach(sphere => {
                sphere.layers.set(hiddenLayer);
            });

            // the ultrasound overlay contains two elements:
            // extruded shapes for the overlay shape(two triangles and one rectangle)
            // and two lines to highlight the edges of the ultrasound beam
            // these elements go on two different layers -- the lines are visible by the main cam and the ultrasound cam
            // the overlay shapes are just to the ultrasound layer
            ultrasoundOverlay.children.forEach(element => {
                if (element.type == 'Line') {
                    element.layers.set(ultrasoundCamLayer);
                } else {
                    element.layers.set(ultrasoundOverlayLayer);
                }
            });

            if (path) {
                ultrasoundGroup.position.x = points[positionAlongPath].x;
                ultrasoundGroup.position.y = points[positionAlongPath].y;
                ultrasoundGroup.position.z = points[positionAlongPath].z;
                rotateAlongCurve(path);
                matchCoPlanar(pointA, pointB, pointC);
            }

            // circleMarker is technically part of the ultrasound beam, but it has to be visible to the main cam and the ultrasound cam
            circleMarker.layers.set(0);
        } else {
            layer = hiddenLayer;
            myocardium.material.clippingPlanes = [];
            
            // 0: visible, 1: wireframe, 2: hidden
            displayModelParts(0);

            // leave these two here
            // these two must be set to the hidden layer when ultrasound is off
            frontMesh.layers.set(hiddenLayer);
            backMesh.layers.set(hiddenLayer);

            ultrasoundOverlay.children.forEach(element => {
                element.layers.set(hiddenLayer);
            });

            circleMarker.layers.set(hiddenLayer);
        }

        myocardium.layers.set(layer);
        ultrasoundGroup.layers.set(layer);
        ultrasoundProbeHead.layers.set(layer);
        ultrasoundCamPivot.layers.set(layer);
        beamMesh.layers.set(layer);

        // if (ultrasoundTube) {
        //     ultrasoundTube.layers.set(layer);
        // }
    }

    function handleInputControl(controlType) {
        keyboardControls(true);

        if (controlType != 'keyboard') {
            controlParams.xtee();   
        }
    }
    // -----------------END MODE SWITCH FUNCTIONS-----------------

    // -----------------START DISPLAY AND UI HELPER FUNCTIONS----------------- 
    function displayModelParts(viewState) {
        modelParts.forEach(part => {
            if (viewState == 0) {
                part.material.wireframe = false;
                part.layers.set(mainCamLayer);
            } else if(viewState == 1) {
                part.material.wireframe = true;
                part.layers.set(mainCamLayer);
            } else {
                part.layers.set(hiddenLayer);    
            }
        })

        modelControlParams.toggle_all_models = viewState;

        for (let property in partListObject) {
            partListObject[property] = viewState;
        }
    }

    // this is redundant and only a special case -- to be re-written later
    function displaySeptalDefectParts(viewState) {
        septalDefectParts.forEach(part => {
            if (viewState == 0) {
                part.material.wireframe = false;
                part.layers.set(mainCamLayer);
            } else if(viewState == 1) {
                part.material.wireframe = true;
                part.layers.set(mainCamLayer);
            } else {
                part.layers.set(hiddenLayer);    
            }
        })

        modelControlParams.toggle_all_septal_models = viewState;

        for (let property in septalDefectListObject) {
            septalDefectListObject[property] = viewState;
        }
    }

    function displayNoClipMyocardium(viewState) {
        if (viewState == 0) {
            myocardiumNoClip.material.wireframe = false;
            myocardiumNoClip.layers.set(mainCamLayer);
        } else if (viewState == 1) {
            myocardiumNoClip.material.wireframe = true;
            myocardiumNoClip.layers.set(mainCamLayer);
        } else {
            myocardiumNoClip.layers.set(hiddenLayer);
        }

        modelControlParams.toggle_myocardium = viewState;
    }

    function displayClippingPlanes(plane, isOn) {
        if (isOn) {
            sceneClippingPlanes.push(plane);
        } else {
            let planeIndex = sceneClippingPlanes.indexOf(plane);
            sceneClippingPlanes.splice(planeIndex, 1);
        }
    }

    onMount(async function () {
        viewCubeScene = new THREE.Scene();

        let viewCubeElement = document.getElementById('view-cube-container');

        viewCubeRenderer = new THREE.WebGLRenderer( {
            alpha: true
        });

        viewCubeRenderer.setSize(viewCubeElement.offsetWidth, viewCubeElement.offsetHeight);
        viewCubeRenderer.setPixelRatio(window.devicePixelRatio);

        viewCubeRenderer.setClearColor(0x000000, 0);
        viewCubeRenderer.autoClear = false;

        viewCubeCamera = new THREE.PerspectiveCamera(75, viewCubeElement.offsetWidth / viewCubeElement.offsetHeight, 0.1, 100);

        viewCubeElement.appendChild(viewCubeRenderer.domElement);

        loader.load(
            '/gltf/human_view_cube.glb',
            function(gltf) {
                viewCubeScene.add(gltf.scene);

                gltf.scene.children.forEach(object => {
                    object.material = modelMat(0xedebd8);

                    let scale = 0.5;

                    object.scale.x = scale;
                    object.scale.y = scale;
                    object.scale.z = scale;
                    object.rotateY(Math.PI);
                })
            }
        )

        let ambientLight = new THREE.AmbientLight('white', 0.35);
        viewCubeScene.add(ambientLight);

        let spotLightOne = new THREE.SpotLight('white', 0.6);
        spotLightOne.position.set(100, 500, 100);
        viewCubeScene.add(spotLightOne);

        let spotLightTwo = new THREE.SpotLight('white', 0.6);
        spotLightTwo.position.set(-100, 500, 100);
        viewCubeScene.add(spotLightTwo);

        let spotLightThree = new THREE.SpotLight('white', 0.6);
        spotLightThree.position.set(0, 500, -100);
        viewCubeScene.add(spotLightThree);

        let spotLightFour = new THREE.SpotLight('white', 0.6);
        spotLightFour.position.set(0, -200, -100);
        viewCubeScene.add(spotLightFour);

        viewCubeReady = true;
    })

    // folder contents change if model is or is not heart
    // call it outside the main GUI function AFTER all models have been loaded
    // so it doesn't have to be async
    // only call this once in modelParser()
    let clippingPlaneOptions
    function addModelControlFolder() {
        // deals with model and model annotation visibility
        modelControlFolder = gui.addFolder('Model Control');
        
        annotationDisplay = modelControlFolder.add(modelControlParams, 'annotations_hidden', modelControlParams.annotations_hidden).name('Hide Annotations').enable(true).onChange(v => {
            modelControlParams.annotations_hidden = v;
        }).listen();

        let modelGroupName = 'All Models Visible';
        let modelVisibilityOptions = {'Visible': 0, 'Wireframe': 1, 'Hidden': 2}

        if ($modelType.toLowerCase() == 'heart') {
            modelControlFolder.add(modelControlParams, 'toggle_myocardium', modelVisibilityOptions).name('Full Myocardium').onChange(v => {
                displayNoClipMyocardium(v);
            }).listen();

            modelGroupName = 'Full Blood Volume';
        }

        modelControlFolder.add(modelControlParams, 'toggle_all_models', modelVisibilityOptions).name(modelGroupName).onChange(v => {            
            displayModelParts(v);
        }).listen();

        modelParts.forEach(part => {
            let partName = `${part.name}_toggle`;

            partListObject[partName] = 0;

            modelControlFolder.add(partListObject, partName, modelVisibilityOptions).name(`${part.name}`).onChange(v => {
                if (v == 0) {
                    part.material.wireframe = false;
                    part.layers.set(mainCamLayer);
                } else if(v == 1) {
                    part.material.wireframe = true;
                    part.layers.set(mainCamLayer);
                } else {
                    part.layers.set(hiddenLayer);
                }
            }).listen();
        })

        // special case -- this is terrible re-write this.
        if ($modelId == '20220207') {
            if (septalDefectParts.length > 0) {
                septalDefectFolder = modelControlFolder.addFolder('Septal Defects');

                septalDefectFolder.close();

                septalDefectFolder.add(modelControlParams, 'toggle_all_septal_models', modelVisibilityOptions).name('All Septal Defects').onChange(v => {            
                    displaySeptalDefectParts(v);
                }).listen();

                septalDefectParts.forEach(part => {
                    let partName = `${part.name}_toggle`;
    
                    septalDefectListObject[partName] = 2;
    
                    septalDefectFolder.add(septalDefectListObject, partName, modelVisibilityOptions).name(`${part.name}`).onChange(v => {
                        if (v == 0) {
                            part.material.wireframe = false;
                            part.layers.set(mainCamLayer);
                        } else if(v == 1) {
                            part.material.wireframe = true;
                            part.layers.set(mainCamLayer);
                        } else {
                            part.layers.set(hiddenLayer);
                        }
                    }).listen();
                })
            }
        }

        clippingPlaneFolder = gui.addFolder('Clipping Plane Control');

        let toggelAxPlane = clippingPlaneFolder.add(modelControlParams, 'toggle_ax_clipping', false).name('Enable Axial Clipping').enable(true).onChange(v => {
            axPlaneHelper.visible = v;
            moveAxPlane.enable(v);
            axPlaneNegate.enable(v);

            displayClippingPlanes(axClippingPlane, v);
        }).listen();

        let toggelSagPlane = clippingPlaneFolder.add(modelControlParams, 'toggle_sag_clipping', false).name('Enable Sagittal Clipping').enable(true).onChange(v => {
            sagPlaneHelper.visible = v;
            moveSagPlane.enable(v);
            sagPlaneNegate.enable(v);

            displayClippingPlanes(sagClippingPlane, v);
        }).listen();

        let toggelCorPlane = clippingPlaneFolder.add(modelControlParams, 'toggle_cor_clipping', false).name('Enable Coronal Clipping').enable(true).onChange(v => {
            corPlaneHelper.visible = v;
            moveCorPlane.enable(v);
            corPlaneNegate.enable(v);

            displayClippingPlanes(corClippingPlane, v);
        }).listen();

        let axMax = 200
        let sagMax = 200;
        let corMax = 200;

        let moveAxPlane = clippingPlaneFolder.add(modelControlParams, 'ax_pos', -axMax, axMax, 1).name('Axial Clipping Plane').enable(false).onChange(v => {
            if (modelControlParams.ax_negate) {
                axClippingPlane.constant = -v;
            } else {
                axClippingPlane.constant = v;
            }
        }).listen();
        
        let moveSagPlane = clippingPlaneFolder.add(modelControlParams, 'sag_pos', -sagMax, sagMax, 1).name('Sagittal Clipping Plane').enable(false).onChange(v => {
            if (modelControlParams.sag_negate) {
                sagClippingPlane.constant = -v;
            } else {
                sagClippingPlane.constant = v;
            }
        }).listen();

        let moveCorPlane = clippingPlaneFolder.add(modelControlParams, 'cor_pos', -corMax, corMax, 1).name('Coronal Clipping Plane').enable(false).onChange(v => {
            if (modelControlParams.cor_negate) {
                corClippingPlane.constant = -v;
            } else {
                corClippingPlane.constant = v;
            }
        }).listen();
        
        let axPlaneNegate = clippingPlaneFolder.add(modelControlParams, 'ax_negate', false).name('Flip Axial Clipping Direction').enable(false).onChange(v => {
            modelControlParams.ax_negate = v;
            axClippingPlane.negate();
        })

        let sagPlaneNegate = clippingPlaneFolder.add(modelControlParams, 'sag_negate', false).name('Flip Sagittal Clipping Direction').enable(false).onChange(v => {
            modelControlParams.sag_negate = v;
            sagClippingPlane.negate();
        })

        let corPlaneNegate = clippingPlaneFolder.add(modelControlParams, 'cor_negate', false).name('Flip Coronal Clipping Direction').enable(false).onChange(v => {
            modelControlParams.cor_negate = v;
            corClippingPlane.negate();
        })

        clippingPlaneOptions = [
            toggelAxPlane,
            toggelSagPlane,
            toggelCorPlane,
            moveAxPlane, 
            moveSagPlane, 
            moveCorPlane,
            axPlaneNegate,
            sagPlaneNegate,
            corPlaneNegate,
        ];

        clippingPlaneFolder.close();
    }

    function openInputPopup(type, label, confirmFunction) {
        popupInputUiHidden = false;

        popupType = type;
        popupLabel = label;
        popupCancelFunction = closeInputPopup;
        popupConfirmOptions = confirmFunction;

        if (modeParams.activate_ultrasound) {
            keyboardControls(false);
        }
    }

    function closeInputPopup() {
        popupInputUiHidden = true;

        if (modeParams.activate_ultrasound) {
            keyboardControls(true);

            if (wasInXteeMode) {
                controlParams.xtee();
            }

        } else {
            modelControlParams.annotations_hidden = false;
        }
    }

    let controlOptions;
    let toggleEditing;
    function handleGUI() {
        gui.title('Model Viewer');

        // deals with all probe control options
        controlFolder = gui.addFolder('TEE Probe Controls');
        controlFolder.close();

        // default initial mode is just the view, no ultrasound
        // set all of these off and the folder to closed
        let anteflexControl = controlFolder.add(controlParams, 'anteflex', ultrasoundStartMaxValues.anteflexMin, ultrasoundStartMaxValues.anteflexMax, 1).name('Retroflex/Anteflex').enable(false).onChange(v => {
            probeControls.anteflex(v);
        }).listen();

        let rightLeftFlexControl = controlFolder.add(controlParams, 'rightLeftFlex', ultrasoundStartMaxValues.rightLeftFlexMin, ultrasoundStartMaxValues.rightLeftFlexMax, 1).name('Left/Right Lat. Flex').enable(false).onChange(v => {
            probeControls.rightLeftFlex(v);
        }).listen();

        let twistControl = controlFolder.add(controlParams, 'twist', ultrasoundStartMaxValues.twistMin, ultrasoundStartMaxValues.twistMax, 1).name('Left/Right Rotation').enable(false).onChange(v => {
            probeControls.twist(v);
        }).listen();     

        let omniplaneControl = controlFolder.add(controlParams, 'omniplane', ultrasoundStartMaxValues.omniplaneMin, ultrasoundStartMaxValues.omniplaneMax, 1.).name('Omniplane Rotation').enable(false).onChange(v => {
            probeControls.omniplane(v);
        }).listen();

        // where 0 = 0% of the path and 100 = 100% of the path
        let advanceControl = controlFolder.add(controlParams, 'advance', 0, 100, 1).name('Advance/Retract').enable(false).onChange(v => {
            probeControls.advance(v);
        }).listen();

        let resetControl = controlFolder.add(controlParams, 'reset').name('Reset Probe').enable(false);

        controlOptions = [
            anteflexControl,
            rightLeftFlexControl,
            twistControl,
            omniplaneControl,
            advanceControl,
            resetControl,
        ];

        // keep variables affected by ultrasound mode on/off out of local scope of isAdmin if block
        if (isAdmin) {
            adminFolder = gui.addFolder('Admin Functions');

            toggleEditing = adminFolder.add(adminParams, 'toggle_editing').name('Edit Scene').onChange(v => {
                handleEditMode(v);

                adminOptions.forEach(option => {
                    option.enable(v);
                })
            }).listen();

            let addControlSphere = adminFolder.add(adminParams, 'add_control_sphere').name('Add Spline Control').enable(false);
            let saveControlSpherePos = adminFolder.add(adminParams, 'save_sphere_position').name('Save Path').enable(false);

            let adminOptions = [
                addControlSphere,
                saveControlSpherePos,
            ]
        }
    }
    // -----------------END DISPLAY AND UI HELPER FUNCTIONS-----------------

    // -----------------START MATERIALS-----------------
    function modelMat(color) {
        let material = new THREE.MeshStandardMaterial({
            color: color,
            side: THREE.DoubleSide,
        })

        return material;
    }

    // from https://jsfiddle.net/g6znr8cv/
    // because fuck dealing with the stencil buffer
    function initStencilMaterials() {
        // PASS 1
        // everywhere that the back faces are visible (clipped region) the stencil
        // buffer is incremented by 1.
        backFaceStencilMat = new THREE.MeshBasicMaterial();
        backFaceStencilMat.depthWrite = false;
        backFaceStencilMat.depthTest = false;
        backFaceStencilMat.colorWrite = false;
        backFaceStencilMat.stencilWrite = true;
        backFaceStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
        backFaceStencilMat.side = THREE.BackSide;
        backFaceStencilMat.stencilFail = THREE.IncrementWrapStencilOp;
        backFaceStencilMat.stencilZFail = THREE.IncrementWrapStencilOp;
        backFaceStencilMat.stencilZPass = THREE.IncrementWrapStencilOp;

        // PASS 2
        // everywhere that the front faces are visible the stencil
        // buffer is decremented back to 0.
        frontFaceStencilMat = new THREE.MeshBasicMaterial();
        frontFaceStencilMat.depthWrite = false;
        frontFaceStencilMat.depthTest = false;
        frontFaceStencilMat.colorWrite = false;
        frontFaceStencilMat.stencilWrite = true;
        frontFaceStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
        frontFaceStencilMat.side = THREE.FrontSide;
        frontFaceStencilMat.stencilFail = THREE.DecrementWrapStencilOp;
        frontFaceStencilMat.stencilZFail = THREE.DecrementWrapStencilOp;
        frontFaceStencilMat.stencilZPass = THREE.DecrementWrapStencilOp;

        // PASS 3
        // draw the plane everywhere that the stencil buffer != 0, which will
        // only be in the clipped region where back faces are visible.
        planeStencilMat = new THREE.MeshBasicMaterial({color: 'white'});
        planeStencilMat.stencilWrite = true;
        planeStencilMat.stencilRef = 0;
        planeStencilMat.stencilFunc = THREE.NotEqualStencilFunc;
        planeStencilMat.stencilFail = THREE.ReplaceStencilOp;
        planeStencilMat.stencilZFail = THREE.ReplaceStencilOp;
        planeStencilMat.stencilZPass = THREE.ReplaceStencilOp;
    }
    // -----------------END MATERIALS-----------------

    function init() {
        scene = new THREE.Scene();
        
        keyboardControls(false);

        // initialize clipping planes for the scene
        // for ultrasound
        clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
        // for the ultrasound tube
        tubeClippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        // for the axial, coronal, saggital planes
        axClippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), modelControlParams.ax_pos);
        sagClippingPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), modelControlParams.sag_pos);
        corClippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), modelControlParams.cor_pos);

        // by default the models in the scene are not clipped by anything
        sceneClippingPlanes = [];

        axPlaneHelper = new THREE.PlaneHelper(axClippingPlane, 350, 'red' );
        sagPlaneHelper = new THREE.PlaneHelper(sagClippingPlane, 350, 'blue' );
        corPlaneHelper = new THREE.PlaneHelper(corClippingPlane, 350, 'green' );

        axPlaneHelper.visible = false;
        sagPlaneHelper.visible = false;
        corPlaneHelper.visible = false;

        scene.add(axPlaneHelper);
        scene.add(sagPlaneHelper);
        scene.add(corPlaneHelper);

        // CAMERAS
        spawnCameras();
        
        // LOADER: gltf w/draco compression
        loader = new GLTFLoader();
        dracoLoader = new DRACOLoader();

        // in public folder
        dracoLoader.setDecoderPath('/draco/gltf/');
        loader.setDRACOLoader(dracoLoader);

        // FIREBASE STUFF
        modelParser($modelPath).catch(err => {
            console.log(`something went wrong loading the model: ${err}`);
        });

        // ULTRASOUND TEE PROBE ASSEMBLY
        // probe has the following components:
        // (1) ultrasound probe head which gets ante/retroflexed and flexed left/right
        // (2) ultrasound beam (the clipping plane and the ortho camera) which gets rotated
        // (1) and (2) are then assembled in the probe group which moves along the
        // generated esophagus spline.  The group is what gets the advance/retract and twisting movements
        spawnUltrasoundProbe();
        spawnUltrasoundBeam();
        spawnUltrasoundOverlay();

        ultrasoundGroup = new THREE.Group();

        ultrasoundGroup.position.y = ultrasoundCamHeight;

        ultrasoundCamPivot.add(ultrasoundOverlay);
        ultrasoundProbeHead.add(ultrasoundCamPivot);
        ultrasoundGroup.add(ultrasoundProbeHead);

        // expectation is ultrasound is not on by default -- hde these
        ultrasoundOverlay.children.forEach(element => {
            element.layers.set(hiddenLayer);
        });

        ultrasoundCamPivot.layers.set(hiddenLayer);
        ultrasoundProbeHead.layers.set(hiddenLayer);
        ultrasoundGroup.layers.set(hiddenLayer);
        beamMesh.layers.set(hiddenLayer);

        scene.add(ultrasoundGroup);

        // RENDERER
        renderer = new THREE.WebGLRenderer();
        renderer.alpha = true;
        renderer.autoClear = false;
        renderer.localClippingEnabled = true;

        document.body.appendChild(renderer.domElement);
        
        // CONTROLS
        // the orbit control target gets changed from default world-zero to center of model-ish
        // inside the async modelParser since it relies on getting the model's center (if myocardium exists)
        orbitControls = new OrbitControls(camera, renderer.domElement);
        teeMouseControls = new PointerLockControls(pointerLockCam, renderer.domElement);

        // SPAWN PATH IF PATH CONTROL SPHERES HAVE BEEN PREVIOUSLY SAVED
        // convert the incoming map of control spheres from firebase to an array
        let savedControlSphereArr = Object.values($savedControlSphereList);

        if (savedControlSphereArr.length > 0) {
            for (let i = 0; i < savedControlSphereArr.length; i++) {
                generateControlSphere();
                localControlSphereList[i].position.x = savedControlSphereArr[i].x;
                localControlSphereList[i].position.y = savedControlSphereArr[i].y;
                localControlSphereList[i].position.z = savedControlSphereArr[i].z;
                localControlSphereList[i].layers.set(hiddenLayer);
            }
            
            generateSpline();
            splineObject.layers.set(hiddenLayer);
            
            // create ultrasound tube if there are control spheres for the path  and if there isn't a tube yet
            // if (!ultrasoundTube) {
            //     spawnUltrasoundTube();
            //     console.log('creating ultrasound tube');
            //     ultrasoundTube.layers.set(hiddenLayer);
            // } else {
            //     console.log('ultrasound tube exists somehow?');
            // }
        }

        // LIGHTS
        spawnLights();

        // OTHER
        handleGUI();

        window.addEventListener('resize', onWindowResize);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove, false);                
        window.addEventListener('mousedown', handleMouseClick);
        window.addEventListener('dblclick', function(e) {
            if (!splitView) {
                handleRaycast(e)
            }
        })
        document.addEventListener('wheel', function(e) {
            e.preventDefault();
            xteeControlWheel();
        }, {
            passive: false,
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
        orbitControls.update();
    }

    function onWindowResize() {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

        if (splitView) {
            camera.aspect = screenSplit * aspect;
        } else {
            camera.aspect = aspect;
        }
        
        camera.updateProjectionMatrix();            
        
        ultrasoundCamera.left = - frustumSize * aspect / 4;
        ultrasoundCamera.right = -ultrasoundCamera.left;
        ultrasoundCamera.top = frustumSize / (4 * screenSplit);
        ultrasoundCamera.bottom = -ultrasoundCamera.top;

        ultrasoundCamera.updateProjectionMatrix();
    }

    function render() {
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.setPixelRatio( window.devicePixelRatio );

        if (viewCubeReady) {
            // credit: https://github.com/bytezeroseven/GLB-Viewer/blob/master/viewer.js
            viewCubeRenderer.render(viewCubeScene, viewCubeCamera);
            viewCubeCamera.updateProjectionMatrix();

            viewCubeCamera.rotation.copy(camera.rotation);
            let dir = camera.position.clone().sub(orbitControls.target).normalize();
            viewCubeCamera.position.copy(dir.multiplyScalar(15));
        }

        if (splitView) {
            // positions the main model viewer window in split-screen
            renderer.setViewport(0, 0, SCREEN_WIDTH * screenSplit, SCREEN_HEIGHT);
            camera.aspect = SCREEN_WIDTH * screenSplit / SCREEN_HEIGHT;
            renderer.render(scene, camera);
    
            //positions the ultrasound window in split-screen
            renderer.setViewport(SCREEN_WIDTH * screenSplit, 0, SCREEN_WIDTH * screenSplit, SCREEN_HEIGHT);
            renderer.render(scene, ultrasoundCamera);
        } else {
            // positions the main model viewer window in single screen
            renderer.render(scene, camera);
            camera.aspect = aspect;
        }

        camera.updateProjectionMatrix();

        if (annotationList.length > 0 && modelControlParams.annotations_hidden == false) {
            updateAnnotationPosition();
        }
    }

    // go go go
    init();
    animate();
</script>

<div id='main'>
    <div id='view-cube-container'></div>
    <div hidden={loadingBarHidden}>
        <div id="loading-bar-ui">
            <h1>Loading model...</h1>
        </div>
    </div>
    
    <div hidden={omniplaneReadoutHidden}>
        <div id="omniplane-ui-readout"><b>{controlParams.omniplane}°</b></div>
    </div>
    
    <PopupBox 
        popupInputUiHidden={popupInputUiHidden} 
        popupLabel={popupLabel} 
        popupType={popupType} 
        popupConfirmOptions={popupConfirmOptions} 
        popupCancelFunction={popupCancelFunction} 
    />
    
    <div hidden={!bottomGuiHidden}>
        <div id="bottom-message-ui">
            {#if inputControlOptions == 'mouse'}
                <p>Press <b>"T"</b> on your keyboard or <b>middle mouse button</b> to exit <b>{inputControlOptions}</b> control mode!</p>
            {:else}
                <p>Press <b>"T"</b> on your keyboard to exit <b>{inputControlOptions}</b> control mode!</p>
            {/if}
        </div>
    </div>
    
    {#if annotationList.length > 0}
        {#each annotationList as annotation, i}
            <div hidden={modelControlParams.annotations_hidden}>
                <div id={annotation.name} on:click={() => openAnnotation(annotation.name)} hidden=false>
                    <p>{i + 1}</p>
                </div>
                <div class='annotation-content' id={annotation.name + '-content-box'} hidden=true>
                    <div id='annotation-content-box-inner'>
                        <div id='annotation-content-text-box'>
                            <p>{annotation.content}</p>
                        </div>
                        <div id='annotation-content-control-box'>
                            <div id='annotation-poster-box'>
                                <p>Poster: <b>{annotation.poster}</b></p>
                            </div>
                            <div id='annotation-close-button-box'>
                                <button on:click={() => closeAnnotation(annotation.name)}>Hide</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
    
    <div hidden={bottomGuiHidden}>
        <div id="bottom-ui">
            <div hidden={bookmarkUiHidden}>
                <div id="bookmark-ui">
                    <select name="bookmark-select" id='bookmark-ui-1' on:change={() => bookmarkMove()}>
                        <option label="Select Saved View"></option>
                        {#each $userBookmarks as bookmark, i}
                            <option value={i}>{bookmark.name}</option>
                        {/each}
                    </select>
                    <button id='bookmark-ui-2' on:click={() => openInputPopup('input', 'Name your view', [{text: 'Save', fn: saveBookmark}])}>Save View</button>
                    <button id='bookmark-ui-3' on:click={() => openInputPopup('NA', 'Are you sure you want to update this view?', [{text: 'Yes, update!', fn: updateBookmark}])}>Update View</button>
                    <button id='bookmark-ui-4' on:click={() => openInputPopup('NA', 'Are you sure you want to delete this view?', [{text: 'Yes, delete!', fn: deleteBookmark}])}>Delete View</button>
                </div>
            </div>
            <div hidden={controlUiHidden}>
                <div id="control-ui">
                    <p id='control-ui-1'><b>Select Input Method</b></p>
                    <label>
                        <input id='control-ui-2' type=radio bind:group={inputControlOptions} name="input control options" value='keyboard' on:change={handleInputControl(inputControlOptions)}>
                        Keyboard
                    </label>
                    <label>
                        <input id='control-ui-3' type=radio bind:group={inputControlOptions} name="input control options" value='mouse' on:change={handleInputControl(inputControlOptions)}>
                        Mouse
                    </label>
                    <label>
                        <input id='control-ui-4' type=radio bind:group={inputControlOptions} name="input control options" value='rod controller' on:change={handleInputControl(inputControlOptions)}>
                        Rod Controller
                    </label>
                    <label>
                        <input id='control-ui-5' type=radio bind:group={inputControlOptions} name="input control options" value='tee controller' on:change={handleInputControl(inputControlOptions)}>
                        TEE Controller
                    </label>
                </div>
            </div>
            <div id="mode-switch-ui">
                {#if localControlSphereList.length > 0 && myocardium != null && adminParams.toggle_editing == false}
                    <div id="mode-switch-ui-inner">
                        {#if modeParams.activate_ultrasound}
                            <button id="ultrasoundButton" on:click={() => handleTeeMode(false)}><b>3D View</b></button>
                        {:else}
                            <button id="ultrasoundButton" on:click={() => handleTeeMode(true)}><b>Ultrasound</b></button>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    #annotation-content-box-inner {
        background: #000000c7;
        backdrop-filter: blur(5px);
        display: grid;
        grid-template-rows: 4fr 1fr;
        row-gap: 2%;
        height: 100%;
        width: 100%;
        border: 0.1rem solid #00acac;
    }

    #annotation-content-text-box {
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    #annotation-content-control-box {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 1%;
    }

    #annotation-content-control-box button {
        width: 100%;
        height: 100%
    }

    #view-cube-container {
        position: absolute;
        z-index: 101;
        width: 225px;
        height: 400px;
        top: 7%;
        left: 1%;
    }

    #loading-bar-ui {
        background: #0000008c;
        position: absolute;
        z-index: 105;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    #omniplane-ui-readout {
        position: absolute;
        z-index: 100;
        top: 13%;
        left: 50%;
        font-size: 2rem;
    }

    #bottom-message-ui {
        right: 1%;
        /* close enough to the description box? */
        bottom: 1%;
        height: 12%;
        width: 80%;
        z-index: 102;
        position: absolute;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    #bottom-message-ui b {
        color: #00acac;
    }

    #bottom-message-ui p {
        font-size: 1.5rem;
    }

    #bottom-ui {
        right: 1%;
        /* close enough to the description box? */
        bottom: 1%;
        height: 12%;
        width: 58%;
        z-index: 102;
        position: absolute;
        display: grid;
        grid-template: 1fr 1fr 1fr;
        grid-gap: 1%;
    }

    #bookmark-ui {
        grid-column: 1;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        height: 100%;
        width: 100%;
        column-gap: 1%;
        row-gap: 5%;
    }

    #control-ui {
        background-color: #121212;
        height: 100%;
        width: 100%;
        grid-column: 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    #mode-switch-ui {
        grid-column: 3;
        margin-left: auto;
        margin-right: 0;
    }

    #mode-switch-ui-inner {
        width: 100%;
        height: 100%;
    }

    #bookmark-ui-1 {
        grid-column: 1 / 4;

        /* forces the dropdown to open upwards if # of entries forces it to touch the bottom of the screen */
        bottom: 100%;
    }

    #control-ui-1 {
        grid-column: 1 / 3;
        text-align: center;
        grid-row: 1;
    }

    #control-ui-2 {
        grid-column: 1;
        grid-row: 2;
    }

    #control-ui-3 {
        grid-column: 2;
        grid-row: 2;
    }

    #control-ui-4 {
        grid-column: 1;
        grid-row: 3;
    }

    #control-ui-5 {
        grid-column: 2;
        grid-row: 3;
    }

    #ultrasoundButton {
        width: 250px;
        height: 100%;
        border-radius: 5px;
        color: #fff;
        font-size: 1.5rem;
        background-color: #e62e2e;
        transition: background-color .1s ease-in;
        z-index: 102;
    }

    #ultrasoundButton:hover {
        background-color: #ff0000;
    }

</style>