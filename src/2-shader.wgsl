@group(0) @binding(0) var<storage> linesIn: array<vec2<f32>>;

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4f {

    let point: vec2<f32> = linesIn[vertex];
    return vec4f(point/512 , 0.0 , 1.0);

}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1);
}