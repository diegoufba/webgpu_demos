struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

struct Point {
    x: f32,
    y: f32,
    z: f32
}

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) color: vec4f
}

@group(0) @binding(0) var<storage> points: array<Point>;
@group(0) @binding(5) var<uniform> matrix: TransformMatrix ;

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32) -> VertexOutput {
    var point: Point = points[vertex];
    let position: vec4f = matrix.projection * matrix.view * matrix.model * vec4f(point.x, point.y, point.z, 1.0);

    var output: VertexOutput;
    output.pos = position;


    let alternatingColor = point.x > 1.0 ;

    
    output.color = select(vec4f(0, 1, 0, 1), vec4f(0, 0, 1, 0), alternatingColor);
    return output;
}

@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    return vec4f(1.0, 1.0, 1.0, 1);
    // return vec4f(1.0, 0.0, 0.0, 1);
    // return fragInput.color;
}