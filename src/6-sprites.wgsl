struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

struct VertexInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
}

struct Quad {
    x: f32,
    y: f32,
    z: f32
}


@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;
@group(0) @binding(1) var<storage> quads: array<Quad> ;
// @group(0) @binding(1) var<storage> quads: array<vec3f> ;

@vertex
fn vertexMain(input: VertexInput) -> @builtin(position) vec4f {
    let origin = vec4f(0, 0, 0, 1);
    let world_origin = matrix.model * origin;
    let view_origin = matrix.view * world_origin;
    let world_to_view_translation = view_origin - world_origin;

    let translation = quads[input.instance];
    let x: f32 = input.pos.x + translation.x;
    let y: f32 = input.pos.y + translation.y;
    let z: f32 = translation.z;

    let object_position = vec4f(x, y, z, 1.0);

    let world_pos = matrix.model * object_position;
    let view_pos = world_pos + world_to_view_translation;
    let position: vec4f = matrix.projection * view_pos;

    return position;
}


// @vertex
// fn vertexMain(input: VertexInput) -> @builtin(position) vec4f {
//     let translation = quads[input.instance];
//     let x: f32 = input.pos.x + translation.x;
//     let y: f32 = input.pos.y + translation.y;
//     let z: f32 = translation.z;
//     let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(x, y, z, 1.0);
//     return position;
// }

// @vertex
// fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
//     let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(pos,0.0, 1.0);
//     return position;
// }

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1);
}