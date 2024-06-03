struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

struct VertexInput {
    @location(0) pos: vec3f,
    @location(1) uv: vec2f
}

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f
}

@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {

    let position = matrix.projection * matrix.view * matrix.model * vec4f(input.pos, 1.0);
    // return vec4f(pos,1.0);
    var output: VertexOutput;
    output.pos = position;
    output.uv = input.uv;
    return output;
}

@group(0) @binding(1) var mySample: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    // return vec4f(0.0, 0.0, 0.5, 1.0);
    return textureSample(myTexture, mySample, fragInput.uv);
}