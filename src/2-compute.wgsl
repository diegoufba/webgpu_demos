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

    @group(0) @binding(0) var<storage> linesIn: array<Points>;
    @group(0) @binding(1) var<storage,read_write> linesOut: array<Points>;


    @compute @workgroup_size(1, 1, 1)
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

    const nulo = Point(0., 0., 0.);

    var a = Point(x + sideLength * 0.5, y, 0.);
    var b = Point(x + sideLength, y + sideLength * 0.5, 0.);
    var c = Point(x + sideLength * 0.5, y + sideLength, 0.);
    var d = Point(x, y + sideLength * 0.5, 0.);


    var state: f32 = getState(isInside(x, y, shape), isInside(x + sideLength, y, shape), isInside(x + sideLength, y + sideLength, shape), isInside(x, y + sideLength, shape));

    switch (u32(state)) {
        case 1,14: {
            linesOut[pos] = Points(c, d, nulo, nulo) ;
        }
        case 2,13: {
            linesOut[pos] = Points(b, c, nulo, nulo) ;
        }
        case 3,12: {
            linesOut[pos] = Points(b, d, nulo, nulo) ;
        }
        case 4,11: {
            linesOut[pos] = Points(a, b, nulo, nulo) ;
        }
        case 5: {
            linesOut[pos] = Points(a, d, b, c) ;
        }
        case 6,9: {
            linesOut[pos] = Points(a, c, nulo, nulo) ;
        }
        case 7,8: {
            linesOut[pos] = Points(a, d, nulo, nulo) ;
        }
        case 10: {
            linesOut[pos] = Points(a, b, c, d) ;
        }
        default: {
            linesOut[pos] = Points(nulo, nulo, nulo, nulo) ;
        }
    }
    // let p1: Point = Point(-0.8,-0.8,0);
    // let p2: Point = Point(0.8,-0.8,0);
    // let p3: Point = Point(-0.8,0.8,0);
    // let p4: Point = Point(0.8,0.8,0);
    // linesOut[pos] = Points(p1,p2,p3,p4);
}