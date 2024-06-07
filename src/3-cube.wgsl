struct TransformMatrix {
    model: mat4x4f,
    view: mat4x4f,
    projection: mat4x4f
}

struct VertexInput {
    @location(0) pos: vec3f,
    @location(1) uv: vec2f
}

struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f
}

@group(0) @binding(0) var<uniform> matrix: TransformMatrix ;
@group(0) @binding(3) var<uniform> iTime:f32;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {

    // let pos = input.pos * (sin(iTime)/4 + 2);
    let position = matrix.projection * matrix.view * matrix.model * vec4f(input.pos, 1.0);
    // return vec4f(pos,1.0);
    var output: VertexOutput;
    output.pos = position;
    output.uv = input.uv;
    return output;
}

@group(0) @binding(1) var mySample: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;



@fragment
fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
    var texture: vec4f = textureSample(myTexture, mySample, fragInput.uv);


    let d = length(fragInput.pos.xy);
    let speed = 6.0;
    let k = 10000.0;
    let x = (sin(d * k + iTime * speed) + 1) / 2 ;

    let y = (cos(d * k + iTime * speed) + 1) / 2 ;

    if texture.x == 0.0 {
        texture = vec4f(x, 0.0, 0.0, 1.0);
    }

    return texture;
}

// fn palette(t: f32) -> vec3f {
//     let a = vec3(0.5, 0.5, 0.5);
//     let b = vec3(0.5, 0.5, 0.5);
//     let c = vec3(1.0, 1.0, 1.0);
//     let d = vec3(0.263, 0.416, 0.557);

//     return a + b * cos(6.28318 * (c * t + d));
// }


    // var uv: vec2f = fragInput.uv * 2 -1;
    // let uv0: vec2f = uv;
    // var finalColor: vec3f = vec3(0.0);

    // for (var i = 0; i < 4; i++) {
    //     uv = fract(uv * 1.5) - 0.5;

    //     var d: f32 = length(uv) * exp(-length(uv0));

    //     let col = palette(length(uv0) + f32(i) * .4 + iTime * .4);

    //     d = sin(d * 8. + iTime) / 8.;
    //     d = abs(d);

    //     d = pow(0.01 / d, 1.2);

    //     finalColor += col * d;
    // }

    // return vec4f(finalColor, 1.0);