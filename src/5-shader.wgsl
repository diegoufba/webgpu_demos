struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

@group(0) @binding(0) var<storage> points: array<vec3<f32>>;
@group(0) @binding(5) var<uniform> matrix: TransformMatrix ;

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4f {
    var point: vec3<f32> = points[vertex];
    let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(point, 1.0);
    return position;
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 1, 1, 1);
    // return vec4f(1, 0, 0, 1);
}