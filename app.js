import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "./libs/utils.js";
import { ortho, lookAt, flatten, vec3, vec4, rotateX, rotateY, mult, inverse} from "./libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multRotationX, multRotationZ} from "./libs/stack.js";

import * as SPHERE from './libs/objects/sphere.js';
import * as CUBE from './libs/objects/cube.js';
import * as CYLINDER from './libs/objects/cylinder.js';
import * as PYRAMID from './libs/objects/pyramid.js';
import * as BUNNY from './libs/objects/bunny.js';
import * as TORUS from './libs/objects/torus.js';
import { GUI } from './libs/dat.gui.module.js';

const WORLDSCALE = 1.0; //World Scale

/** @type WebGLRenderingContext */
//Not supposed to change
let gl;
let time = 0;
let s = WORLDSCALE;
let mView = lookAt([1.0, 0.5, 1.0], [-5.0, -2.5, -5.0], [0,1,0]);

const camera = new function(){
    this.Zoom = 100;
    this.Gama = 0;
    this.Theta = 0;
}

const worldOpt = new function(){
    this.Mode = NaN;
    this.Speed = 1;
}

const resetCam = { 
    reset:function() {
        camera.Gama = 0;
        camera.Theta = 0;
        mView = mult(lookAt([1.0, 0.5, 1.0], [-5.0, -2.5, -5.0], [0,1,0]), mult(rotateY(camera.Gama), rotateX(camera.Theta))); 
        camera.Zoom = 100;
    }
};

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["phong.vert"], shaders["phong.frag"]);

    let mProjection = ortho(-aspect, aspect, -1, 1,-5,5);

    const gui = new GUI();
    
    const worldOptFolder = gui.addFolder('Options');
    var mode = worldOptFolder.add(worldOpt, "Mode", {Lines: "gl.LINES", Solid: "gl.TRIANGLES"}).setValue("gl.TRIANGLES");
    worldOpt.Mode = gl.TRIANGLES;
    worldOptFolder.open();

    const camOptFolder = gui.addFolder('Camera');
    camOptFolder.add(camera, "Zoom", 50, 1000).name("Zoom (%)").listen();
    var gamaCam = camOptFolder.add(camera, "Gama", -180, 180).name("Gama (º)").listen();
    var thetaCam = camOptFolder.add(camera, "Theta", -180, 180).name("Theta (º)").listen();
    camOptFolder.add(resetCam, 'reset').name("Reset Values");
    camOptFolder.open();

    gamaCam.onChange( function(){
        mView = mult(lookAt([1.0, 0.5, 1.0], [-5.0, -2.5, -5.0], [0,1,0]), mult(rotateY(camera.Gama), rotateX(camera.Theta)));
    });

    thetaCam.onChange( function(){
        thirdPerson = false;
        mView = mult(lookAt([1.0, 0.5, 1.0], [-5.0, -2.5, -5.0], [0,1,0]), mult(rotateY(camera.Gama), rotateX(camera.Theta)));
    });

    mode.onChange( function(){
        if(worldOptFolder.__controllers[0].object.Mode == 'gl.LINES')
            worldOpt.Mode = gl.LINES;
        else
            worldOpt.Mode = gl.TRIANGLES;
    });

    document.onkeydown = function(event) {
        switch(event.key) {
            case "ArrowUp":
            break;
            case "ArrowDown":
            break;
            case "ArrowLeft":
            break;
        }
    };
    document.onkeyup = function(event) {
        switch(event.key) {
            case "ArrowLeft":
            break;
            case " ":
            break;
        }
    }
    
    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    SPHERE.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);
    BUNNY.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);

    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-aspect, aspect, -1, 1, -5, 5);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function Ground()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), vec3(1.0, 1.0, 1.0)); //Grey Ground Color
        pushMatrix();
            multScale([10.0, 0.5 , 10.0]);
            uploadModelView();
            CUBE.draw(gl, program, worldOpt.Mode);
        popMatrix();
    }

    function Bunny()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), vec3(1.0, 0.0, 1.0));
        pushMatrix();
            uploadModelView();
            BUNNY.draw(gl, program, worldOpt.Mode);
        popMatrix();
    }


    function World()
    {
        pushMatrix();
            Ground();
        popMatrix();
        pushMatrix();
        multTranslation([0.0,0.4,0.0]);

        Bunny();
        popMatrix();
        
    }

    function render()
    {
        time += worldOpt.Speed;
        window.requestAnimationFrame(render);
        gl.useProgram(program);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        loadMatrix(mView);

        s = camera.Zoom/100 * WORLDSCALE;
        pushMatrix();
            multScale([s,s,s]);
            World();
        popMatrix();

    }
}

const urls = ["phong.vert", "phong.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))