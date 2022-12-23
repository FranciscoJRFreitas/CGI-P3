import {buildProgramFromSources, loadShadersFromURLS, setupWebGL} from "./libs/utils.js";
import {perspective, lookAt, flatten, vec2, vec3, vec4, rotateX, rotateY, rotateZ, mult, normalMatrix, inverse} from "./libs/MV.js";
import {modelView, loadMatrix, multScale, multTranslation, popMatrix, pushMatrix, multRotationX, multRotationY, multRotationZ} from "./libs/stack.js";

import * as SPHERE from './libs/objects/sphere.js';
import * as CUBE from './libs/objects/cube.js';
import * as CYLINDER from './libs/objects/cylinder.js';
import * as PYRAMID from './libs/objects/pyramid.js';
import * as BUNNY from './libs/objects/bunny.js';
import * as TORUS from './libs/objects/torus.js';
import { GUI } from './libs/dat.gui.module.js';

/** @type WebGLRenderingContext */
//Constants

//Platform measurements
const PLATFORM_HEIGHT = 0.5;
const PLATFORM_SIDE = 10.0;

//Bunny measurements
const BUNNY_SIZE = 15.0;

//Other objects measurements
const DEFAULT_SIZE = 2.0;

//Object colors
const MAT_AFFECTED_COLOR = vec3();
const PLATFORM_COLOR = vec3(135.0, 206.0, 250.0); //Sky blue
const CUBE_COLOR = vec3(255.0, 127.5, 80.0); //Terracotta
const CYLINDER_COLOR = vec3(128.0, 128.0, 0.0); //Olive
const TORUS_COLOR = vec3(250.0, 200.0, 200.0); //Salmon

//Camera Movement
//Adjust natural camera movement
const MVIEW_LIM = 0.25;
//Rotation angle limit
const CAM_SPINS = 2;
const ROT_LIM = CAM_SPINS * 180; // 180 means one spin (rotation from -180 to 180)
//Sensivity factor Attenuant
const SENSE_FACTOR = 45;

//Variables
let gl;
let mouseIsDragging = false;
let mView;
let initMousePos = vec2(0.0);
let mModel;
let pointView;
let posCamera;
let atCamera;
let firstPerson = false;
let openned = false;
let x = 0;
let y = 0;
let z = 0;

let options = {
    Mode : NaN,
    DepthTest : true,
    BackfaceCulling : true,
    mouseSensivity : 2
}

let camera = {
    Agility : CAM_SPINS,
    Zoom : 100,
    Gama : 0,
    Theta : 0,
    Fovy : 45,
    Near : 0.1,
    Far : 60,
    eye : [-15, 5, 0],
    at : [0, 0, 0],
    up : [0, 1, 0]
}

let lights = [
    {
    ambient : [128.5,128.5,128.5],
    diffuse : [128.5,128.5,128.5],
    specular : [200,200,200],
    position : [1.0,2.0,1.0,1.0],
    axis : [0.0,0.0,-1.0],
    apperture : 0.0,
    cutoff : -1,
    onState : true,
    type : 'Point'
    },
    {
    ambient : [100,0,0],
    diffuse : [100,0,0],
    specular : [150,0,0],
    position : [-10.0,5.0,5.0,0.0],
    axis : [10.0,-5.0,-5.0],
    apperture : 0.0,
    cutoff : -1,
    onState : false,
    type : 'Directional'
    },
    {
    ambient : [75,75,100],
    diffuse : [75,75,100],
    specular : [150,150,175],
    position : [0,3.0,0.0,0.0],
    axis : [0.0, 0.0, -1.0],
    apperture : 15.0,
    cutoff : 30,
    onState : false,
    type : 'Spotlight'
    }
];

let matMenu = {
    color : -1
}

let material = {
    Ka : [150,150,150],
    Kd : [150,150,150],
    Ks : [200,200,200],
    shininess : 75.0
}

let matSamples = [
    //Gray material, also default
    {
    Ka: [150,150,150],
    Kd: [150,150,150],
    Ks: [200,200,200],
    shininess : 75.0
    },
    //Red material
    {
    Ka: [150,50,50],
    Kd: [150,50,50],
    Ks: [200,200,200],
    shininess : 25.0
    },
    //Green material
    {
    Ka: [50,150,50],
    Kd: [50,150,50],
    Ks: [200,200,200],
    shininess : 100.0
    },
    //Blue material
    {
    Ka: [50,50,150],
    Kd: [50,50,150],
    Ks: [200,200,200],
    shininess : 50.0
    }
];

let moveCam = { 
    move:function() {
        firstPerson = !firstPerson;
    }
};

let resetCam = { 
    reset:function() {
        firstPerson = false;
        camera.Agility = CAM_SPINS;
        camera.Gama = 0;
        camera.Theta = 0;
        camera.Fovy = 45;
        camera.Near = 0.1;
        camera.Far = 30;
        camera.Zoom = 100;
        camera.eye[0] = -15;
        camera.eye[1] = 5;
        camera.eye[2] = 0;
        camera.at[0] = 0;
        camera.at[1] = 0;
        camera.at[2] = 0;
        camera.up[0] = 0;
        camera.up[1] = 1;
        camera.up[2] = 0;
        mView = mult(lookAt([-15, 5, 0], [0, 0, 0], [0, 1, 0]), mult(rotateY(camera.Gama), rotateX(camera.Theta)));
    }
};

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["phong.vert"], shaders["phong.frag"]);

    let mProjection = perspective(camera.Fovy, aspect, camera.Near, camera.Far);
    mView = lookAt([-15, 5, 0], [0, 0, 0], [0, 1, 0]);

    const gui = new GUI();

    //Options
    const optionsFolder = gui.addFolder('Options');
    var DepthTest = optionsFolder.add(options, 'DepthTest', true, false).name('Depth Test').listen();
    var BackfaceCulling = optionsFolder.add(options, 'BackfaceCulling', true, false).name('Backface Culling').listen();
    optionsFolder.add(options, 'mouseSensivity', 1, 4).name('Mouse Sensivity').listen();
    var mode = optionsFolder.add(options, 'Mode', {Lines: 'gl.LINES', Solid: 'gl.TRIANGLES'}).setValue('gl.TRIANGLES');
    options.Mode = gl.TRIANGLES;

    //Camera
    const camOptFolder = gui.addFolder('Camera');
    camOptFolder.add(camera, "Agility", 1, 5).name('Max Rotations').listen();
    camOptFolder.add(camera, "Zoom", 50, 1000).name('Zoom (%)').listen();
    camOptFolder.add(camera, 'Gama', -ROT_LIM, ROT_LIM).name('Gama (º)').listen();
    camOptFolder.add(camera, 'Theta', -ROT_LIM, ROT_LIM).name('Theta (º)').listen();

    camOptFolder.add(camera, 'Fovy', 30, 60).listen();
    camOptFolder.add(camera, 'Near', 0.1, 10).listen();
    camOptFolder.add(camera, 'Far', 2, 100).listen();
    
    const eyeCam = camOptFolder.addFolder('eye');
    eyeCam.add(camera.eye, 0, -50, 50).name('x').listen();
    eyeCam.add(camera.eye, 1, -50, 50).name('y').listen();
    eyeCam.add(camera.eye, 2, -50, 50).name('z').listen();

    const atCam = camOptFolder.addFolder('at');
    atCam.add(camera.at, 0, -50, 50).step(0.1).name('x').listen();
    atCam.add(camera.at, 1, -50, 50).step(0.1).name('y').listen();
    atCam.add(camera.at, 2, -50, 50).step(0.1).name('z').listen();

    const upCam = camOptFolder.addFolder('up');
    upCam.add(camera.up, 0, -1, 1, 0.01).name('x').listen();
    upCam.add(camera.up, 1, -1, 1, 0.01).name('y').listen();
    upCam.add(camera.up, 2, -1, 1, 0.01).name('z').listen();

    camOptFolder.add(moveCam, 'move').name('Moving Camera (f)');
    camOptFolder.add(resetCam, 'reset').name('Reset Values');
    

    // Lights
    const lightsOptFolder = gui.addFolder('Lights');

    var lightslPositionFolder = [];
    for(let l = 0; l < lights.length; l++) {
        let lightMenu = {
            type: lights[l].type
        };
        const lightslOptFolder = lightsOptFolder.addFolder('Light'+(l+1));
        lightslOptFolder.add(lights[l], 'onState', true, false).name('Activated').listen();

        var lMenu = lightslOptFolder.add(lightMenu, 'type',
            {Point: 'Point', Directional: 'Directional', Spotlight: 'Spotlight'}).name("Type").listen();

            lightslPositionFolder[l] = lightslOptFolder.addFolder('position');
            lightslPositionFolder[l].add(lights[l].position, 0).step(0.1).name('x').listen();
            lightslPositionFolder[l].add(lights[l].position, 1).step(0.1).name('y').listen();
            lightslPositionFolder[l].add(lights[l].position, 2).step(0.1).name('z').listen();
            var w = lightslPositionFolder[l].add(lights[l].position, 3, -1.0, 1.0).step(0.1).name('w').listen();
            lightslPositionFolder[l] = {folder: lightslPositionFolder[l], w: w}; //To adjust W changeability

        const lightslIntensitiesFolder = lightslOptFolder.addFolder('intensities');
            lightslIntensitiesFolder.addColor(lights[l], 'ambient').listen();
            lightslIntensitiesFolder.addColor(lights[l], 'diffuse').listen();
            lightslIntensitiesFolder.addColor(lights[l], 'specular').listen();
    
        const lightslAxisFolder = lightslOptFolder.addFolder('axis');
            lightslAxisFolder.add(lights[l].axis, 0).step(0.1).name('x').listen();
            lightslAxisFolder.add(lights[l].axis, 1).step(0.1).name('y').listen();
            lightslAxisFolder.add(lights[l].axis, 2).step(0.1).name('z').listen();

        const lightsAppertCutOffFolder = lightslOptFolder.addFolder('Apperture/Cut off');
            lightsAppertCutOffFolder.add(lights[l],'apperture', 0, 180, 0.1).listen();
            lightsAppertCutOffFolder.add(lights[l],'cutoff', 0, 100, 1).listen();

        if(lights[l].type == 'Point' || lights[l].type == 'Directional'){
            lightslAxisFolder.hide();
            lightsAppertCutOffFolder.hide();
            lightslPositionFolder[l].w.domElement.style.pointerEvents = "none";
            lightslPositionFolder[l].w.domElement.style.opacity = 0.4;
        }
        if (lights[l].type == 'Directional') {
            lightslPositionFolder[l].folder.name = 'direction';
        }

        lMenu.onChange(function(value) {
            lights[l].type = value;
            if(value == 'Point'){
                lights[l].position[3] = 1.0; //Update w value on change
                lightslPositionFolder[l].folder.name = 'position';
                lightslPositionFolder[l].w.domElement.style.pointerEvents = "none";
                lightslPositionFolder[l].w.domElement.style.opacity = 0.4;
                lightslPositionFolder[l].folder.show();
                lightslAxisFolder.hide();
                lightsAppertCutOffFolder.hide();
            } else if(value == 'Directional') {
                lightslPositionFolder[l].folder.name = 'direction';
                lightslPositionFolder[l].w.domElement.style.pointerEvents = "none";
                lightslPositionFolder[l].w.domElement.style.opacity = 0.4;
                lights[l].position[3] = 0.0; //Update w value on change
                lightslPositionFolder[l].folder.show();
                lightslAxisFolder.hide();
                lightsAppertCutOffFolder.hide();
            } else if(value == 'Spotlight'){
                lightslPositionFolder[l].folder.name = 'position';
                lightslPositionFolder[l].w.domElement.style.pointerEvents = "auto";
                lightslPositionFolder[l].w.domElement.style.opacity = 1.0;
                lightslPositionFolder[l].folder.show();
                lightslAxisFolder.show();
                lightsAppertCutOffFolder.show();
            }
        });
                
    }
    
    //Material
    const materialOptFolder = gui.addFolder('Material');
    let inc = 0; //To facilitate addition to the menu
    var mMenu = materialOptFolder.add(matMenu, 'color',
    {Gray: inc, Red: ++inc, Green: ++inc, Blue: ++inc} //Add sample material by => Color: ++inc after giving values in matSamples[]
    ).setValue('-1').name("Samples").listen();
    materialOptFolder.addColor(material, 'Ka', vec3(255)).listen();
    materialOptFolder.addColor(material, 'Kd', vec3(255)).listen();
    materialOptFolder.addColor(material, 'Ks', vec3(255)).listen();
    materialOptFolder.add(material, 'shininess', 0, 100).listen();

    mMenu.onFinishChange(function(value) {
        material.Ka = matSamples[value].Ka;
        material.Kd = matSamples[value].Kd;
        material.Ks = matSamples[value].Ks;
        material.shininess = matSamples[value].shininess;
      });

    mode.onChange( function(){
        if(optionsFolder.__controllers[0].object.Mode == 'gl.LINES')
            options.Mode = gl.LINES;
        else
            options.Mode = gl.TRIANGLES;
    });
    
    DepthTest.onChange( function(){
        if(options.DepthTest)
            gl.enable(gl.DEPTH_TEST);
        else
            gl.disable(gl.DEPTH_TEST);
    });

    BackfaceCulling.onChange( function(){
        if(options.BackfaceCulling)
            gl.enable(gl.CULL_FACE);
        else
            gl.disable(gl.CULL_FACE);
    });

    document.onkeydown = function(event) {
        switch(event.key) {
            case "f":
                firstPerson = !firstPerson;
            break;
        }
    };

    let wPressed = false;
    let aPressed = false;
    let sPressed = false;
    let dPressed = false;
    let upPressed = false;
    let downPressed = false;

    window.addEventListener('keydown', function(event) {
        if (event.key === 'w') {
            wPressed = true;
        }
        if (event.key === 'a') {
            aPressed = true;
        }
        if (event.key === 's') {
            sPressed = true;
        }
        if (event.key === 'd') {
            dPressed = true;
        }
        if (event.key === 'ArrowUp') {
            upPressed = true;
        }
        if (event.key === 'ArrowDown') {
            downPressed = true;
        }
        if (event.key === 'r') {
            resetCam.reset();
        }
        if (event.key === 'o') { //Toggle open folders
            if(!openned) {
                for (const folderName in gui.__folders) {
                    gui.__folders[folderName].open();
                }
                openned = true;
            } else {
                for (const folderName in gui.__folders) {
                    gui.__folders[folderName].close();
                }
                openned = false;
            }
        }
        if (event.key === 'c') { //Toggle open camera folder
            if(!openned) {
                for (const folderName in gui.__folders) {
                    if (folderName === "Camera")
                      gui.__folders[folderName].open();
                    else
                      gui.__folders[folderName].close();
                  }
                openned = true;
            } else {
                for (const folderName in gui.__folders) {
                    gui.__folders[folderName].close();
                }
                openned = false;
            }
        }
        if (event.key === 'l') { //Toggle open lights folder and subfolders
            if(!openned) {
                for (const folderName in gui.__folders) {
                    if (folderName === "Lights") {
                      gui.__folders[folderName].open();
                      for (const subFolder in gui.__folders[folderName].__folders) {
                        gui.__folders[folderName].__folders[subFolder].open();
                      }
                    }
                }
                openned = true;
            } else {
                for (const folderName in gui.__folders)
                    gui.__folders[folderName].close();
                openned = false;
            }
        }
        if (event.key === 'm') { //Toggle open material folder
            if(!openned) {
                for (const folderName in gui.__folders) {
                    if (folderName === "Material")
                      gui.__folders[folderName].open();
                    else
                      gui.__folders[folderName].close();
                  }
                openned = true;
            } else {
                for (const folderName in gui.__folders) {
                    gui.__folders[folderName].close();
                }
                openned = false;
            }
        }
        if (event.key === 'q') { //Zoom out
            camera.Zoom /= 1.05;
        }
        if (event.key === 'e') { //Zoom in
            camera.Zoom *= 1.05;
        }
    });

    window.addEventListener('keyup', function(event) {
        if (event.key === 'w') {
            wPressed = false;
        }
        if (event.key === 'a') {
            aPressed = false;
        }
        if (event.key === 's') {
            sPressed = false;
        }
        if (event.key === 'd') {
            dPressed = false;
        }
        if (event.key === 'ArrowUp') {
            upPressed = false;
        }
        if (event.key === 'ArrowDown') {
            downPressed = false;
        }
    });

    // Update the position based on the keys being pressed
    function updatePosition() {
    if (wPressed) {
        z += 0.01;
    }
    if (aPressed) {
        x += 0.01;
    }
    if (sPressed) {
        z -= 0.01;
    }
    if (dPressed) {
        x -= 0.01;
    }
    if (upPressed) {
        y += 0.01;
    }
    if (downPressed) {
        y -= 0.01;
    }
    };

    function getCursorPosition(canvas, event) 
    {
        const mx = event.offsetX;
        const my = event.offsetY;

        const x = ((mx / canvas.width * 2) - 1);
        const y = (((canvas.height - my)/canvas.height * 2) - 1);

        return vec2(x,y);
    }

    canvas.addEventListener("mousedown", function(event) {
        mouseIsDragging = true;
        initMousePos = getCursorPosition(canvas, event);
    });

    canvas.addEventListener("mouseup", function(event) {
        mouseIsDragging = false;
    });

    canvas.addEventListener("mousemove", function(event) {
        const pos = getCursorPosition(canvas, event);
        if (mouseIsDragging) {
            var dy = (pos[1] - initMousePos[1]) * options.mouseSensivity * SENSE_FACTOR/2;
            var dx = (pos[0] - initMousePos[0]) * options.mouseSensivity * SENSE_FACTOR;
            // update the latest angle
            camera.Theta > ROT_LIM * camera.Agility ? camera.Theta = ROT_LIM * camera.Agility : camera.Theta -= dy;
            camera.Theta < -ROT_LIM * camera.Agility ? camera.Theta = -ROT_LIM * camera.Agility : camera.Theta -= dy;
            camera.Gama < -ROT_LIM * camera.Agility ? camera.Gama = -ROT_LIM * camera.Agility : camera.Gama += dx;
            camera.Gama > ROT_LIM * camera.Agility ? camera.Gama = ROT_LIM * camera.Agility : camera.Gama += dx;
        }
        initMousePos[0] = pos[0];
        initMousePos[1] = pos[1];
    });

    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    SPHERE.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);
    BUNNY.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    window.requestAnimationFrame(render);

    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = perspective(camera.Fovy, aspect, camera.Near, camera.Far);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function Platform()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), PLATFORM_COLOR);
        pushMatrix();
            multTranslation([0.0, -PLATFORM_HEIGHT/2, 0.0]);
            multScale([PLATFORM_SIDE, PLATFORM_HEIGHT, PLATFORM_SIDE]);
            uploadModelView();
            CUBE.draw(gl, program, options.Mode);
        popMatrix();
    }

    function Bunny()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), MAT_AFFECTED_COLOR);
        pushMatrix();
            multTranslation([PLATFORM_SIDE/5, 0.0, PLATFORM_SIDE/5]);
            multScale([BUNNY_SIZE, BUNNY_SIZE, BUNNY_SIZE]);
            uploadModelView();
            BUNNY.draw(gl, program, options.Mode);
        popMatrix();
    }

    function Cube()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), CUBE_COLOR);
        pushMatrix();
            multTranslation([-PLATFORM_SIDE/5, DEFAULT_SIZE/2, -PLATFORM_SIDE/5]);
            multScale([DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE]);
            uploadModelView();
            CUBE.draw(gl, program, options.Mode);
        popMatrix();
    }

    function Cylinder()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), CYLINDER_COLOR);
        pushMatrix();
            multTranslation([PLATFORM_SIDE/5, DEFAULT_SIZE/2, -PLATFORM_SIDE/5]);
            multScale([DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE]);
            uploadModelView();
            CYLINDER.draw(gl, program, options.Mode);
        popMatrix();
    }

    function Torus()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), TORUS_COLOR);
        pushMatrix();
            multTranslation([-PLATFORM_SIDE/5, DEFAULT_SIZE/5, PLATFORM_SIDE/5]);
            multScale([DEFAULT_SIZE, DEFAULT_SIZE, DEFAULT_SIZE]);
            uploadModelView();
            TORUS.draw(gl, program, options.Mode);
        popMatrix();
    }

    function FPSCamera()
    {
        pushMatrix();
            multTranslation([x, DEFAULT_SIZE + y, z]);
            multRotationX(camera.Theta);
            multRotationY(camera.Gama);
            multRotationZ(camera.Theta);
            uploadModelView();
            pointView = modelView();
        popMatrix();
    }

    function World()
    {
        Platform();
        Bunny();
        Cube();
        Cylinder();
        Torus();
        FPSCamera();
    }

    function render()
    {
        mProjection = perspective(camera.Fovy, aspect, camera.Near, camera.Far);
        if(firstPerson){
            updatePosition();
            mModel = mult(inverse(mView), pointView);
            posCamera = mult(mModel, vec4(0.0,0.0,0.0,1.0));
            atCamera = mult(mModel, vec4(0.0,0.0,2.0,1.0));
            mView = lookAt([posCamera[0], posCamera[1], posCamera[2]],
                [atCamera[0], atCamera[1], atCamera[2]], [0,1,0]);
        } else {
            if(mView[0][0] < MVIEW_LIM || mView[0][0] > -MVIEW_LIM) { //So that the rotation feels natural
                mView = mult(lookAt([camera.eye[0], camera.eye[1], camera.eye[2]],
                [camera.at[0], camera.at[1], camera.at[2]], 
                [camera.up[0], camera.up[1], camera.up[2]]),
                mult(rotateZ(camera.Theta), rotateY(camera.Gama)));
            } else {
                mView = mult(lookAt([camera.eye[0], camera.eye[1], camera.eye[2]],
                    [camera.at[0], camera.at[1], camera.at[2]], 
                    [camera.up[0], camera.up[1], camera.up[2]]),
                    mult(rotateY(camera.Gama), rotateX(camera.Theta)));
            }
        }

        window.requestAnimationFrame(render);
        gl.useProgram(program);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"),false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mView"), false, flatten(mView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"),false,  flatten(modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mViewNormals"),false, flatten(normalMatrix(mView)));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"),false,  flatten(normalMatrix(modelView())));

        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ka"), flatten(material.Ka));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Kd"), flatten(material.Kd));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ks"), flatten(material.Ks));
        gl.uniform1f(gl.getUniformLocation(program, "uMaterial.shininess"), material.shininess);

        gl.uniform1i(gl.getUniformLocation(program, "uNLights"), lights.length);

        for(let l = 0; l < lights.length; l++) {
            gl.uniform3fv(gl.getUniformLocation(program, "uLights["+ l +"].ambient"), flatten(lights[l].ambient));
            gl.uniform3fv(gl.getUniformLocation(program, "uLights["+ l +"].diffuse"), flatten(lights[l].diffuse));
            gl.uniform3fv(gl.getUniformLocation(program, "uLights["+ l +"].specular"), flatten(lights[l].specular));
            gl.uniform4fv(gl.getUniformLocation(program, "uLights["+ l +"].position"), flatten(lights[l].position));
            gl.uniform3fv(gl.getUniformLocation(program, "uLights["+ l +"].axis"), flatten(lights[l].axis));
            gl.uniform1f(gl.getUniformLocation(program, "uLights["+ l +"].apperture"), lights[l].apperture);
            gl.uniform1f(gl.getUniformLocation(program, "uLights["+ l +"].cutoff"), lights[l].cutoff);
            gl.uniform1i(gl.getUniformLocation(program, "uLights["+ l +"].onState"), lights[l].onState == true ? 1 : 0);
            gl.uniform1i(gl.getUniformLocation(program, "uLights["+ l +"].type"), 
            lights[l].type == 'Point' ? 0 : lights[l].type == 'Directional' ? 1 : 2);
        }

        loadMatrix(mView);

        pushMatrix();
            multScale([camera.Zoom/100.0, camera.Zoom/100.0, camera.Zoom/100.0]);;
            World();
        popMatrix();
    }
}

const urls = ["phong.vert", "phong.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))