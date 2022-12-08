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
let mouseIsDown = false;
let time = 0;
let mView;

const camera = new function(){
    this.Gama = 0;
    this.Theta = 0;
    this.Fovy = 45;
    this.Near = 0.1;
    this.Far = 30;
}

const worldOpt = new function(){
    this.Mode = NaN;
    this.Speed = 1;
}

const resetCam = { 
    reset:function() {
        camera.Gama = 0;
        camera.Theta = 0;
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
    
    const worldOptFolder = gui.addFolder('Options');
    var mode = worldOptFolder.add(worldOpt, "Mode", {Lines: "gl.LINES", Solid: "gl.TRIANGLES"}).setValue("gl.TRIANGLES");
    worldOpt.Mode = gl.TRIANGLES;
    worldOptFolder.open();

    const camOptFolder = gui.addFolder('Camera');
    var gamaCam = camOptFolder.add(camera, "Gama", -180, 180).name("Gama (º)").listen();
    var thetaCam = camOptFolder.add(camera, "Theta", -180, 180).name("Theta (º)").listen();
    camOptFolder.add(camera, "Fovy", 30, 60).listen();
    camOptFolder.add(camera, "Near", 0.1, 10).listen();
    camOptFolder.add(camera, "Far", 2, 50).listen();
    camOptFolder.add(resetCam, 'reset').name("Reset Values");
    camOptFolder.open();

    gamaCam.onChange( function(){
        mView = mult(lookAt([-15, 5, 0], [0, 0, 0], [0, 1, 0]), mult(rotateY(camera.Gama), rotateX(camera.Theta)));
    });

    thetaCam.onChange( function(){
        mView = mult(lookAt([-15, 5, 0], [0, 0, 0], [0, 1, 0]), mult(rotateY(camera.Gama), rotateX(camera.Theta)));
    });

    mode.onChange( function(){
        if(worldOptFolder.__controllers[0].object.Mode == 'gl.LINES')
            worldOpt.Mode = gl.LINES;
        else
            worldOpt.Mode = gl.TRIANGLES;
    });

    let initpos;
    canvas.addEventListener("mousedown", function(event) {
        mouseIsDown = true;
        initpos = getCursorPosition(canvas, event);
    });

    let finalpos;
    canvas.addEventListener("mouseup", function(event) {
        mouseIsDown = false;
        finalpos = getCursorPosition(canvas, event);
    });


    canvas.addEventListener("mousemove", function(event) {
        if(mouseIsDown){
        const pos = getCursorPosition(canvas, event);
        /*if(finalpos != null){
            pos[0] = finalpos[0];
            pos[1] = finalpos[1];
        } else {*/
            pos[0] -= initpos[0];
            pos[1] -= initpos[1];
        //}
        camera.Gama > 180 ? camera.Gama = 180 : camera.Gama = pos[0] * 180;
        camera.Theta > 180 ? camera.Theta = 180 : camera.Theta = pos[1] * 180;
        mView = mult(lookAt([-15, 5, 0], [0, 0, 0], [0, 1, 0]), mult(rotateY(camera.Gama),rotateX(camera.Theta)));
        }
    });
    

    function getCursorPosition(canvas, event) 
    {
        const mx = event.offsetX;
        const my = event.offsetY;

        const x = ((mx / canvas.width * 2) - 1);
        const y = (((canvas.height - my)/canvas.height * 2) - 1);

        return vec2(x,y);
    }



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
        mProjection = perspective(camera.Fovy, aspect, camera.Near, camera.Far);
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
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), vec3(1.0, 0.0, 0.0));
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
            multTranslation([0.0,0.25,0.0]);
            multScale([15.0,15.0,15.0]);
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

        pushMatrix();
            World();
        popMatrix();

    }
}

const urls = ["phong.vert", "phong.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))