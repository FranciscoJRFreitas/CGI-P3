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
    int onState;
    int type; // Type 0 if Point, type 1 if Directional, type 2 if Spotlight
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

varying vec3 fPosition;
varying vec3 fNormal;
varying vec3 fViewer;

uniform mat4 mModelView;
uniform mat4 mView;
uniform mat4 mViewNormals; 

uniform int uNLights; // Effective number of lights used
uniform LightInfo uLights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial;        // The material of the object being drawn
uniform vec3 uColor;

void main() 
{
    MaterialInfo material = uMaterial; //Make material changes to Bunny only
    if(uColor != vec3(0.0)) {
        material.Ka = uColor;
        material.Kd = uColor;
        material.Ks = uColor;
        material.shininess = 50.0;
    }

    for(int i=0; i<MAX_LIGHTS; i++) {
        if(i == uNLights) break;
        if(uLights[i].onState == 1) {
            vec3 L;

            if(uLights[i].type == 1) // this is, if uLights[i].position.w == 0 (Directional light)
                L = normalize((mViewNormals * uLights[i].position).xyz);
            else
                L = normalize((mView * uLights[i].position).xyz - fPosition);

            vec3 V = normalize(fViewer);
            vec3 N = normalize(fNormal);
            vec3 H = normalize(L+V);

            vec3 ambientColor = uLights[i].ambient/255.0 * material.Ka/255.0;
            vec3 diffuseColor = uLights[i].diffuse/255.0 * material.Kd/255.0;
            vec3 specularColor = uLights[i].specular/255.0 * material.Ks/255.0;

            if(uLights[i].type == 1)
                L = normalize((mViewNormals*uLights[i].position).xyz);
            else
                L = normalize((mView*uLights[i].position).xyz - fPosition);
            
            float intensity;
            if(uLights[i].type == 2) {
                float dotLVector = dot(L, -uLights[i].axis)/length(L) * length(-uLights[i].axis);
                float angle = acos(dotLVector);
                intensity = 0.0;
                if(radians(uLights[i].apperture) > angle)
                    intensity = pow(cos(angle), uLights[i].cutoff);
            }
            else {
                intensity = 1.0;
            }
        
            vec3 diffuse = max(dot(L,N), 0.0) * diffuseColor * intensity;
            vec3 specular = pow(max(dot(N,H), 0.0), uMaterial.shininess) * specularColor * intensity;

            if(dot(L,N) < 0.0) {
                specular = vec3(0.0);
            }

            gl_FragColor += vec4(ambientColor + diffuse + specular, 1.0);
        }
    }
}
