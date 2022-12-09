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

const position = new function(){
    this.x = 0;
    this.y = 0;
    this.z = 10;
    this.w = 1;

}

const intensity = new function(){
    this.ambient = 0;
    this.diffuse = 0;
    this.specular = 0;
}

const axis = new function(){
    this.x = 0;
    this.y = 0;
    this.z = 0;
}

const apperture = new function(){
    this.apperture = 0;
}

const cutoff = new function(){
    this.cutoff  = 0;
}

const material = new function(){
    this.Ka = 0;
    this.Kd= 0;
    this.Ks = 0;
    this.shininess = 0;

}



const worldOpt = new function(){
    this.Mode = NaN;
    this.Speed = 1;
}

const position = new function(){
    this.x = 0;
    this.y = 0;
    this.z = 10;
    this.w = 1;

}

const intensity = new function(){
    this.ambient = 0;
    this.diffuse = 0;
    this.specular = 0;
}

const axis = new function(){
    this.x = 0;
    this.y = 0;
    this.z = 0;
}

const apperture = new function(){
    this.apperture = 0;
}

const cutoff = new function(){
    this.cutoff  = 0;
}

const material = new function(){
    this.Ka = 0;
    this.Kd= 0;
    this.Ks = 0;
    this.shininess = 0;

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

    //Camera

    const camOptFolder = gui.addFolder('Camera');
    var gamaCam = camOptFolder.add(camera, "Gama", -180, 180).name("Gama (º)").listen();
    var thetaCam = camOptFolder.add(camera, "Theta", -180, 180).name("Theta (º)").listen();
    camOptFolder.add(camera, "Fovy", 30, 60).listen();
    camOptFolder.add(camera, "Near", 0.1, 10).listen();
    camOptFolder.add(camera, "Far", 2, 50).listen();
    camOptFolder.add(resetCam, 'reset').name("Reset Values");
    camOptFolder.open();

    const eyeCam = camOptFolder.addFolder('eye');
    const atCam = camOptFolder.addFolder('at');
    const upCam = camOptFolder.addFolder('up');

    // Lights

    const lightsOptFolder = gui.addFolder('Lights');
  
    //Lights 1

    const lights1OptFolder = lightsOptFolder.addFolder('Light1');

    const lights1PositionFolder = lights1OptFolder.addFolder('position');
    lights1PositionFolder.add(position,"x",0,10).listen();
    lights1PositionFolder.add(position,"y",0,10).listen();
    lights1PositionFolder.add(position,"w",0,10).listen();
    lights1PositionFolder.add(position,"z",0,10).listen();

    const lights1IntensitiesFolder = lights1OptFolder.addFolder('intensities');
    lights1IntensitiesFolder.add(intensity,"ambient",0,200).listen();
    lights1IntensitiesFolder.add(intensity,"diffuse",0,200).listen();
    lights1IntensitiesFolder.add(intensity,"specular",0,200).listen();

    
    const lights1AxisFolder = lights1OptFolder.addFolder('axis');
    lights1AxisFolder.add(axis,"x",0,10).listen();
    lights1AxisFolder.add(axis,"y",0,10).listen();
    lights1AxisFolder.add(axis,"z",-1,10).listen();

    lights1OptFolder.add(apperture,"apperture",0,200).listen();
    lights1OptFolder.add(cutoff,"cutoff",0,200).listen();

    //Lights 2

    const lights2OptFolder = lightsOptFolder.addFolder('Light2');

    const lights2PositionFolder = lights2OptFolder.addFolder('position');
    lights2PositionFolder.add(position,"x",0,10).listen();
    lights2PositionFolder.add(position,"y",0,10).listen();
    lights2PositionFolder.add(position,"w",0,10).listen();
    lights2PositionFolder.add(position,"z",0,10).listen();

    const lights2IntensitiesFolder = lights2OptFolder.addFolder('intensities');
    lights2IntensitiesFolder.add(intensity,"ambient",0,200).listen();
    lights2IntensitiesFolder.add(intensity,"diffuse",0,200).listen();
    lights2IntensitiesFolder.add(intensity,"specular",0,200).listen();

    const lights2AxisFolder = lights2OptFolder.addFolder('axis');
    lights2AxisFolder.add(axis,"x",0,10).listen();
    lights2AxisFolder.add(axis,"y",0,10).listen();
    lights2AxisFolder.add(axis,"z",-1,10).listen();

    lights2OptFolder.add(apperture,"apperture",0,200).listen();
    lights2OptFolder.add(cutoff,"cutoff",0,200).listen();
    
    //Lights 3

    const lights3OptFolder = lightsOptFolder.addFolder('Light3');

    const lights3PositionFolder = lights3OptFolder.addFolder('position');
    lights3PositionFolder.add(position,"x",0,10).listen();
    lights3PositionFolder.add(position,"y",0,10).listen();
    lights3PositionFolder.add(position,"w",0,10).listen();
    lights3PositionFolder.add(position,"z",0,10).listen();

    const lights3IntensitiesFolder = lights3OptFolder.addFolder('intensities');
    lights3IntensitiesFolder.add(intensity,"ambient",0,200).listen();
    lights3IntensitiesFolder.add(intensity,"diffuse",0,200).listen();
    lights3IntensitiesFolder.add(intensity,"specular",0,200).listen();

    const lights3AxisFolder = lights3OptFolder.addFolder('axis');
    lights3AxisFolder.add(axis,"x",0,10).listen();
    lights3AxisFolder.add(axis,"y",0,10).listen();
    lights3AxisFolder.add(axis,"z",-1,10).listen();

    lights3OptFolder.add(apperture,"apperture",0,200).listen();
    lights3OptFolder.add(cutoff,"cutoff",0,200).listen();
    
    //Material

    const materialOptFolder = gui.addFolder('Material');

    materialOptFolder.add(material,"Ka",0,150).listen();
    materialOptFolder.add(material,"Kd",0,150).listen();
    materialOptFolder.add(material,"Ks",0,200).listen();
    materialOptFolder.add(material,"shininess",0,200).listen();

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