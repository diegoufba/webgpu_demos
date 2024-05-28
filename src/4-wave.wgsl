struct TransformData {
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

@group(0) @binding(0) var<uniform> transformUBO: TransformData;
@group(0) @binding(1) var<uniform> params: Params;

@vertex
fn vertexMain(@location(0) pos: vec3f) -> @builtin(position) vec4f {

    var x: f32 = sin(pos.x * params.kx + params.time);
    var y: f32 = cos(pos.y * params.ky + params.time);
    var z: f32 = ((x + y) * params.height) / 10;

    let position = transformUBO.projection * transformUBO.view * transformUBO.model * vec4f(pos.x, pos.y, z, 1.0);
    // return vec4f(pos,1.0);
    return vec4f(position);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    // return vec4f(0.5, 0.5, 0.5, 1.0);
    return vec4f(0.0667, 0.6824, 0.7333, 1.0);
    // return vec4f(1.0, 1.0, 1.0, 1.0);
}