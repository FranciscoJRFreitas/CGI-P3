precision highp float;

attribute vec4 vNormal;
attribute vec4 vPosition;

uniform mat4 mModelView;
uniform mat4 mNormals;
uniform mat4 mProjection;

varying vec3 fPosition; // Normal vector in camera space
varying vec3 fNormal;
varying vec3 fViewer; // View vector in camera space

void main() 
{
    fNormal = (mNormals * vNormal).xyz;
    fViewer = vec3(0.0,0.0,1.0); 
    fPosition = (mModelView * vPosition).xyz;
    gl_Position = mProjection * mModelView * vPosition;
}