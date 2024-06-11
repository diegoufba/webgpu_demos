struct Params {
    shape: u32,
    gridSize: u32,
    interpolation: u32,
    sideLength: f32
  };

fn getState(fp1: f32, fp2: f32, fp3: f32, fp4: f32) -> f32 {
    var a: f32;
    var b: f32;
    var c: f32;
    var d: f32;

    if fp1 <= 0.0 {
        a = 1.0;
    } else {
        a = 0.0;
    }
    if fp2 <= 0.0 {
        b = 1;
    } else {
        b = 0.0;
    }
    if fp3 <= 0.0 {
        c = 1;
    } else {
        c = 0.0;
    }
    if fp4 <= 0.0 {
        d = 1;
    } else {
        d = 0.0;
    }

    return a * 8 + b * 4 + c * 2 + d;
}

fn functionValue(p: vec2f, selector: u32) -> f32 {
    let x = p.x;
    let y = p.y;
    var xc: f32 = 0.5;
    var yc: f32 = 0.5;

    // Variáveis comuns para algumas das funções
    let xp = x - xc;
    let yp = y - yc;

    switch (selector) {
        case 1: {
            // Função 1: Estrela
            let theta = atan2(yp, xp);
            let r = sqrt(xp * xp + yp * yp);
            let n: f32 = 10.0;
            let star_r = 0.3 + 0.15 * sin(n * theta);
            return r - star_r;
        }
        case 2: {
            // Função 2: Infinito
            let a: f32 = 0.3;
            let left = (xp * xp + yp * yp) * (xp * xp + yp * yp);
            let right = 2.0 * a * a * (xp * xp - yp * yp);
            return left - right;
        }
        case 3: {
            // Função 3: Círculo
            let rCircle: f32 = 0.3; // Ajuste de raio
            let fCircle = pow(x - xc, 2.0) + pow(y - yc, 2.0) - pow(rCircle, 2.0);
            return fCircle;
        }
        case 4: {
            // Função 4: Coração
            let xpHeart = (x - xc) / 0.3;
            let ypHeart = (y - yc) / 0.3;
            let fHeart = pow(xpHeart * xpHeart + ypHeart * ypHeart - 1.0, 3.0) - xpHeart * xpHeart * pow(ypHeart, 3.0);
            return fHeart;
        }
        default: {
            return 1.0;
        }
    }
}

fn interpolatedPoints(p1: vec2f, p2: vec2f, fp1: f32, fp2: f32) -> vec2f {
    let t = fp1 / (fp1 - fp2);
    let px = p1.x + t * (p2.x - p1.x);
    let py = p1.y + t * (p2.y - p1.y);
    return vec2f(px, py);
}

    @group(0) @binding(1) var<storage,read_write> point: array<vec2<f32>>;
    @group(0) @binding(2) var<uniform> params: Params;


    @compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let row: u32 = global_id.x;
    let col: u32 = global_id.y;
    let x: f32 = f32(row) * params.sideLength;
    let y: f32 = f32(col) * params.sideLength;


    let pos: u32 = row * u32(params.gridSize) + col;
    let nulo = vec2<f32>(0.0, 0.0);

    var a: vec2<f32> = nulo;
    var b: vec2<f32> = nulo;
    var c: vec2<f32> = nulo;
    var d: vec2<f32> = nulo;

    let p1: vec2f = vec2f(x, y);
    let p2 = vec2f(x + params.sideLength, y);
    let p3 = vec2f(x + params.sideLength, y + params.sideLength);
    let p4 = vec2f(x, y + params.sideLength);

    let fp1: f32 = functionValue(p1, params.shape);
    let fp2: f32 = functionValue(p2, params.shape);
    let fp3: f32 = functionValue(p3, params.shape);
    let fp4: f32 = functionValue(p4, params.shape);

    let lastRowOrCol: bool = ((row == params.gridSize - 1) | (col == params.gridSize - 1));

    if !lastRowOrCol {

        if params.interpolation == 1 {
            a = interpolatedPoints(p1, p2, fp1, fp2);
            b = interpolatedPoints(p2, p3, fp2, fp3);
            c = interpolatedPoints(p3, p4, fp3, fp4);
            d = interpolatedPoints(p4, p1, fp4, fp1);
        } else {
            a = vec2<f32>(x + params.sideLength * 0.5, y);
            b = vec2<f32>(x + params.sideLength, y + params.sideLength * 0.5);
            c = vec2<f32>(x + params.sideLength * 0.5, y + params.sideLength);
            d = vec2<f32>(x, y + params.sideLength * 0.5);
        }
    }

    let state: f32 = getState(fp1, fp2, fp3, fp4);

    switch (u32(state)) {
        case 1,14: {
            point[pos * 4 + 0] = c;
            point[pos * 4 + 1] = d;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
        case 2,13: {
            point[pos * 4 + 0] = b;
            point[pos * 4 + 1] = c;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
        case 3,12: {
            point[pos * 4 + 0] = b;
            point[pos * 4 + 1] = d;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
        case 4,11: {
            point[pos * 4 + 0] = a;
            point[pos * 4 + 1] = b;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
        case 5: {
            point[pos * 4 + 0] = a;
            point[pos * 4 + 1] = d;
            point[pos * 4 + 2] = b;
            point[pos * 4 + 3] = c;
        }
        case 6,9: {
            point[pos * 4 + 0] = a;
            point[pos * 4 + 1] = c;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
        case 7,8: {
            point[pos * 4 + 0] = a;
            point[pos * 4 + 1] = d;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
        case 10: {
            point[pos * 4 + 0] = a;
            point[pos * 4 + 1] = b;
            point[pos * 4 + 2] = c;
            point[pos * 4 + 3] = d;
        }
        default: {
            point[pos * 4 + 0] = nulo;
            point[pos * 4 + 1] = nulo;
            point[pos * 4 + 2] = nulo;
            point[pos * 4 + 3] = nulo;
        }
    }
}