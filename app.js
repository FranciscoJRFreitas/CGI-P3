import {buildProgramFromSources, loadShadersFromURLS, setupWebGL} from "./libs/utils.js";
import {perspective, lookAt, flatten, vec2, vec3, vec4, rotateX, rotateY, rotateZ, mult, inverse} from "./libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multRotationX, multRotationZ} from "./libs/stack.js";

import * as SPHERE from './libs/objects/sphere.js';
import * as CUBE from './libs/objects/cube.js';
import * as CYLINDER from './libs/objects/cylinder.js';
import * as PYRAMID from './libs/objects/pyramid.js';
import * as BUNNY from './libs/objects/bunny.js';
import * as TORUS from './libs/objects/torus.js';
import { GUI } from './libs/dat.gui.module.js';

/** @type WebGLRenderingContext */
//Not supposed to change
let gl;
let mouseIsDragging = false;
let mView;

let options = {
    Mode : NaN,
    DepthTest : true,
    BackfaceCulling : true
}

let camera = {
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
    ambient : [50,0,0],
    diffuse : [60,60,60],
    specular : [200,200,200],
    position : [20,-5.0,0.0,-1],
    axis : [0.0,0.0,-1.0],
    apperture : 10.0,
    cutoff  : 10
    },
    {
    ambient : [50,0,0],
    diffuse : [50,0,0],
    specular : [150,0,0],
    position : [-20.0,5.0,5.0,0.0],
    axis : [20.0,-5.0,-5.0],
    apperture : 180.0,
    cutoff  : -1
    },
    {
    ambient : [75,75,100],
    diffuse : [75,75,100],
    specular : [150,150,175],
    position : [0,0,10,1],
    axis : [-5.0,-5.0,-2.0],
    apperture : 180.0,
    cutoff  : -1
    }
];


let material = {
    Ka : [0,0,0],
    Kd : [0,0,0],
    Ks : [0,0,0],
    shininess : 0
}

let grayMaterial = {
    Ka: [150,150,150],
    kd: [150,150,150],
    Ks: [200,200,200],
    shininess : 100.0
}

let redMaterial = {
    Ka: [150,150,150],
    kd: [150,150,150],
    Ks: [200,200,200],
    shininess : 10.0
};

let greenMaterial = {
    Ka: [50,150,50],
    kd: [50,150,50],
    Ks: [200,200,200],
    shininess : 100.0
}

let resetCam = { 
    reset:function() {
        camera.Gama = 0;
        camera.Theta = 0;
        camera.Fovy = 45;
        camera.Near = 0.1;
        camera.Far = 30;
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
    let mView = lookAt([-15, 5, 0], [0, 0, 0], [0, 1, 0]);

    const gui = new GUI();
    
    const optionsFolder = gui.addFolder('Options');
    var mode = optionsFolder.add(options, 'Mode', {Lines: 'gl.LINES', Solid: 'gl.TRIANGLES'}).setValue('gl.TRIANGLES');
    var DepthTest = optionsFolder.add(options, 'DepthTest', true, false).name('Depth Test').listen();
    var BackfaceCulling = optionsFolder.add(options, 'BackfaceCulling', true, false).name('Backface Culling').listen();
    options.Mode = gl.TRIANGLES;
    optionsFolder.open();

    //Camera

    const camOptFolder = gui.addFolder('Camera');
    camOptFolder.add(camera, 'Gama', -180, 180).name('Gama (º)').listen();
    camOptFolder.add(camera, 'Theta', -180, 180).name('Theta (º)').listen();

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

    camOptFolder.add(resetCam, 'reset').name('Reset Values');

    // Lights
    const lightsOptFolder = gui.addFolder('Lights');

    for(let l = 0; l < lights.length; l++) {
        const lightslOptFolder = lightsOptFolder.addFolder('Light'+(l+1));

        const lightslPositionFolder = lightslOptFolder.addFolder('position');
            lightslPositionFolder.add(lights[l].position, 0).step(0.1).name('x').listen();
            lightslPositionFolder.add(lights[l].position, 1).step(0.1).name('y').listen();
            lightslPositionFolder.add(lights[l].position, 2).step(0.1).name('z').listen();
            lightslPositionFolder.add(lights[l].position, 3).step(0.1).name('w').listen();

        const lightslIntensitiesFolder = lightslOptFolder.addFolder('intensities');
            lightslIntensitiesFolder.addColor(lights[l], 'ambient').listen();
            lightslIntensitiesFolder.addColor(lights[l], 'diffuse').listen();
            lightslIntensitiesFolder.addColor(lights[l], 'specular').listen();
        
        const lightslAxisFolder = lightslOptFolder.addFolder('axis');
            lightslAxisFolder.add(lights[l].axis, 0).step(0.1).name('x').listen();
            lightslAxisFolder.add(lights[l].axis, 1).step(0.1).name('y').listen();
            lightslAxisFolder.add(lights[l].axis, 2).step(0.1).name('z').listen();

        lightslOptFolder.add(lights[l],'apperture', 0, 180, 0.1).listen();
        lightslOptFolder.add(lights[l],'cutoff', -1, 200, 1).listen();
    }
    
    //Material

    const materialOptFolder = gui.addFolder('Material');

    materialOptFolder.addColor(material, 'Ka', vec3(255)).listen();
    materialOptFolder.addColor(material, 'Kd', vec3(255)).listen();
    materialOptFolder.addColor(material, 'Ks', vec3(255)).listen();
    materialOptFolder.add(material, 'shininess', 0, 255).listen();

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

    function getCursorPosition(canvas, event) 
    {
        const mx = event.offsetX;
        const my = event.offsetY;

        const x = ((mx / canvas.width * 2) - 1);
        const y = (((canvas.height - my)/canvas.height * 2) - 1);

        return vec2(x,y);
    }

    let initpos = vec2(0,0);
    canvas.addEventListener("mousedown", function(event) {
        mouseIsDragging = true;
        initpos = getCursorPosition(canvas, event);
    });

    canvas.addEventListener("mouseup", function(event) {
        mouseIsDragging = false;
    });

    canvas.addEventListener("mousemove", function(event) {
        const pos = getCursorPosition(canvas, event);
        if (mouseIsDragging) {
            var dy = (pos[1] - initpos[1]) * canvas.width/canvas.height * 45;
            var dx = (pos[0] - initpos[0]) * canvas.height/canvas.width * 90;
            // update the latest angle
            camera.Theta > 180 ? camera.Theta = 180 : camera.Theta += dy;
            camera.Gama > 180 ? camera.Gama = 180 : camera.Gama += dx;
            camera.Theta < -180 ? camera.Theta = -180 : camera.Theta += dy;
            camera.Gama < -180 ? camera.Gama = -180 : camera.Gama += dx;
        }
        initpos[0] = pos[0];
        initpos[1] = pos[1];
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

    function Ground()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), vec3(1.0, 1.0, 1.0));
        pushMatrix();
            multTranslation([0.0,-0.25,0.0]);
            multScale([10.0, 0.5 , 10.0]);
            uploadModelView();
            CUBE.draw(gl, program, options.Mode);
        popMatrix();
    }

    function Bunny()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), vec3(material.Ka[0]/255.0,material.Ka[1]/255.0,material.Ka[2]/255.0));
        pushMatrix();
            uploadModelView();
            BUNNY.draw(gl, program, options.Mode);
        popMatrix();
    }

    function World()
    {
        pushMatrix();
            Ground();
        popMatrix();
        pushMatrix();
            multScale([15.0,15.0,15.0]);
            Bunny();
        popMatrix();
    }

    function render()
    {
        mProjection = perspective(camera.Fovy, aspect, camera.Near, camera.Far);
        mView = mult(lookAt([camera.eye[0], camera.eye[1], camera.eye[2]],
            [camera.at[0], camera.at[1], camera.at[2]], 
            [camera.up[0], camera.up[1], camera.up[2]]),
            mult(rotateY(camera.Gama), rotateX(camera.Theta)));

        window.requestAnimationFrame(render);
        gl.useProgram(program);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        
        const uKa = gl.getUniformLocation(program, "uMaterial.Ka");
        gl.uniform3fv(uKa, flatten(material.Ka));
        const uKd = gl.getUniformLocation(program, "uMaterial.Kd");
        gl.uniform3fv(uKd, flatten(material.Kd));
        const uKs = gl.getUniformLocation(program, "uMaterial.Ks");
        gl.uniform3fv(uKs, flatten(material.Ks));
        const uShininess = gl.getUniformLocation(program, "uMaterial.shininess");
        gl.uniform1f(uShininess, material.shininess);


        const uNLights = gl.getUniformLocation(program, "uNLights");
        gl.uniform1f(uNLights, lights.length);

        for(let l = 0; l < lights.length; l++) {
            const uKaOfLightl = gl.getUniformLocation(program, "uLights["+ l +"].ambient");
            gl.uniform3fv(uKaOfLightl, flatten(lights[l].ambient));
            const uKdOfLightl = gl.getUniformLocation(program, "uLights["+ l +"].diffuse");
            gl.uniform3fv(uKdOfLightl, flatten(lights[l].diffuse));
            const uKsOfLightl = gl.getUniformLocation(program, "uLights["+ l +"].specular");
            gl.uniform3fv(uKsOfLightl, flatten(lights[l].specular));
            const uPosition = gl.getUniformLocation(program, "uLights["+ l +"].position");
            gl.uniform4fv(uPosition, flatten(lights[l].position));
            const uAxis = gl.getUniformLocation(program, "uLights["+ l +"].axis");
            gl.uniform3fv(uAxis, flatten(lights[l].axis));
            const uApperture = gl.getUniformLocation(program, "uLights["+ l +"].apperture");
            gl.uniform1f(uApperture, lights[l].apperture);
            const uCutoff = gl.getUniformLocation(program, "uLights["+ l +"].cutoff");
            gl.uniform1f(uCutoff, lights[l].cutoff);
        }

        loadMatrix(mView);

        pushMatrix();
            World();
        popMatrix();

    }
}

const urls = ["phong.vert", "phong.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
