struct Params {
    shape: u32,
    gridSize: u32,
    interpolation: u32,
    sideLength: f32
  };

struct Point {
    x: f32,
    y: f32,
    z: f32
}

fn isInside(f: f32) -> f32 {
    if f <= 0.0 {
        return 1.0;
    } else {
        return 0.0;
    }
} 

fn getState(fp0: f32, fp1: f32, fp2: f32, fp3: f32, fp4: f32, fp5: f32, fp6: f32, fp7: f32) -> f32 {
    var a: f32 = isInside(fp0);
    var b: f32 = isInside(fp1);
    var c: f32 = isInside(fp2);
    var d: f32 = isInside(fp3);

    var e: f32 = isInside(fp4);
    var f: f32 = isInside(fp5);
    var g: f32 = isInside(fp6);
    var h: f32 = isInside(fp7);

    return a * 128 + b * 64 + c * 32 + d * 16 + e * 8 + f * 4 + g * 2 + h;
}

fn functionValue(p: Point, selector: u32) -> f32 {
    let x = p.x;
    let y = p.y;
    let z = p.z;
    var xc: f32 = 1.0;
    var yc: f32 = 1.0;
    var zc: f32 = 1.0;

    switch (selector) {
    case 1: {
        // Função 3: Esfera
            let rSphere: f32 = 1.0 - 0.1; // Ajuste de raio
            let fSphere = pow(x - xc, 2.0) + pow(y - yc, 2.0) + pow(z - zc, 2.0) - pow(rSphere, 2.0);
            return fSphere;
        }
    case 2: {
        // Função 5: Cilindro
            let rCyl: f32 = 0.5; // Raio do cilindro
            let hCyl: f32 = 1.0; // Altura do cilindro
            let fCyl = max(pow(x - xc, 2.0) + pow(y - yc, 2.0) - pow(rCyl, 2.0), abs(z - zc) - hCyl);
            return fCyl;
        }
    case 3: {
        // Função 6: Cone
            let rCone: f32 = 0.5; // Raio da base do cone
            let hCone: f32 = 1.0; // Altura do cone
            let fCone = max(sqrt(pow(x - xc, 2.0) + pow(y - yc, 2.0)) - (rCone * (1.0 - (z - zc) / hCone)), abs(z - zc) - hCone);
            return fCone;
        }
    default: {
            return 1.0;
        }
}
}


fn interpolatedPoints(p1: Point, p2: Point, fp1: f32, fp2: f32) -> Point {
    let t = fp1 / (fp1 - fp2);
    let px = p1.x + t * (p2.x - p1.x);
    let py = p1.y + t * (p2.y - p1.y);
    let pz = p1.z + t * (p2.z - p1.z);
    return Point(px, py, pz);
}



    @group(0) @binding(0) var<storage> pointRead: array<Point>;
    @group(0) @binding(1) var<storage,read_write> point: array<Point>;
    @group(0) @binding(2) var<uniform> params: Params;
    @group(0) @binding(3) var<uniform> edgeTable: array<vec4<i32>,768>;
    @group(0) @binding(4) var<uniform> triTable: array<vec4<i32>,1024>;


    @compute @workgroup_size(4,4,4)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let row: u32 = global_id.x;
    let col: u32 = global_id.y;
    let depth: u32 = global_id.z;
    let x: f32 = f32(row) * params.sideLength;
    let y: f32 = f32(col) * params.sideLength;
    let z: f32 = f32(depth) * params.sideLength;


    // let pos: u32 = row * u32(params.gridSize) + col;
    let pos: u32 = depth * (params.gridSize * params.gridSize) + row * params.gridSize + col;
    let nulo = Point(0.0, 0.0, 0.0);

    let p3: Point = Point(x, y, z);
    let p2: Point = Point(x + params.sideLength, y, z);
    let p6: Point = Point(x + params.sideLength, y + params.sideLength, z);
    let p7: Point = Point(x, y + params.sideLength, z);


    let p0: Point = Point(x, y, z + params.sideLength);
    let p1: Point = Point(x + params.sideLength, y, z + params.sideLength);
    let p5: Point = Point(x + params.sideLength, y + params.sideLength, z + params.sideLength);
    let p4: Point = Point(x, y + params.sideLength, z + params.sideLength);


    let fp0: f32 = functionValue(p0, params.shape);
    let fp1: f32 = functionValue(p1, params.shape);
    let fp2: f32 = functionValue(p2, params.shape);
    let fp3: f32 = functionValue(p3, params.shape);
    let fp4: f32 = functionValue(p4, params.shape);
    let fp5: f32 = functionValue(p5, params.shape);
    let fp6: f32 = functionValue(p6, params.shape);
    let fp7: f32 = functionValue(p7, params.shape);

    var points = array<Point,12>(nulo, nulo, nulo, nulo, nulo, nulo, nulo, nulo, nulo, nulo, nulo, nulo);

    if params.interpolation == 1 {
        points[0] = interpolatedPoints(p0, p1, fp0, fp1);
        points[1] = interpolatedPoints(p1, p2, fp1, fp2);
        points[2] = interpolatedPoints(p2, p3, fp2, fp3);
        points[3] = interpolatedPoints(p0, p3, fp0, fp3);
        points[4] = interpolatedPoints(p4, p5, fp4, fp5);
        points[5] = interpolatedPoints(p5, p6, fp5, fp6);
        points[6] = interpolatedPoints(p6, p7, fp6, fp7);
        points[7] = interpolatedPoints(p4, p7, fp4, fp7);
        points[8] = interpolatedPoints(p0, p4, fp0, fp4);
        points[9] = interpolatedPoints(p1, p5, fp1, fp5);
        points[10] = interpolatedPoints(p2, p6, fp2, fp6);
        points[11] = interpolatedPoints(p3, p7, fp3, fp7);
    } else {
        points[2] = Point(x + params.sideLength * 0.5, y, z);
        points[10] = Point(x + params.sideLength, y + params.sideLength * 0.5, z);
        points[6] = Point(x + params.sideLength * 0.5, y + params.sideLength, z);
        points[11] = Point(x, y + params.sideLength * 0.5, z);
        points[0] = Point(x + params.sideLength * 0.5, y, z + params.sideLength);
        points[9] = Point(x + params.sideLength, y + params.sideLength * 0.5, z + params.sideLength);
        points[4] = Point(x + params.sideLength * 0.5, y + params.sideLength, z + params.sideLength);
        points[8] = Point(x, y + params.sideLength * 0.5, z + params.sideLength);
        points[3] = Point(x, y, z + params.sideLength * 0.5);
        points[7] = Point(x, y + params.sideLength, z + params.sideLength * 0.5);
        points[1] = Point(x + params.sideLength, y, z + params.sideLength * 0.5);
        points[5] = Point(x + params.sideLength, y + params.sideLength, z + params.sideLength * 0.5);
    }

    let state: f32 = getState(fp0, fp1, fp2, fp3, fp4, fp5, fp6, fp7);
    let triTableA: vec4i = triTable[u32(state * 4 + 0)];
    let triTableB: vec4i = triTable[u32(state * 4 + 1)];
    let triTableC: vec4i = triTable[u32(state * 4 + 2)];
    let triTableD: vec4i = triTable[u32(state * 4 + 3)];
    let triTableComplete = array<i32,16>(
        triTableA[0], triTableA[1], triTableA[2], triTableA[3],
        triTableB[0], triTableB[1], triTableB[2], triTableB[3],
        triTableC[0], triTableC[1], triTableC[2], triTableC[3],
        triTableD[0], triTableD[1], triTableD[2], triTableD[3],
    );

    let lastRowOrColDepth: bool = ((row == params.gridSize - 1) | (col == params.gridSize - 1)) | ((depth == params.gridSize - 1));

    if !lastRowOrColDepth {
        for (var i = 0; i < 15; i++) {
            let t = triTableComplete[i];
            if t != -1 {
                point[pos * 15 + u32(i)] = points[t];
            } else {
                point[pos * 15 + u32(i)] = nulo;
            }
        }
    } else {
        for (var i = 0; i < 15; i++) {
            point[pos * 15 + u32(i)] = nulo;
        }
    }
}