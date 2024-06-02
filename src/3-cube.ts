import { mat4 } from 'wgpu-matrix';
import triangle from './3-cube.wgsl'
import { cubeVertexArray } from './meshes/cube'
import { initializeWebGPU } from './utils/webgpuInit';
import { getArcRotateCamera, getProjectionMatrix, toRadians, updateArcRotateCamera } from './utils/matrix';
import { setupResizeObserver } from './utils/utils';
// import { mat4, vec3 } from 'gl-matrix'


async function main() {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    let viewMatrix = getArcRotateCamera()

    let modelMatrix = mat4.identity()

    let rotation = toRadians(30)
    modelMatrix = mat4.rotateX(modelMatrix, rotation)
    modelMatrix = mat4.rotateY(modelMatrix, rotation)

    //Set Uniform Buffer *****************************************************************************
    const matrixBufferArray = new Float32Array(4 * 4 * 3)

    const matrixBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: matrixBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    matrixBufferArray.set(modelMatrix, 0)
    matrixBufferArray.set(viewMatrix, 16)
    matrixBufferArray.set(projectionMatrix, 32)

    device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)
    //************************************************************************************************

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

    // const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
    //     label: 'Bind Group Layout',
    //     entries: [{
    //         binding: 0,
    //         visibility: GPUShaderStage.VERTEX,
    //         buffer: { type: 'uniform' }
    //     },
    //     ]
    // })



    // const pipelineLayout = device.createPipelineLayout({
    //     label: 'Pipeline Layout',
    //     bindGroupLayouts: [bindGroupLayout],
    // })


    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: triangle
    })

    const pipeline: GPURenderPipeline = device.createRenderPipeline({
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
        },
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: { buffer: matrixBuffer }
        }]
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
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, vertexBuffer)
        pass.draw(vertices.length / 3)
        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    // update camera on mouse move
    updateArcRotateCamera(canvas, viewMatrix, matrixBufferArray, matrixBuffer, device, render)
    
    // resize screen
    setupResizeObserver(canvas, device, matrixBuffer, matrixBufferArray, projectionMatrix, getProjectionMatrix, render);
}

main()