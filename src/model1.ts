import { Mat4, mat4 } from 'wgpu-matrix'
import { getArcRotateCamera, getProjectionMatrix, toRadians, updateArcRotateCamera } from './utils/matrix'
import { initializeWebGPU } from './utils/webgpuInit'
import { cubeVertexArray } from './meshes/cube'
import light from './7-light.wgsl'
import { setDepthStencil, setupResizeObserver } from './utils/utils'


const main = async () => {

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    let viewMatrix = getArcRotateCamera()
    let modelMatrix = mat4.identity()

    let rotation = toRadians(30)
    modelMatrix = mat4.rotateX(modelMatrix, rotation)
    modelMatrix = mat4.rotateY(modelMatrix, rotation)

    const matrixBufferArray = new Float32Array(4 * 4 * 3)

    const matrixBuffer: GPUBuffer = device.createBuffer({
        label: 'Matrix buffer',
        size: matrixBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    matrixBufferArray.set(modelMatrix, 0)
    matrixBufferArray.set(viewMatrix, 16)
    matrixBufferArray.set(projectionMatrix, 32)

    device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)

    const vertices = cubeVertexArray

    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: 'Vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 12,
        attributes: [
            {
                format: 'float32x3',
                offset: 0,
                shaderLocation: 0
            }
        ]
    }

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        }]
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: matrixBuffer }
        }]
    })

    const vertexShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'shader',
        code: light
    })

    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout]
    })

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
        label: 'Pipeline',

        layout: pipelineLayout,
        vertex: {
            module: vertexShaderModule,
            entryPoint: 'vertexMain',
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: vertexShaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
                format: canvasFormat
            }]
        }
    }

    const enableZbuffer = true
    const {updateDepthTextureSize,addDepthSpencil } = setDepthStencil(enableZbuffer,device,canvas,pipelineDescriptor)

    const pipeline: GPURenderPipeline = device.createRenderPipeline(pipelineDescriptor)

    const render = () => {
        updateDepthTextureSize()

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
        addDepthSpencil(renderPassDescriptor)

        const renderPass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        renderPass.setPipeline(pipeline)
        renderPass.setBindGroup(0, bindGroup)
        renderPass.setVertexBuffer(0, vertexBuffer)
        renderPass.draw(vertices.length / 3)
        renderPass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    const updateViewMatrix = (newMatrix: Mat4) => { viewMatrix = newMatrix }
    // update camera on mouse move
    updateArcRotateCamera(canvas, matrixBufferArray, matrixBuffer, device, render, updateViewMatrix)

    const updateProjectionMatrix = (newMatrix: Mat4) => { projectionMatrix = newMatrix };
    // resize screen
    setupResizeObserver(canvas, device, matrixBuffer, matrixBufferArray, getProjectionMatrix, render, updateProjectionMatrix);


}

await main()