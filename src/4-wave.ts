import { mat4 } from 'wgpu-matrix';
import wave from './4-wave.wgsl'
import { createPlane } from './meshes/plane'
import { getMatrixProjection, getMatrixView, toRadians } from './utils/matrix'
import { getTexture, setupResizeObserver } from './utils/utils'
import { initializeWebGPU } from './utils/webgpuInit'
import * as dat from 'dat.gui';


async function main() {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let matrixProjection = getMatrixProjection(aspectRatio)
    let MatrixView = getMatrixView()

    let matrixModel = mat4.identity()
    matrixModel = mat4.rotateX(matrixModel, toRadians(60))
    // model = mat4.scale(model, [1.5, 1.5, 1.5])
    // model = mat4.rotateZ(model, rotation)

    //Set Uniform Buffer *****************************************************************************
    const uniformBufferArray = new Float32Array(4 * 4 * 3)

    const uniformBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: uniformBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    uniformBufferArray.set(matrixModel, 0)
    uniformBufferArray.set(MatrixView, 16)
    uniformBufferArray.set(matrixProjection, 32)

    device.queue.writeBuffer(uniformBuffer, 0, uniformBufferArray)


    const paramsBufferArray = new Float32Array([1, 4, 4, 1]) //time,kx,ky,height

    const paramsBufferBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: paramsBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer(paramsBufferBuffer, 0, paramsBufferArray)
    //************************************************************************************************

    //Set Vertex Buffer ******************************************************************************
    const size = 100
    const vertices = createPlane(size, size, 2)

    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: 'Triangle vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(vertexBuffer, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 16,
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0,
        },
        {
            format: "float32x2",
            offset: 8,
            shaderLocation: 1,
        },
        ]
    }
    //************************************************************************************************

    //Set Texture ************************************************************************************
    const texture = await getTexture("/webgpu_demos/waveTexture.jpg", device)

    const sampler = device.createSampler()
    //************************************************************************************************

    //Bind *******************************************************************************************
    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {}
        },
        {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {}
        },
        ]
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
        }, {
            binding: 1,
            resource: { buffer: paramsBufferBuffer }
        }, {
            binding: 2,
            resource: sampler
        }, {
            binding: 3,
            resource: texture.createView()
        },
        ]
    })
    //************************************************************************************************

    const shaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Shader',
        code: wave
    })

    //Pipeline ****************************************************************************************
    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
    })

    const pipeline: GPURenderPipeline = device.createRenderPipeline({
        label: 'Triangle pipeline',
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
        primitive: {
            topology: 'triangle-list'
            // topology: 'line-list'
            // topology: 'point-list'
        }
    })
    //************************************************************************************************

    const initialTime = Date.now()
    let time = 0
    let speed = 2 / 1000

    // Render
    const render = () => {

        time = (Date.now() - initialTime) * speed
        paramsBufferArray[0] = time
        device.queue.writeBuffer(paramsBufferBuffer, 0, paramsBufferArray)
        // console.log(time)

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
        pass.draw(vertices.length / 4)
        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    const UPDATE_INTERVAL = 1;
    setInterval(render, UPDATE_INTERVAL);
    // window.requestAnimationFrame(render)

    //Gui ********************************************************************************************
    var gui = new dat.GUI();
    gui.domElement.style.marginTop = "100px";
    gui.domElement.id = "datGUI";
    var options = {
        speed: 2,
        kx: 4,
        ky: 4,
        height: 1
    }
    gui.add(options, "speed", 0, 10).onChange(function (value) {
        speed = value / 1000
    });
    gui.add(options, "kx", 0, 10).onChange(function (value) {
        paramsBufferArray[1] = value
        device.queue.writeBuffer(paramsBufferBuffer, 0, paramsBufferArray)
    });
    gui.add(options, "ky", 0, 10).onChange(function (value) {
        paramsBufferArray[2] = value
        device.queue.writeBuffer(paramsBufferBuffer, 0, paramsBufferArray)
    });
    gui.add(options, "height", 0, 10).onChange(function (value) {
        paramsBufferArray[3] = value
        device.queue.writeBuffer(paramsBufferBuffer, 0, paramsBufferArray)
    });
    //************************************************************************************************

    // resize screen
    setupResizeObserver(canvas, device, uniformBuffer, uniformBufferArray, matrixProjection, getMatrixProjection, render);
}

main()