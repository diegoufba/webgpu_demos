struct VertexInput {
    @location(0) pos: vec2f,
    @location(1) uv: vec2f,
}

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.pos = vec4f(input.pos, 0, 1);
    output.uv = input.uv;
    // output.uv = vec2f(input.pos.x, 1.0 - input.pos.y);
    return output;
}

@group(0) @binding(0) var mySample: sampler;
@group(0) @binding(1) var myTexture: texture_2d<f32>;

@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    return textureSample(myTexture, mySample, fragInput.uv);
}