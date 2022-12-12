precision highp float;

const int MAX_LIGHTS = 8;

struct LightInfo {
    // Light colour intensities
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    // Light geometry
    vec4 position;  // Position/direction of light (in camera coordinates)
    vec3 axis;
    float apperture;
    float cutoff;
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform int uNLights; // Effective number of lights used

uniform LightInfo uLights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial;        // The material of the object being drawn

uniform vec3 uColor;

void main() {
       //for(int i = 0; i < MAX_LIGHTS; i++) {
              //if(i == uNLights) break;
       gl_FragColor = vec4(uColor,1.0);
}