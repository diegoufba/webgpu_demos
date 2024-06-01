struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;

@vertex
fn vertexMain(@location(0) pos: vec3f) -> @builtin(position) vec4f {

    let position = matrix.projection * matrix.view * matrix.model * vec4f(pos,1.0);
    // return vec4f(pos,1.0);
    return vec4f(position);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    // return vec4f(0.5, 0.5, 0.5, 1.0);
    return vec4f(0.0, 0.0, 0.5, 1.0);
}