// import { Mat4, mat4 } from 'wgpu-matrix'
// import renderShader from './7-light.wgsl'
// import { initializeWebGPU } from './utils/webgpuInit';

// async function main() {

//     const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

//     const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

//     let modelMatrixMesh = mat4.identity()

//     let topology: GPUPrimitiveTopology = 'triangle-list'

//     const p0_uv = [0, 1]
//     const p1_uv = [1, 1]
//     const p2_uv = [1, 0]
//     const p3_uv = [0, 0]
    
//     const quadradoTextura = [
//         // Triangulo 1
//         [-0.8, -0.8, ...p0_uv], // p0
//         [0.8, -0.8, ...p1_uv], // p1
//         [0.8, 0.8, ...p2_uv], // p2
    
//         // Triangulo 2
//         [0.8, 0.8, ...p2_uv], // p2
//         [-0.8, 0.8, ...p3_uv], // p3
//         [-0.8, -0.8, ...p0_uv], // p0
//     ]

//     const vertices = quadradoTextura

//     const nPontos = vertices.length

//     const verticesArray = new Float32Array(vertices.flat())

//     const verticesBuffer: GPUBuffer = device.createBuffer({
//         label: 'Vertices',
//         size: verticesArray.byteLength,
//         usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
//     })

//     device.queue.writeBuffer(verticesBuffer, 0, verticesArray)


//     const threeDimensional = false;
//     const color = false;
//     const uv = true;
//     const normal = false;
//     const textureLocation = '/webgpu_demos/wave.png'

//     const posFormat: GPUVertexFormat = threeDimensional ? 'float32x3' : 'float32x2';
//     const stride = (threeDimensional ? 12 : 8)
//         + (color ? 16 : 0)
//         + (uv ? 8 : 0)
//         + (normal ? 12 : 0);
//     const offsetColor = (threeDimensional ? 12 : 8);
//     const offsetUv = offsetColor + (color ? 16 : 0);
//     const offsetNormal = offsetUv + (uv ? 8 : 0);

//     interface Attribute {
//         format: GPUVertexFormat,
//         offset: number,
//         shaderLocation: number
//     }

//     const attributes: Attribute[] = [
//         {
//             format: posFormat,
//             offset: 0,
//             shaderLocation: 0
//         }
//     ];

//     if (color) {
//         attributes.push({
//             format: 'float32x4',
//             offset: offsetColor,
//             shaderLocation: 1
//         });
//     }

//     if (uv) {
//         attributes.push({
//             format: 'float32x2',
//             offset: offsetUv,
//             shaderLocation: 2
//         });
//     }

//     if (normal) {
//         attributes.push({
//             format: 'float32x3',
//             offset: offsetNormal,
//             shaderLocation: 3
//         });
//     }

//     const verticesBufferLayout: GPUVertexBufferLayout = {
//         arrayStride: stride,
//         attributes: attributes
//     };


//     //Configuração da Textura ************************************************************
//     let texture: GPUTexture | undefined;
//     let sampler: GPUSampler | undefined;

//     if (uv) {
//         const res = await fetch(textureLocation)
//         const blob = await res.blob()
//         const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' })

//         texture = device.createTexture({
//             label: 'Textura',
//             format: 'rgba8unorm',
//             size: [source.width, source.height],
//             usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
//         })

//         device.queue.copyExternalImageToTexture(
//             { source },
//             { texture },
//             { width: source.width, height: source.height }
//         )

//         sampler = device.createSampler();
//     }
//     //************************************************************************************

//     //Configuração do Render *************************************************************

//     const bindGroupLayoutRenderEntries = uv ? [
//         {
//             binding: 0,
//             visibility: GPUShaderStage.FRAGMENT,
//             texture: {}
//         },
//         {
//             binding: 1,
//             visibility: GPUShaderStage.FRAGMENT,
//             sampler: {}
//         },
//     ] : []

//     const bindGroupLayoutRender: GPUBindGroupLayout = device.createBindGroupLayout({
//         label: 'Bind Group Layout Render',
//         entries: bindGroupLayoutRenderEntries
//     })

//     const bindGroupRenderEntries = uv && texture && sampler ? [
//         {
//             binding: 0,
//             resource: texture.createView()
//         },
//         {
//             binding: 1,
//             resource: sampler
//         },
//     ] : []

//     const bindGroupRender = device.createBindGroup({
//         label: 'Bind Group',
//         layout: bindGroupLayoutRender,
//         entries: bindGroupRenderEntries
//     })

//     const pipelineLayoutRender = device.createPipelineLayout({
//         label: 'Pipeline Layout Render',
//         bindGroupLayouts: [bindGroupLayoutRender],
//     })

//     const renderShaderModule: GPUShaderModule = device.createShaderModule({
//         label: 'Render shader',
//         code: renderShader
//     })

//     const renderPipeline: GPURenderPipeline = device.createRenderPipeline({
//         label: 'Render Pipeline',
//         layout: pipelineLayoutRender,
//         vertex: {
//             module: renderShaderModule,
//             entryPoint: "vertexMain",
//             buffers: [verticesBufferLayout]
//         },
//         fragment: {
//             module: renderShaderModule,
//             entryPoint: 'fragmentMain',
//             targets: [{
//                 format: canvasFormat
//             }]
//         },
//         primitive: {
//             topology: topology
//         }
//     })
//     //************************************************************************************

//     function render() {
//         const encoder: GPUCommandEncoder = device.createCommandEncoder()
//         const textureView: GPUTextureView = context!.getCurrentTexture().createView()
//         const renderPassDescriptor: GPURenderPassDescriptor = {
//             colorAttachments: [{
//                 view: textureView,
//                 loadOp: 'clear',
//                 clearValue: { r: 0, g: 0, b: 0, a: 1 },
//                 storeOp: 'store'
//             }]
//         }
//         const renderPass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
//         renderPass.setPipeline(renderPipeline)
//         renderPass.setBindGroup(0, bindGroupRender)
//         renderPass.setVertexBuffer(0, verticesBuffer)
//         renderPass.draw(nPontos)
//         renderPass.end()
//         device.queue.submit([encoder.finish()])
//     }

//     render()

// }

// main()
