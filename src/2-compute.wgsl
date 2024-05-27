

fn getState(a: f32, b: f32, c: f32, d: f32) -> f32 {
    return a * 8 + b * 4 + c * 2 + d;
}

fn isInside(x: f32, y: f32, selector: i32) -> f32 {
    // var xc: f32 = params.resolution / 2.0;
    // var yc: f32 = params.resolution / 2.0;
    let resolution: f32 = 512;
    var xc: f32 = resolution / 2.0;
    var yc: f32 = resolution / 2.0;

    // Variáveis comuns para algumas das funções
    var xp = x - xc;
    var yp = y - yc;

    switch (selector) {
        case 1: {
            // Função 1: Estrela
            var theta = atan2(yp, xp);
            var r = sqrt(xp * xp + yp * yp);
            var n: f32 = 10.0;
            var star_r = (resolution / 4.0) + (resolution / 8.0) * sin(n * theta);
            if r <= star_r {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        case 2: {
            // Função 2: Infinito
            var a: f32 = resolution / 4.0;
            var left = (xp * xp + yp * yp) * (xp * xp + yp * yp);
            var right = 2.0 * a * a * (xp * xp - yp * yp);
            if left <= right {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        case 3: {
            // Função 3: Círculo
            var rCircle: f32 = resolution / 2.0 - 100.0;
            var fCircle = pow(x - xc, 2.0) + pow(y - yc, 2.0) - pow(rCircle, 2.0);
            if fCircle <= 0.0 {
                return 1.0;
            } else {
                return 0.0;
            }
        }
        case 4: {
            // Função 4: Coração
            var xpHeart = (x - xc) / (resolution / 3.0);
            var ypHeart = (y - yc) / (resolution / 3.0);
            var fHeart = pow(xpHeart * xpHeart + ypHeart * ypHeart - 1.0, 3.0) - xpHeart * xpHeart * pow(ypHeart, 3.0);
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


    @compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let resolution: f32 = 512;
    let gridSize: f32 = resolution / 4;
    let sideLength: f32 = resolution / gridSize;
    var shape: i32 = 3;

    var row: u32 = global_id.x;
    var col: u32 = global_id.y;
    var x: f32 = f32(row) * sideLength;
    var y: f32 = f32(col) * sideLength;

    var pos: u32 = row * u32(gridSize) + col;
    const nulo = vec2<f32>(0.0, 0.0);

    var a = vec2<f32>(x + sideLength * 0.5, y);
    var b = vec2<f32>(x + sideLength, y + sideLength * 0.5);
    var c = vec2<f32>(x + sideLength * 0.5, y + sideLength);
    var d = vec2<f32>(x, y + sideLength * 0.5);


    var state: f32 = getState(isInside(x, y, shape), isInside(x + sideLength, y, shape), isInside(x + sideLength, y + sideLength, shape), isInside(x, y + sideLength, shape));

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