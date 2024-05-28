struct Params {
    shape: u32,
    gridSize: u32,
    resolution: f32,
    sideLength: f32
  };


@group(0) @binding(0) var<storage> points: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> params: Params;

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4f {
    let point: vec2<f32> = points[vertex];
    let pointClipSpace: vec2<f32> = ((point / params.resolution) * 2) -1;
    return vec4f(pointClipSpace, 0.0, 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 1, 1, 1);
}