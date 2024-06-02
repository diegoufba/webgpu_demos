// import { mat4 } from 'wgpu-matrix'
import { mat4, Mat4, vec3 } from 'wgpu-matrix'
import sprite from './6-sprites.wgsl'
import { updateArcRotateCamera, getArcRotateCamera, getProjectionMatrix } from './utils/matrix'
import { setupResizeObserver } from './utils/utils'
import { initializeWebGPU } from './utils/webgpuInit'
import { getReferencePlane, updateMatrix } from './reference/plane'

async function main() {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)

    let modelMatrix = mat4.identity()
    // modelMatrix = mat4.rotateX(modelMatrix, toRadians(60))
    modelMatrix = mat4.scale(modelMatrix, vec3.fromValues(1 / 4, 1 / 4, 1))
    modelMatrix = mat4.translate(modelMatrix, vec3.fromValues(0, 1, 0))

    let viewMatrix = getArcRotateCamera()

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

    const { pipelinePlane, bindGroupPlane, vertexBufferPlane, vertexCountPlane, modelMatrixPlane, matrixBufferArrayPlane, matrixBufferPlane } = getReferencePlane(device, canvasFormat, projectionMatrix, viewMatrix)

    const vertices = new Float32Array([
        -1, -1,
        1, -1,
        1, 1,

        1, 1,
        -1, 1,
        -1, -1
    ])

    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: ' vertices',
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

    const numberOfQuads = 30
    const quadInstanceArray = new Float32Array(numberOfQuads * 3)
    const quadInstaceBuffer = device.createBuffer({
        label: 'Quad Instaces Buffer',
        size: quadInstanceArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    for (let i = 0; i < numberOfQuads; i++) {
        quadInstanceArray[i * 3 + 0] = (Math.random() * 40) - 20
        quadInstanceArray[i * 3 + 1] = Math.random() * 10
        quadInstanceArray[i * 3 + 2] = (Math.random() * 10) -5
    }
    device.queue.writeBuffer(quadInstaceBuffer, 0, quadInstanceArray)


    const shaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Shader',
        code: sprite
    })

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'read-only-storage' }
            },
        ]
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: matrixBuffer }
        },
        {
            binding: 1,
            resource: { buffer: quadInstaceBuffer }
        }
        ]
    })

    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout]
    })

    const pipeline: GPURenderPipeline = device.createRenderPipeline({
        label: 'pipeline',
        layout: pipelineLayout,
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
                format: canvasFormat
            }]
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus'
        }
        // primitive: {
        //     topology: 'line-list'
        //     // topology: 'point-list'
        // }
    })

    
    function render() {
        const depthTexture = device.createTexture({
            size: [canvas.width, canvas.height, 1],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        })
        
        const encoder: GPUCommandEncoder = device.createCommandEncoder()
        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                loadOp: 'clear',
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: "store"
            }
        }
        const pass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)

        // Primeiro pipeline draw plane
        updateMatrix(modelMatrixPlane, viewMatrix, projectionMatrix, matrixBufferArrayPlane, matrixBufferPlane, device)
        pass.setPipeline(pipelinePlane)
        pass.setBindGroup(0, bindGroupPlane)
        pass.setVertexBuffer(0, vertexBufferPlane)
        pass.draw(vertexCountPlane)

        // Segundo pipeline draw squad
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, vertexBuffer)
        pass.draw(vertices.length / 2, numberOfQuads)


        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    const updateViewMatrix = (newMatrix: Mat4) => {
        viewMatrix = newMatrix
    }

    // update camera on mouse move
    updateArcRotateCamera(canvas, matrixBufferArray, matrixBuffer, device, render, updateViewMatrix)

    const updateProjectionMatrix = (newMatrix: Mat4) => {
        projectionMatrix = newMatrix;
    };
    // resize screen
    setupResizeObserver(canvas, device, matrixBuffer, matrixBufferArray, getProjectionMatrix, render, updateProjectionMatrix);
}

main()