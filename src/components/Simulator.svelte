<script>
    import * as THREE from 'three';
    import { GUI } from 'lil-gui';
    import { OrbitControls}  from 'three/examples/jsm/controls/OrbitControls';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
    import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
    import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
    import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
    import { viewWidth, descriptionBox, descriptionBoxMax, titleBoxPosition, btnBoxSize, modelPath } from '../stores.js'; 

    // -----------------START GLOBAL VARIABLES---------------
    let scene, renderer;
    let orbitControls, teeMouseControls, transformControls;
    let splitView = false;
    let loader, dracoLoader;

    // FOR USER PERMISSIONS
    // TODO: This flag will be handled by firebase if the logged in user is/is not an admin
    let isAdmin = true;

    // TODO: firestore to get anatomy type for loading necessary assets
    let modelType = 'heart';

    // TODO: POINT ME TO FIREBASE
    // assumption is the blood volume and myocardium are all in the same file
    let modelFilePath = $modelPath;

    // FOR ITEM SELECTION
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();

    // FOR MESH DATA
    let model, myocardium, myocardiumNoClip, humanViewCube;
    let modelParts = [];

    // TODO: firestore
    let annotationList = [];

    // FOR SPLINE EDITING
    let path, pointCount, points, controlSphere, splineObject;
    // stores coords of the control spheres if a path has been generated previously
    // connect this to firebase
    // temp values
    let controlSpherePostionList = [
        {
            x: 25.3,
            y: 119.74,
            z: 63.12
        },
        {
            x: 13.2,
            y: 25.00,
            z: 46.83,
        },
        {
            x: -52.74,
            y: -10.80,
            z: -70.77,
        },
    ];
    let controlSphereList = [];
    // number of points between each control sphere
    let numPathPoints = 50;
    let positionAlongPath = 0;

    // ULTRASOUND PROBE, BEAM, AND CABLE/TUBE
    let ultrasoundGroup;
    let ultrasoundProbeHead;
    let ultrasoundCamPivot;
    let ultrasoundTube;
    let ultrasoundOverlay;
    let beamMesh;

    // FOR CAMERAS
    let pointerLockCam, camera, ultrasoundCamera;
    // control this for ultrasound zoom level 
    let frustumSize = 350;
    let SCREEN_WIDTH = window.innerWidth;
    let SCREEN_HEIGHT = window.innerHeight;
    let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    let ultrasoundCamHeight = 50;

    // FOR STENCIL
    let backFaceStencilMat, frontFaceStencilMat, planeStencilMat;
    let frontMesh, backMesh, planeMesh;

    // FOR CLIPPING PLANE
    let pointA, pointB, pointC;
    let clippingPlane, tubeClippingPlane;

    // FOR OBJECT RENDERING VIA LAYERS
    // subscribing to layer 0 means every camera sees it -- just don't use it for this
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
        twistMin: -35.0,
        twistMax: 35.0,
        omniplaneMin: -180.0,
        omniplaneMax: 180.0,
    }

    // FOR GUI CONTROL PARAMETERS
    let gui = new GUI();

    let modelControlFolder;

    let modeParams = {
        activate_ultrasound: false,
    }

    // empty object
    // as model is loaded, the different parts get added
    // so we can control individual model part visibility in the GUI
    // is empty to scale to hold as many parts the model has
    let partListObject = new Object();
    
    let modelControlParams = {
        toggle_myocardium: 2,
        toggle_all_models: 0,
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
            if (teeMouseControls.isLocked) {
                teeMouseControls.unlock();
                orbitControls.enabled = true;
            } else {
                teeMouseControls.lock();
                orbitControls.enabled = false;
            }            
        },
        reset: function () {
            resetProbe();
        }
    }

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

    // TODO: Firestore
    let userBookmarks = {
        'Apical Four Chamber': {
            retroAnteflex: -30,
            leftRightFlex: 0,
            leftRightTwist: 13,
            omniplaneRot: 0,
            advanceRetract: 23, 
        },

        'Parasternal Long Axis': {
            retroAnteflex: -22,
            leftRightFlex: 1,
            leftRightTwist: 13,
            omniplaneRot: -47,
            advanceRetract: 23, 
        },
    };
    
    let bookmarkParams = {
        bookmarks: 'Saved Bookmarks',

        save_bookmark: function() {
            saveBookmark();
        },

        delete_bookmark: function() {
            deleteBookmark();
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
                // convert v to decimal and round to nearest int
                positionAlongPath = Math.round((v / 100) * (points.length - 1));

                ultrasoundGroup.position.x = points[positionAlongPath].x;
                ultrasoundGroup.position.y = points[positionAlongPath].y;
                ultrasoundGroup.position.z = points[positionAlongPath].z;
            
                rotateAlongCurve(path);
                matchCoPlanar(pointA, pointB, pointC);
            } else {
                console.log('path needed before probe can move!')
            }
        }
    }
    // -----------------END GLOBAL VARIABLES-----------------

    // -----------------START GLOBAL SCENE HELPER FUNCTIONS-----------------
    function modelLoader(path) {
        // from https://discourse.threejs.org/t/most-simple-way-to-wait-loading-in-gltf-loader/13896/3
        return new Promise((resolve, reject) => {
            loader.load(path, res => resolve(res), null, reject);
        });
    }

    async function modelParser(path) {
        let data = await modelLoader(path);
        let models = data.scene;

        scene.add(models);

        models.children.forEach(model => {
            // only handle the myocardium if it's a heart model and it has a myocardium model
            if (model.name.toLowerCase() == 'myocardium') {
                if (modelType.toLowerCase() == 'heart') {
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
                    scene.add(myocardiumNoClip);
                } else {
                    console.log('model is a heart, but no myocardium model');
                }
            } else {
                // puts all models (other than myocardium) into a single object to make toggling visibility easier
                // limited colour pallete targeted more specifically to the heart for now
                if (model.name.includes("1_")) {
                    model.material = modelMat(0xe62e2e);
                } else if (model.name.includes("2_")) {
                    model.material = modelMat(0x372ee6);
                } else if (model.name.includes("3_")) {
                    model.material = modelMat(0xe6682e);
                } else if (model.name.includes("4_")) {
                    model.material = modelMat(0x2ebee6);
                } else if (model.name.includes("5_")) {
                    model.material = modelMat(0xe6bb2e);
                } else if (model.name.includes("6_")) {
                    model.material = modelMat(0x2ee662);
                } else {
                    model.material = modelMat('white');
                }

                modelParts.push(model);
                
                // // 0: visible, 1: wireframe, 2: hidden
                // displayModelParts(0);
            }
        })

        addModelControlFolder();

        console.log(`all models loaded!`);
    }

    // not quite working...
    // ignore ignore ignore
    function loadHumanViewCube(path) {
        loader.load(
            path,
            function(gltf) {
                gltf.asset;
                model = gltf.scene;
                model.traverse(c => {
                    if (c.isMesh) {
                        humanViewCube = c;
                        console.log(humanViewCube);
                        humanViewCube.material = modelMat('white');
                        humanViewCube.rotateY(Math.PI);
                        humanViewCube.position.z = 200;
                        humanViewCube.layers.set(mainCamLayer);
                        humanViewCube.geometry.center.set(SCREEN_WIDTH - 200, SCREEN_HEIGHT - 200);
                        scene.add(humanViewCube);
                    }
                })
            }
        )
            
    }
    
    // not quite working...
    // ignore ignore ignore
    function spawnAnnotation(pos, normal) {
        let objectPointer = new THREE.Object3D()
        let annotationGeom = new THREE.CircleGeometry(6, 32);
        let annotationMat = new THREE.MeshBasicMaterial({
            color: 'white',
            side: THREE.DoubleSide,
        });
        let annotation = new THREE.Mesh(annotationGeom, annotationMat);

        objectPointer.lookAt(normal);

        annotation.position.x = pos.x;
        annotation.position.y = pos.y;
        annotation.position.z = pos.z;

        scene.add(annotation);
    }

    function handleRaycast(e) {
        // used for raycasting as per: https://threejs.org/docs/#api/en/core/Raycaster
        // calculate mouse position in normalized device coordinates
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        raycaster.layers.set(mainCamLayer);

        //un-comment the next 3 lines for debugging the raycaster
        // let rayHelper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 1500, 0xff0000);
        // rayHelper.layers.set(raycastHelperLayer);
        // scene.add(rayHelper);

        let intersects = raycaster.intersectObjects(scene.children);
        let previousObject;

        if (intersects.length > 0) {
            let target = intersects[0]
            if (target.object.name == 'control_sphere') {
                generateTransformControl(target.object);
                previousObject = target.object;
            }

            // for annotations -- not quite working ignore for now
            // if (target.object.type == 'Mesh' && target.object.name != 'control_sphere') {
            //     spawnAnnotation(target.point, target.face.normal);
            //     console.log(target.point);
            // }

            if (previousObject) {
                previousObject.material = new THREE.LineBasicMaterial({color: 'pink'});
            }
        }
    }

    function spawnLights() {
        let ambientLight = new THREE.AmbientLight('white', 0.5);
        ambientLight.name = 'ambient_light';
        scene.add(ambientLight);

        let spotLightOne = new THREE.SpotLight('white', 0.3);
        spotLightOne.position.set(100, 200, 100);
        spotLightOne.name = 'spotlight_one';
        scene.add(spotLightOne);

        let spotLightTwo = new THREE.SpotLight('white', 0.3);
        spotLightTwo.position.set(-100, 200, 100);
        spotLightTwo.name = 'spotlight_two';
        scene.add(spotLightTwo);

        let spotLightThree = new THREE.SpotLight('white', 0.3);
        spotLightThree.position.set(0, 200, -100);
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
        
        camera.position.x = -70.0;
        camera.position.y = 190.00;
        camera.position.z = -120.00;

        // Dummy camera for the pointer lock
        // so screen doesn't move when pointer lock is on.
        // does not render anything
        pointerLockCam = new THREE.PerspectiveCamera(1, 1, 0.1, 1);
    }
    // -----------------END GLOBAL SCEBE HELPER FUNCTIONS-----------------

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
    function xTeeControlClick(mouseButtonNumber) {
        let interval = 50;
        if (mouseButtonNumber == 0) {
            mouseOmniInterval = setInterval(() => {
                if (controlParams.omniplane > ultrasoundStartMaxValues.omniplaneMin) {
                    probeControls.omniplane(controlParams.omniplane -= 1);                    
                }
            }, interval);
        }

        if (mouseButtonNumber == 1) {
            resetProbe();
        }

        if (mouseButtonNumber == 2) {
            mouseOmniInterval = setInterval(() => {
                if (controlParams.omniplane < ultrasoundStartMaxValues.omniplaneMax) {
                    probeControls.omniplane(controlParams.omniplane += 1);                        
                }
            }, interval);   
        }

        return;
    }

    // MOUSE CONTROLS: MOVEMENT (Advance/Retract/TWIST LEFT/TWIST RIGHT)
    function xTeeControlMove(mouseX, mouseY) {
        if (mouseY >= 2) {
            if (controlParams.advance < 100) {
                probeControls.advance(controlParams.advance += 0.5);
            }
        } else if (mouseY <= -2) {
            if (controlParams.advance > 0) {
                probeControls.advance(controlParams.advance -= 0.5);
            }
        }

        if (mouseX <= -1) {
            if (controlParams.twist < ultrasoundStartMaxValues.twistMax) {
                probeControls.twist(controlParams.twist += 1);
            }
        } else if (mouseX >= 1) {
            if (controlParams.twist > ultrasoundStartMaxValues.twistMin) {
                probeControls.twist(controlParams.twist -= 1);
            }
        }

        return;
    }

    function keyboardControls(isOn) {
        if (isOn) {
            document.onkeydown = function(e) {
            switch (e.key) {
                case 'w':
                    if (controlParams.advance < 100) {
                        probeControls.advance(controlParams.advance += 1);
                    }
                break;

                case 's':
                    if (controlParams.advance > 0) {
                        probeControls.advance(controlParams.advance -= 1);
                    }
                break;

                case 'a':
                    if (controlParams.twist > ultrasoundStartMaxValues.twistMin) {
                        probeControls.twist(controlParams.twist -= 1);
                    }
                break;

                case 'd':
                    if (controlParams.twist < ultrasoundStartMaxValues.twistMax) {
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

                case 'ArrowUp':
                    if (controlParams.anteflex < ultrasoundStartMaxValues.anteflexMax) {
                        e.preventDefault();
                        probeControls.anteflex(controlParams.anteflex += 1);                        
                    }
                break;

                case 'ArrowDown':
                    if (controlParams.anteflex > ultrasoundStartMaxValues.anteflexMin) {
                        e.preventDefault();
                        probeControls.anteflex(controlParams.anteflex -= 1);                        
                    }
                break;

                case 'ArrowLeft':
                    if (controlParams.rightLeftFlex > ultrasoundStartMaxValues.rightLeftFlexMin) {
                        e.preventDefault();
                        probeControls.rightLeftFlex(controlParams.rightLeftFlex -= 1);                        
                    }
                break;

                case 'ArrowRight':
                    if (controlParams.rightLeftFlex < ultrasoundStartMaxValues.rightLeftFlexMax) {
                        e.preventDefault();
                        probeControls.rightLeftFlex(controlParams.rightLeftFlex += 1);                        
                    }
                break;

                case 't' || 'Escape':
                    controlParams.xtee();
                break;

                case 'z':
                    splitView = !splitView;
                    camera.updateProjectionMatrix();
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

            console.log('probe reset to initial conditions');
    }
    // -----------------END ULTRASOUND CONTROL FUNCTIONS-----------------

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

    function handleTeeMode(isOn) {
        splitView = isOn;

        camera.updateProjectionMatrix();

        keyboardControls(isOn);

        // 0: visible, 1: wireframe, 2: hidden
        if (isOn) {
            displayModelParts(2);
        } else {
            displayModelParts(0);
        }

        // default to hiding the non-clippable myocardium when switching modes
        // to keep it simple
        // 0: visible, 1: wireframe, 2: hidden
        displayNoClipMyocardium(2);

        let layer;

        if (isOn) {
            layer = mainCamLayer;
            myocardium.material.clippingPlanes = [clippingPlane];

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
            
            controlSphereList.forEach(sphere => {
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
        } else {
            layer = hiddenLayer;
            myocardium.material.clippingPlanes = [];

            // leave these two here
            // these two must be set to the hidden layer when ultrasound is off
            frontMesh.layers.set(hiddenLayer);
            backMesh.layers.set(hiddenLayer);

            ultrasoundOverlay.children.forEach(element => {
                element.layers.set(hiddenLayer);
            });
        }

        myocardium.layers.set(layer);
        ultrasoundGroup.layers.set(layer);
        ultrasoundProbeHead.layers.set(layer);
        ultrasoundCamPivot.layers.set(layer);
        beamMesh.layers.set(layer);

        if (ultrasoundTube) {
            ultrasoundTube.layers.set(layer);
        }
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
        controlSphereList.push(controlSphere);
    }

    function generateSpline() {
        let splinePoints = [];

        if (controlSphereList.length <= 1) {
            console.log(`more spheres required`);
        }
        else {
            console.log(`removing previous splines and updating`);

            scene.remove(scene.getObjectByName('splinePath'));

            for (let i = 0; i < controlSphereList.length; i++) {
                let xPos = controlSphereList[i].position.x;
                let yPos = controlSphereList[i].position.y;
                let zPos = controlSphereList[i].position.z;
                splinePoints.push(new THREE.Vector3(xPos, yPos, zPos));
            }

            path = new THREE.CatmullRomCurve3(splinePoints);

            // scale the number of points between controls
            pointCount = controlSphereList.length * numPathPoints;

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

    function saveControlSpherePosition() {
        // point me to firebase
        if (path) {
            // clear the list every time we save
            controlSpherePostionList = [];
            controlSphereList.forEach(element => {
                controlSpherePostionList.push(element.position);
            })
        } else {
            console.log('cannot save path: no path in scene');
        }

        console.log(controlSpherePostionList);
    }

    // rotate the probe head along a generated path
    // where the path is the esophagus
    // rotates so the forward (z) vector is pointed to the tangent at the point in the path
    // so that the ultrasound clipping plane (xy) is perpendicular to the path
    function rotateAlongCurve(path) {
        let t = positionAlongPath / pointCount;
        let tangent = path.getTangent(t);

        let dir = tangent.normalize();

        // apply some huge multiplier to the tangent point so it points outwards far into space
        ultrasoundGroup.lookAt(dir.multiplyScalar(1000));
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
    // just don't go above 85 or lower than 75...
    let ultrasoundCamOffset = -80;
    function spawnUltrasoundBeam() {
        ultrasoundCamPivot = new THREE.Group();
        let beamGeom = new THREE.CircleBufferGeometry(175, 32, Math.PI/4, Math.PI/2);
        let beamMat = new THREE.MeshBasicMaterial({
            color: 0x42cef5,
            transparent: true,
            opacity: 0.4,
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
        let ultrasoundCamTop = frustumSize / 2;
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
        // honestly i have no idea why this is working  for an offset of -80 but not anything else?
        ultrasoundOverlay.translateY(-ultrasoundCamera.position.y + ultrasoundCamOffset);

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
        let e = window.event;
        
        // when tee mouse controls are on, prevent scene rotation
        // allow for mouse movements to track to probe movements
        if (teeMouseControls.isLocked) {
            mouse.x = e.movementX;
            mouse.y = e.movementY;
            xTeeControlMove(mouse.x, mouse.y);
        }
    }

    function handleMouseUp() {
        if (teeMouseControls.isLocked) {
            clearInterval(mouseOmniInterval);
        }
    }
    // -----------------END HMOUSE EVENT HELPER FUNCTIONS-----------------

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

    function displayNoClipMyocardium(viewState) {
        if (viewState == 0) {
            myocardiumNoClip.layers.set(mainCamLayer);
        } else if (viewState == 1) {
            myocardiumNoClip.material.wireframe = true;
            myocardiumNoClip.layers.set(mainCamLayer);
        } else {
            myocardiumNoClip.layers.set(hiddenLayer);
        }

        modelControlParams.toggle_myocardium = viewState;
    }

    function handleEditMode(isOn) {
        let layer;

        if (isOn) {
            layer = mainCamLayer;
        } else {
            layer = hiddenLayer;
        }
        
        if (controlSphereList.length > 0) {
            controlSphereList.forEach(sphere => {
                sphere.layers.set(layer);
            });            
        }

        if (splineObject) {
            splineObject.layers.set(layer);
        }

        // remove instances of the ultrasound tube
        // since it won't regenerate on the fly when the path is updated
        // WATCH THIS!! MIGHT BE CAUSING A MEMORY LEAK!!
        if (ultrasoundTube) {
            scene.remove(ultrasoundTube);
            ultrasoundTube.geometry.dispose();
            ultrasoundTube.material.dispose();

            // clear references to the tube for garbage collection
            ultrasoundTube = undefined;
        } else {
            spawnUltrasoundTube();
            ultrasoundTube.layers.set(layer);
            console.log('regenerating ultrasound tube');
        }
    }

    function saveBookmark() {
        let bookmarkName = 'test';

        userBookmarks[bookmarkName] = {
            retroAnteflex: controlParams.anteflex,
            leftRightFlex: controlParams.rightLeftFlex,
            leftRightTwist: controlParams.twist,
            omniplaneRot: controlParams.omniplane,
            advanceRetract: controlParams.advance, 
        }

        console.log('user bookmark saved!')
    }

    function deleteBookmark() {
        console.log('bookmark deleted!');
    }

    // folder contents change if model is or is not heart
    // call it outside the main GUI function AFTER all models have been loaded
    // so it doesn't have to be async
    // only call this once in modelParser()
    function addModelControlFolder() {
        // deals with model visibility
        modelControlFolder = gui.addFolder('Model Control');
        
        let modelGroupName = 'All Models Visible';
        let modelVisibilityOptions = {'Visible': 0, 'Wireframe': 1, 'Hidden': 2}

        if (modelType.toLowerCase() == 'heart') {
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

    function handleGUI() {
        gui.title('Model Viewer');

        let activateUltrasound = gui.add(modeParams, 'activate_ultrasound').name('Activate Ultrasound').onChange(v => {
            handleTeeMode(v);

            controlOptions.forEach(option => {
                option.enable(v);
            })

            bookmarkOptions.forEach(option => {
                option.enable(v);
            })

            if (v) {
                controlFolder.open();
                bookmarkFolder.open();
                viewWidth.set('half-less');

                if (isAdmin) {
                    adminFolder.close()
                }
            } else {
                controlFolder.close();
                bookmarkFolder.close();
                viewWidth.set('full-less');
                
                if (isAdmin) {
                    adminFolder.open()
                }
            }

            // to control the elements of the description box
            descriptionBoxMax.set(false);
            descriptionBox.set(true);
            btnBoxSize.set('btn-box-min');
            titleBoxPosition.set('titleBox-min-description')

            if (!ultrasoundTube) {
                spawnUltrasoundTube();
            }

            toggleEditing.enable(!v);
        });

        // only enable ultrasound mode if a path for the probe exists
        if (path) {
            activateUltrasound.enable(true);
        } else {
            activateUltrasound.enable(false);
        }

        // deals with all probe control options
        let controlFolder = gui.addFolder('TEE Probe Controls');
        controlFolder.close();

        // default initial mode is just the view, no ultrasound
        // set all of these off and the folder to closed
        let anteflexControl = controlFolder.add(controlParams, 'anteflex', ultrasoundStartMaxValues.anteflexMin, ultrasoundStartMaxValues.anteflexMax, 1).name('Retroflex/Anteflex').enable(false).onChange(v => {
            probeControls.anteflex(v);
        }).listen();
        let rightLeftFlexControl = controlFolder.add(controlParams, 'rightLeftFlex', ultrasoundStartMaxValues.rightLeftFlexMin, ultrasoundStartMaxValues.rightLeftFlexMax, 1).name('Left Flex/Right Flex').enable(false).onChange(v => {
            probeControls.rightLeftFlex(v);
        }).listen();
        let twistControl = controlFolder.add(controlParams, 'twist', ultrasoundStartMaxValues.twistMin, ultrasoundStartMaxValues.twistMax, 1).name('Left Twist/Right Twist').enable(false).onChange(v => {
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
        let xTeeControl = controlFolder.add(controlParams, 'xtee').name('TEE Controller').enable(false);

        let controlOptions = [
            anteflexControl,
            rightLeftFlexControl,
            twistControl,
            omniplaneControl,
            advanceControl,
            resetControl,
            xTeeControl
        ];

        // keep variables affected by ultrasound mode on/off out of local scope of isAdmin if block
        let toggleEditing;
        let adminFolder;

        if (isAdmin) {
            adminFolder = gui.addFolder('Admin Functions');

            toggleEditing = adminFolder.add(adminParams, 'toggle_editing').name('Edit Scene').onChange(v => {
                handleEditMode(v);

                // don't allow ultrasound mode while editing and only if a probe path has been generated!
                if (path && !v) {
                    console.log('path set and exiting edit mode: utlrasound mode now available');
                    activateUltrasound.enable(true);
                } else {
                    activateUltrasound.enable(false);
                }

                adminOptions.forEach(option => {
                    option.enable(v);
                })
            });

            let addControlSphere = adminFolder.add(adminParams, 'add_control_sphere').name('Add Spline Control').enable(false);
            let saveControlSpherePos = adminFolder.add(adminParams, 'save_sphere_position').name('Save Path').enable(false);
            
            let adminOptions = [
                addControlSphere,
                saveControlSpherePos,
            ]
        }

        let bookmarkFolder = gui.addFolder('User Bookmarks');
        
        let userBookmarkGui = bookmarkFolder.add(bookmarkParams, 'bookmarks', userBookmarks).enable(false).onChange(v => {
            // update the gui object for the controls (controlParams)
            // then move the actual probe (probeControls)
            
            controlParams.anteflex = v.retroAnteflex;
            probeControls.anteflex(controlParams.anteflex);

            controlParams.rightLeftFlex = v.leftRightFlex;
            probeControls.rightLeftFlex(controlParams.rightLeftFlex);

            controlParams.twist = v.leftRightTwist;
            probeControls.twist(controlParams.twist);

            controlParams.omniplane = v.omniplaneRot;
            probeControls.omniplane(controlParams.omniplane);

            controlParams.advance = v.advanceRetract;
            probeControls.advance(controlParams.advance);
        });

        let saveBookmarkGui = bookmarkFolder.add(bookmarkParams, 'save_bookmark').name('Save Bookmark').enable(false);
        let deleteBookmarkGui = bookmarkFolder.add(bookmarkParams, 'delete_bookmark').name('Delete Bookmark').enable(false);
        
        let bookmarkOptions = [
            userBookmarkGui,
            saveBookmarkGui,
            // deleteBookmarkGui
        ]

        bookmarkFolder.close();
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

        // CAMERAS
        spawnCameras();
        
        // LOADER: gltf w/draco compression
        loader = new GLTFLoader();
        dracoLoader = new DRACOLoader();

        // in public folder
        dracoLoader.setDecoderPath('/draco/gltf/');
        loader.setDRACOLoader(dracoLoader);

        // loadHumanViewCube('/gltf/human.glb/');

        modelParser(modelFilePath).catch(err => {
            console.log(`something went wrong loading the heart model: ${err}`);
        })

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
        orbitControls = new OrbitControls(camera, renderer.domElement);
        teeMouseControls = new PointerLockControls(pointerLockCam, renderer.domElement);

        // SPAWN PATH IF PATH CONTROL SPHERES HAVE BEEN SET
        // probably needs to be wrapped in an async function
        // read from firebase
        if (controlSpherePostionList.length > 0) {
            console.log('regenerating probe path from saved control points!')

            for (let i = 0; i < controlSpherePostionList.length; i++) {
                generateControlSphere();
                controlSphereList[i].position.x = controlSpherePostionList[i].x;
                controlSphereList[i].position.y = controlSpherePostionList[i].y;
                controlSphereList[i].position.z = controlSpherePostionList[i].z;
                controlSphereList[i].layers.set(hiddenLayer);
            }
            
            generateSpline();
            splineObject.layers.set(hiddenLayer);
            
            // create ultrasound tube if there are control spheres for the path  and if there isn't a tube yet
            if (!ultrasoundTube) {
                spawnUltrasoundTube();
                console.log('creating ultrasound tube');
                ultrasoundTube.layers.set(hiddenLayer);
            } else {
                console.log('ultrasound tube exists somehow?');
            }
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
            camera.aspect = 0.5 * aspect;
        } else {
            camera.aspect = aspect;
        }
        
        camera.updateProjectionMatrix();            
        
        ultrasoundCamera.left = - frustumSize * aspect / 4;
        ultrasoundCamera.right = -ultrasoundCamera.left;
        ultrasoundCamera.top = frustumSize / 2;
        ultrasoundCamera.bottom = -ultrasoundCamera.top;

        ultrasoundCamera.updateProjectionMatrix();
    }

    function render() {
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.setPixelRatio( window.devicePixelRatio );

        if (splitView) {
            // positions the main model viewer window in split-screen
            renderer.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
            camera.aspect = 0.5 * aspect;
            renderer.render(scene, camera);
    
            //positions the ultrasound window in split-screen
            renderer.setViewport(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
            renderer.render(scene, ultrasoundCamera);
        } else {
            // positions the main model viewer window in single screen
            renderer.render(scene, camera);
            camera.aspect = aspect;
        }

        camera.updateProjectionMatrix();
    }

    // go go go
    init();
    animate();
</script>

<div id='gui2'></div>

<style>
    #gui2 {
        background-color: coral;
        left: 10%;
        bottom: 5%;
        z-index: 100;
        position: absolute;
    }
</style>