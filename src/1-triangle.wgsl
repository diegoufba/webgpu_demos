struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;

@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
    let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(pos,0.0, 1.0);
    return position;
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1,0,0,1);
}