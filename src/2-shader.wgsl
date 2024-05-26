struct Point {
    x: f32,
    y: f32,
    z: f32,
};

struct Points {
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point,
};

// @group(0) @binding(0) var<storage> point: Point;
@group(0) @binding(0) var<storage> linesIn: array<Points>;
// @group(0) @binding(0) var<storage> linesIn: array<Point>;

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4f {
    // return vec4f(1, 1, 1, 1);
    // let point: Point = linesIn[vertex].p1;
    // let maxCoord = max(point.x, point.y);

    // Divide todas as coordenadas por essa maior coordenada
    // let normalizedPoint = point / maxCoord;

    // Retorna as coordenadas normalizadas

    // return vec4f(point.x / maxCoord, point.y / maxCoord, 0, 1.0);
    let point: Point = linesIn[vertex].p1;
    return vec4f(point.x/512 , point.y/512 , point.z/512 , 1.0);
    // return vec4f(0.8 , 0.8, 0.0 , 1.0);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    return vec4f(1, 0, 0, 1);
}