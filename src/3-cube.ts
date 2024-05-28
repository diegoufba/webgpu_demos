import { mat4, vec3 } from 'wgpu-matrix';
import triangle from './3-cube.wgsl?raw'
import { cubeVertexArray,generatePlane } from './solids/cube'
// import { mat4, vec3 } from 'gl-matrix'


async function main() {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.")
    }

    const adpater = await navigator.gpu.requestAdapter()
    if (!adpater) {
        throw new Error("No appropriate GPUAdapter found.")
    }

    const device: GPUDevice = await adpater.requestDevice()

    const context = canvas.getContext('webgpu')
    if (!context) {
        throw new Error("WebGPU context not available.");
    }

    const canvasFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat()
    context.configure({
        device,
        format: canvasFormat
    })

    // const vertices = new Float32Array([
    //     0.0, 0.5, 0.0,
    //     -0.5, -0.5, 0.0,
    //     0.5, -0.5, 0.0
    // ]);

    const vertices = cubeVertexArray


    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: 'Triangle vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 12,
        attributes: [{
            format: "float32x3",
            offset: 0,
            shaderLocation: 0,
        }]
    }

    function toRadians(degrees: number) {
        return degrees * (Math.PI / 180);
    }

    const fovy = toRadians(45)
    const aspectRatio = 512 / 512
    const nearPlane = 0.1
    const farPlane = 10
    const projection = mat4.perspective(fovy, aspectRatio, nearPlane, farPlane)

    const eye = vec3.fromValues(0, 0, -5)
    const target = vec3.fromValues(0, 0, 0)
    const up = vec3.fromValues(0, 1, 0)
    const view = mat4.lookAt(eye, target, up)

    let model = mat4.identity()
    let rotation = toRadians(30)
    model = mat4.rotateX(model, rotation)
    model = mat4.rotateZ(model, rotation)

    const uniformBufferArray = new Float32Array(4 * 4 * 3)

    const uniformBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: uniformBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    uniformBufferArray.set(model, 0)
    uniformBufferArray.set(view, 16)
    uniformBufferArray.set(projection, 32)

    device.queue.writeBuffer(uniformBuffer, 0, uniformBufferArray)
    // device.queue.writeBuffer(uniformBuffer, 0, <ArrayBuffer>model)
    // device.queue.writeBuffer(uniformBuffer, 64, <ArrayBuffer>view)
    // device.queue.writeBuffer(uniformBuffer, 128, <ArrayBuffer>projection)

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        ]
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }]
    })

    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
    })


    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: triangle
    })

    const trianglePipeline: GPURenderPipeline = device.createRenderPipeline({
        label: 'Triangle pipeline',
        layout: pipelineLayout,
        vertex: {
            module: triangleShaderModule,
            entryPoint: "vertexMain",
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: triangleShaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
                format: canvasFormat
            }]
        },
    })


    function render() {
        const encoder: GPUCommandEncoder = device.createCommandEncoder()
        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                loadOp: 'clear',
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
                storeOp: 'store'
            }]
        }
        const pass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        pass.setPipeline(trianglePipeline)
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, vertexBuffer)
        pass.draw(vertices.length / 3)
        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()
}

main()