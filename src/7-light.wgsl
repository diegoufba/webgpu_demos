struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f,
    normal: mat3x3f
}

struct VertexInput {
    @location(0) pos: vec3f,
    @location(1) uv: vec2f,
    @location(2) normalPos: vec3f
}
struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(1) uv: vec2f,
    @location(2) normalPos: vec3f,
    @location(3) surfaceToLight: vec3f
}

@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(input.pos,1.0);
    var output: VertexOutput;
    output.pos = position;
    output.uv = input.uv;

    // Corrige a normal
    output.normalPos = matrix.normal * input.normalPos;

    let surfaceWorldPosition = (matrix.model * vec4f(input.pos,1.0)).xyz;

    // let lightPosition = vec3f(-10,30,20); //uniform
    let lightPosition = vec3f(-3,3,3); //uniform

    output.surfaceToLight = lightPosition - surfaceWorldPosition;

    return output;
}

@group(0) @binding(1) var mySample:sampler;
@group(0) @binding(2) var myTexure: texture_2d<f32>;


@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    // let lightColor = vec4f(0.2, 1, 0.2, 1); // uniform
    let lightColor = vec4f(1, 1, 1, 1); // uniform

    // let lightDirection = normalize(vec3f(-0.5, -0.7, -1));

    let normalPos = normalize(fragInput.normalPos);

    let surfaceLightDirection = normalize(fragInput.surfaceToLight);

    // let light = dot(normalPos, -lightDirection);

    let light = dot(normalPos,surfaceLightDirection);

    let finalColor = lightColor * light;

    // return textureSample(myTexure, mySample, fragInput.uv);
    return vec4f(finalColor.rgb, 1);
}