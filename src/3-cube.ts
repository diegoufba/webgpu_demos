import { Mat4, mat4 } from 'wgpu-matrix';
import triangle from './3-cube.wgsl'
import { cubeVertexArrayUv, cubeVertexArrayUvIndexData } from './meshes/cube'
import { initializeWebGPU } from './utils/webgpuInit';
import { getArcRotateCamera, getProjectionMatrix, toRadians, updateArcRotateCamera } from './utils/matrix';
import { setDepthStencil, setupResizeObserver } from './utils/utils';
// import { mat4, vec3 } from 'gl-matrix'


async function main() {

    // const configureDepthStencil = false

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

    const timeBufferArray = new Float32Array([0])

    const timeBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: timeBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer(timeBuffer, 0, timeBufferArray)


    const vertices = cubeVertexArrayUv
    // const vertices = cubeVertexArrayUv2
    const indexData = cubeVertexArrayUvIndexData

    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: 'Vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const indexBuffer: GPUBuffer = device.createBuffer({
        label: 'Index Buffer',
        size: cubeVertexArrayUvIndexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer(indexBuffer, 0, indexData)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 20,
        attributes: [{
            format: "float32x3",
            offset: 0,
            shaderLocation: 0,
        }, {
            format: 'float32x2',
            offset: 12,
            shaderLocation: 1
        }]
    }

    const kTextureWidth = 24;
    const kTextureHeight = 14;
    const _ = [246, 245, 242, 255];
    const d = [0, 0, 0, 255];
    const textureData = new Uint8Array([
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        _, _, d, d, _, _, _, d, d, d, d, _, _, d, d, d, d, _, _, _, _, _, _, _,
        _, _, _, d, _, _, _, _, _, _, d, _, _, _, _, _, d, _, _, _, _, _, _, _,
        _, _, _, d, _, _, _, d, d, d, d, _, _, _, d, d, d, _, _, _, _, _, _, _,
        _, _, _, d, _, _, _, d, _, _, _, _, _, _, _, _, d, _, _, _, _, _, _, _,
        _, _, d, d, d, _, _, d, d, d, d, _, _, d, d, d, d, _, _, _, _, _, _, _,
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,
        _, d, _, _, d, _, _, d, d, d, d, _, _, d, d, d, d, _, _, _, _, _, _, _,
        _, d, _, _, d, _, _, d, _, _, _, _, _, d, _, _, _, _, _, _, _, _, _, _,
        _, d, d, d, d, _, _, d, d, d, d, _, _, d, d, d, d, _, _, _, _, _, _, _,
        _, _, _, _, d, _, _, _, _, _, d, _, _, d, _, _, d, _, _, _, _, _, _, _,
        _, _, _, _, d, _, _, d, d, d, d, _, _, d, d, d, d, _, _, _, _, _, _, _,
        _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,

    ].flat());

    const texture = device.createTexture({
        size: [kTextureWidth, kTextureHeight],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    device.queue.writeTexture(
        { texture },
        textureData,
        { bytesPerRow: kTextureWidth * 4 },
        { width: kTextureWidth, height: kTextureHeight },
    );

    const sampler = device.createSampler();

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [{
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
        {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        ]
    })



    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
    })


    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: triangle
    })

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
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
    }
    const enableZbuffer = true
    const {updateDepthTextureSize,addDepthSpencil } = setDepthStencil(enableZbuffer,device,canvas,pipelineDescriptor)

    const pipeline: GPURenderPipeline = device.createRenderPipeline(pipelineDescriptor)

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [{
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
        {
            binding: 3,
            resource: { buffer: timeBuffer }
        },
        ]
    })

    const initialTime = Date.now()
    let time = 0
    let speed = 2 / 1000



    const render = () => {
        updateDepthTextureSize()
        
        time = (Date.now() - initialTime) * speed
        timeBufferArray[0] = time
        device.queue.writeBuffer(timeBuffer, 0, timeBufferArray)

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

        const pass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, vertexBuffer)
        pass.setIndexBuffer(indexBuffer, 'uint16')
        pass.drawIndexed(indexData.length)
        // pass.draw(vertices.length/5)
        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    // requestAnimationFrame(render)
    const UPDATE_INTERVAL = 1;
    setInterval(render, UPDATE_INTERVAL);

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