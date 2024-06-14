// // struct VertexInput {
// //     @location(0) pos: vec2f,
// //     @location(1) cor: vec3f
// // }

// // struct VertexOutput {
// //     @builtin(position) pos: vec4f,
// //     @location(0) cor: vec3f
// // }

// // @vertex
// // fn vertexMain(vertexInput: VertexInput) -> VertexOutput {
// //     var vertexOutput: VertexOutput;
// //     vertexOutput.pos = vec4f(vertexInput.pos.x, vertexInput.pos.y, 0.0, 1.0);
// //     vertexOutput.cor = vertexInput.cor;
// //     return vertexOutput;
// // }

// // @fragment
// // fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
// //     return vec4f(fragInput.cor, 1.0);
// // }

// struct VertexInput {
//     @location(0) pos: vec2f,
//     @location(2) uv: vec2f
// }

// struct VertexOutput {
//     @builtin(position) pos: vec4f,
//     @location(0) uv: vec2f
// }

// @group(0) @binding(0) var myTexture: texture_2d<f32>;
// @group(0) @binding(1) var mySample: sampler;

// @vertex
// fn vertexMain(vertexInput: VertexInput) -> VertexOutput {
//     var vertexOutput: VertexOutput;
//     vertexOutput.pos = vec4f(vertexInput.pos.x, vertexInput.pos.y, 0.0, 1.0);
//     vertexOutput.uv = vertexInput.uv;
//     return vertexOutput;
// }

// @fragment
// fn fragmentMain(fragInput: VertexOutput) -> @location(0) vec4f {
//     return textureSample(myTexture, mySample, fragInput.uv);
// }



