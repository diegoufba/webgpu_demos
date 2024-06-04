struct Params {
    shape: u32,
    gridSize: u32,
    interpolation: u32,
    sideLength: f32
  };

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

fn functionValue(p: vec3f, selector: u32) -> f32 {
    let x = p.x;
    let y = p.y;
    let z = p.z;
    var xc: f32 = 1.0;
    var yc: f32 = 1.0;
    var zc: f32 = 1.0;

    // // Variáveis comuns para algumas das funções
    // let xp = x - xc;
    // let yp = y - yc;
    // let zp = z - zc;

    switch (selector) {
        case 1: {
            // Função 3: Círculo
            let rSphere: f32 = 1.0 - 0.1; // Ajuste de raio
            let fSphere = pow(x - xc, 2.0) + pow(y - yc, 2.0) + pow(z - zc, 2.0) - pow(rSphere, 2.0);
            return fSphere;
        }
        default: {
            return 1.0;
        }
    }
}


// fn interpolatedPoints(p1: vec3f, p2: vec3f, fp1: f32, fp2: f32) -> vec3f {
//     let t = fp1 / (fp1 - fp2);
//     let px = p1.x + t * (p2.x - p1.x);
//     let py = p1.y + t * (p2.y - p1.y);
//     let pz = p1.z + t * (p2.z - p1.z);
//     return vec3f(px, py, pz);
// }


    @group(0) @binding(0) var<storage> pointRead: array<vec3<f32>>;
    @group(0) @binding(1) var<storage,read_write> point: array<vec3<f32>>;
    @group(0) @binding(2) var<uniform> params: Params;
    // @group(0) @binding(3) var<uniform> triTable: array<array<i32,16>,256>;
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
    let nulo = vec3<f32>(0.0, 0.0, 0.0);

    var a: vec3<f32> = nulo;
    var b: vec3<f32> = nulo;
    var c: vec3<f32> = nulo;
    var d: vec3<f32> = nulo;


    let p3: vec3f = vec3f(x, y, z);
    let p2: vec3f = vec3f(x + params.sideLength, y, z);
    let p6: vec3f = vec3f(x + params.sideLength, y + params.sideLength, z);
    let p7: vec3f = vec3f(x, y + params.sideLength, z);


    let p0: vec3f = vec3f(x, y, z + params.sideLength);
    let p1: vec3f = vec3f(x + params.sideLength, y, z + params.sideLength);
    let p5: vec3f = vec3f(x + params.sideLength, y + params.sideLength, z + params.sideLength);
    let p4: vec3f = vec3f(x, y + params.sideLength, z + params.sideLength);


    let fp0: f32 = functionValue(p0, params.shape);
    let fp1: f32 = functionValue(p1, params.shape);
    let fp2: f32 = functionValue(p2, params.shape);
    let fp3: f32 = functionValue(p3, params.shape);
    let fp4: f32 = functionValue(p4, params.shape);
    let fp5: f32 = functionValue(p5, params.shape);
    let fp6: f32 = functionValue(p6, params.shape);
    let fp7: f32 = functionValue(p7, params.shape);


    let e2 = vec3f(x + params.sideLength * 0.5, y, z);
    let e10 = vec3f(x + params.sideLength, y + params.sideLength * 0.5, z);
    let e6 = vec3f(x + params.sideLength * 0.5, y + params.sideLength, z);
    let e11 = vec3f(x, y + params.sideLength * 0.5, z);

    let e0 = vec3f(x + params.sideLength * 0.5, y, z + params.sideLength);
    let e9 = vec3f(x + params.sideLength, y + params.sideLength * 0.5, z + params.sideLength);
    let e4 = vec3f(x + params.sideLength * 0.5, y + params.sideLength, z + params.sideLength);
    let e8 = vec3f(x, y + params.sideLength * 0.5, z + params.sideLength);

    let e3 = vec3f(x, y, z + params.sideLength * 0.5);
    let e7 = vec3f(x, y + params.sideLength, z + params.sideLength * 0.5);

    let e1 = vec3f(x + params.sideLength, y, z + params.sideLength * 0.5);
    let e5 = vec3f(x + params.sideLength, y + params.sideLength, z + params.sideLength * 0.5);

    let points = array<vec3f,12>(e0, e1, e2, e3, e4, e5, e6, e7, e8, e9, e10, e11);

    // if params.interpolation == 0 {
    //     a = interpolatedPoints(p1, p2, fp1, fp2);
    //     b = interpolatedPoints(p2, p3, fp2, fp3);
    //     c = interpolatedPoints(p3, p4, fp3, fp4);
    //     d = interpolatedPoints(p4, p1, fp4, fp1);
    // } else {
    //     a = vec2<f32>(x + params.sideLength * 0.5, y);
    //     b = vec2<f32>(x + params.sideLength, y + params.sideLength * 0.5);
    //     c = vec2<f32>(x + params.sideLength * 0.5, y + params.sideLength);
    //     d = vec2<f32>(x, y + params.sideLength * 0.5);
    // }


    let state: f32 = getState(fp0, fp1, fp2, fp3, fp4, fp5, fp6, fp7);
    let triTableA: vec4i = triTable[u32(state * 3 + 0)];
    let triTableB: vec4i = triTable[u32(state * 3 + 1)];
    let triTableC: vec4i = triTable[u32(state * 3 + 2)];


    let ta0 = triTableA[0];
    if ta0 != -1 {
        point[pos * 12 + 0] = points[ta0];
    }

    let ta1 = triTableA[1];
    if ta1 != -1 {
        point[pos * 12 + 1] = points[ta1];
    }

    let ta2 = triTableA[2];
    if ta2 != -1 {
        point[pos * 12 + 2] = points[ta2];
    }

    let ta3 = triTableA[3];
    if ta3 != -1 {
        point[pos * 12 + 3] = points[ta3];
    }


    let ta4 = triTableB[0];
    if ta4 != -1 {
        point[pos * 12 + 4] = points[ta4];
    }
    let ta5 = triTableB[1];
    if ta5 != -1 {
        point[pos * 12 + 5] = points[ta5];
    }
    let ta6 = triTableB[2];
    if ta6 != -1 {
        point[pos * 12 + 6] = points[ta6];
    }
    let ta7 = triTableB[3];
    if ta7 != -1 {
        point[pos * 12 + 7] = points[ta7];
    }


    let ta8 = triTableC[0];
    if ta8 != -1 {
        point[pos * 12 + 8] = points[ta8];
    }
    let ta9 = triTableC[1];
    if ta9 != -1 {
        point[pos * 12 + 9] = points[ta9];
    }
    let ta10 = triTableC[2];
    if ta10 != -1 {
        point[pos * 12 + 10] = points[ta10];
    }
    let ta11 = triTableC[3];
    if ta11 != -1 {
        point[pos * 12 + 11] = points[ta11];
    }

    // point[pos * 12 + 0] = select(nulo, points[0], triTableA[0] != -1);
    // point[pos * 12 + 1] = select(nulo, points[1], triTableA[1] != -1);
    // point[pos * 12 + 2] = select(nulo, points[2], triTableA[2] != -1);
    // point[pos * 12 + 3] = select(nulo, points[3], triTableA[3] != -1);

    // point[pos * 12 + 4] = select(nulo, points[4], triTableB[0] != -1);
    // point[pos * 12 + 5] = select(nulo, points[5], triTableB[1] != -1);
    // point[pos * 12 + 6] = select(nulo, points[6], triTableB[2] != -1);
    // point[pos * 12 + 7] = select(nulo, points[7], triTableB[3] != -1);

    // point[pos * 12 + 8] = select(nulo, points[8], triTableC[0] != -1);
    // point[pos * 12 + 9] = select(nulo, points[9], triTableC[1] != -1);
    // point[pos * 12 + 10] = select(nulo, points[10], triTableC[2] != -1);
    // point[pos * 12 + 11] = select(nulo, points[11], triTableC[3] != -1);
}