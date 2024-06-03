struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

struct VertexInput {
    @location(0) pos: vec2f,
    @location(1) uv: vec2f,
    @builtin(instance_index) instance: u32,
}

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f
}

struct Quad {
    x: f32,
    y: f32,
    z: f32
}


@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;
@group(0) @binding(1) var<storage> translation_quads: array<Quad> ;
@group(0) @binding(4) var<uniform> isSprite: u32;
// @group(0) @binding(1) var<storage> translation_quads: array<vec3f> ;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {

    let translation = translation_quads[input.instance];
    let x: f32 = input.pos.x + translation.x;
    let y: f32 = input.pos.y + translation.y;
    let z: f32 = translation.z;

    //Objeto nas coordenadas do objeto
    let object_position = vec4f(x, y, z, 1.0);
    var position:vec4f;

    if isSprite == 1 {
        //Centro do objeto nas coordenadas do objeto
        let origin = vec4f(translation.x, translation.y, translation.z, 1);

        let world_origin = matrix.model * origin;
        let view_origin = matrix.view * world_origin;
        let world_to_view_translation = view_origin - world_origin;

        let world_pos = matrix.model * object_position;
        let view_pos = world_pos + world_to_view_translation;
        position = matrix.projection * view_pos;
    }
    else {
        position = matrix.projection * matrix.view * matrix.model * object_position;
    }

    var output: VertexOutput;
    output.pos = position;
    output.uv = input.uv;

    return output;
}


@group(0) @binding(2) var mySample: sampler;
@group(0) @binding(3) var myTexture: texture_2d<f32>;

@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    return textureSample(myTexture, mySample, fragInput.uv);
    // return vec4f(1,1,1,0);
}