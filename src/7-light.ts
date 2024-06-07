import { Mat4, mat3, mat4 } from 'wgpu-matrix'
import { getArcRotateCamera, getProjectionMatrix, toRadians, updateArcRotateCamera } from './utils/matrix'
import { initializeWebGPU } from './utils/webgpuInit'
import { cubeVertexArrayNormalUV } from './meshes/cube'
import light from './7-light.wgsl'
import { getTexture, setDepthStencil, setupResizeObserver } from './utils/utils'
import dat from 'dat.gui'


const main = async () => {

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    let viewMatrix = getArcRotateCamera()
    let modelMatrix = mat4.identity()
    // modelMatrix = mat4.scale(modelMatrix, [1.5, 1.5, 1.5])
    // let backupModelMatrix = modelMatrix
    let normalMatrix = mat3.transpose(mat3.invert(mat3.fromMat4(modelMatrix)))

    // let rotation1 = toRadians(0)
    // let rotation2 = toRadians(0)
    // modelMatrix = mat4.rotateX(modelMatrix, rotation1)
    // modelMatrix = mat4.rotateY(modelMatrix, rotation2)

    const matrixBufferArray = new Float32Array(4 * 4 * 4)

    const matrixBuffer: GPUBuffer = device.createBuffer({
        label: 'Matrix buffer',
        size: matrixBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    matrixBufferArray.set(modelMatrix, 0)
    matrixBufferArray.set(viewMatrix, 16)
    matrixBufferArray.set(projectionMatrix, 32)
    matrixBufferArray.set(normalMatrix, 48)

    device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)


    const vertices = cubeVertexArrayNormalUV

    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: 'Vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 32,
        attributes: [
            {
                format: 'float32x3',
                offset: 0,
                shaderLocation: 0
            },
            {
                format: 'float32x2',
                offset: 12,
                shaderLocation: 1
            },
            {
                format: 'float32x3',
                offset: 20,
                shaderLocation: 2
            },
        ]
    }

    const texture = await getTexture("/webgpu_demos/waveTexture.jpg", device)

    const sampler = device.createSampler()

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
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            },
        ]

    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: matrixBuffer }
            },
            {
                binding: 1,
                resource: sampler
            },
            {
                binding: 2,
                resource: texture.createView()
            },
        ]
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
    const { updateDepthTextureSize, addDepthSpencil } = setDepthStencil(enableZbuffer, device, canvas, pipelineDescriptor)

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
        renderPass.draw(vertices.length / 8)
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

    function updateRotation() {
        // modelMatrix = backupModelMatrix
        let modelMatrix = mat4.identity()
        modelMatrix = mat4.rotateX(modelMatrix, toRadians(x))
        modelMatrix = mat4.rotateY(modelMatrix, toRadians(y))
        modelMatrix = mat4.rotateZ(modelMatrix, toRadians(z))

        normalMatrix = mat3.transpose(mat3.invert(mat3.fromMat4(modelMatrix)))
        matrixBufferArray.set(modelMatrix, 0)
        matrixBufferArray.set(normalMatrix, 48)
        device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)
        render()
    }

    let x = 0
    let y = 0
    let z = 0

    var gui = new dat.GUI();
    gui.domElement.style.marginTop = "10px";
    gui.domElement.id = "datGUI";
    var options = {
        x: 0,
        y: 0,
        z: 0,
    }
    gui.add(options, "x", -360, 360).onChange(function (value) {
        x = value
        updateRotation()
    });
    gui.add(options, "y", -360, 360).onChange(function (value) {
        y = value
        updateRotation()
    });
    gui.add(options, "z", -360, 360).onChange(function (value) {
        z = value
        updateRotation()
    });
}

await main()