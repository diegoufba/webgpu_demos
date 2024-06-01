import { mat4 } from 'wgpu-matrix'
import triangle from './1-triangle.wgsl?raw'
import { getMatrixProjection, getMatrixView } from './utils/matrix'
import { setupResizeObserver } from './utils/utils'
import { initializeWebGPU } from './utils/webgpuInit'

async function main() {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let matrixProjection = getMatrixProjection(aspectRatio)
    let MatrixView = getMatrixView()

    let matrixModel = mat4.identity()

    //Set Uniform Buffer *****************************************************************************
    const matrixBufferArray = new Float32Array(4 * 4 * 3)

    const matrixBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: matrixBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    matrixBufferArray.set(matrixModel, 0)
    matrixBufferArray.set(MatrixView, 16)
    matrixBufferArray.set(matrixProjection, 32)

    device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)
    //************************************************************************************************


    const vertices = new Float32Array([
        -0.8, -0.8,
        0.8, -0.8,
        0.8, 0.8,

    //     -0.8, -0.8, // Triangle 2 (Red)
    //     0.8,  0.8,
    //    -0.8,  0.8,
    ])

    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: 'Triangle vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0,
        }]
    }

    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: triangle
    })

    const trianglePipeline: GPURenderPipeline = device.createRenderPipeline({
        label: 'Triangle pipeline',
        layout: 'auto',
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
        }
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: trianglePipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: { buffer: matrixBuffer }
        },
        ]
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
        pass.draw(vertices.length / 2)
        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    // resize screen
    setupResizeObserver(canvas, device, matrixBuffer, matrixBufferArray, matrixProjection, getMatrixProjection, render);
}

main()