struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

struct Params {
    time: f32,
    kx: f32,
    ky: f32,
    height: f32
}

struct VertexInput {
    @location(0) pos: vec2f,
    @location(1) uv: vec2f
}

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f
}

@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;
@group(0) @binding(1) var<uniform> params: Params;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {

    var x: f32 = sin(input.pos.x * params.kx + params.time);
    var y: f32 = cos(input.pos.y * params.ky + params.time);
    var z: f32 = ((x + y) * params.height) / 10;

    let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(input.pos.x, input.pos.y, z, 1.0);
    // let position: vec4f = transformUBO.projection * transformUBO.view * transformUBO.model * vec4f(input.pos,0.0, 1.0);

    var output: VertexOutput;
    output.pos = position;
    output.uv = input.uv;

    return output;
}

@group(0) @binding(2) var mySample: sampler;
@group(0) @binding(3) var myTexture: texture_2d<f32>;

@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    // return vec4f(1.0, 1.0, 1.0, 1.0);
    return textureSample(myTexture, mySample, fragInput.uv);
}