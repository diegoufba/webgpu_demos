struct Params {
    shape: u32,
    gridSize: u32,
    sideLength: f32
  };

fn getState(a: f32, b: f32, c: f32, d: f32) -> f32 {
    return a * 8 + b * 4 + c * 2 + d;
}

fn isInside(x: f32, y: f32, selector: u32) -> f32 {
    var xc: f32 = 1.0;
    var yc: f32 = 1.0;

    // Variáveis comuns para algumas das funções
    let xp = x - xc;
    let yp = y - yc;

    switch (selector) {
        case 1: {
            // Função 1: Estrela
            let theta = atan2(yp, xp);
            let r = sqrt(xp * xp + yp * yp);
            let n: f32 = 10.0;
            let star_r = 0.5 + 0.25 * sin(n * theta);
            if r <= star_r {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        case 2: {
            // Função 2: Infinito
            let a: f32 = 0.5;
            let left = (xp * xp + yp * yp) * (xp * xp + yp * yp);
            let right = 2.0 * a * a * (xp * xp - yp * yp);
            if left <= right {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        case 3: {
            // Função 3: Círculo
            let rCircle: f32 = 1.0 - 0.1; // Ajuste de raio
            let fCircle = pow(x - xc, 2.0) + pow(y - yc, 2.0) - pow(rCircle, 2.0);
            if fCircle <= 0.0 {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        case 4: {
            // Função 4: Coração
            let xpHeart = (x - xc) / 0.75;
            let ypHeart = (y - yc) / 0.75;
            let fHeart = pow(xpHeart * xpHeart + ypHeart * ypHeart - 1.0, 3.0) - xpHeart * xpHeart * pow(ypHeart, 3.0);
            if fHeart <= 0.0 {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        default: {
            // Retorno padrão se o seletor não corresponder a nenhuma função conhecida
            return 0.0;
        }
    }
}


    @group(0) @binding(0) var<storage> pointRead: array<vec2<f32>>;
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

    let a = vec2<f32>(x + params.sideLength * 0.5, y);
    let b = vec2<f32>(x + params.sideLength, y + params.sideLength * 0.5);
    let c = vec2<f32>(x + params.sideLength * 0.5, y + params.sideLength);
    let d = vec2<f32>(x, y + params.sideLength * 0.5);


    let state: f32 = getState(isInside(x, y, params.shape), isInside(x + params.sideLength, y, params.shape), isInside(x + params.sideLength, y + params.sideLength, params.shape), isInside(x, y + params.sideLength, params.shape));

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