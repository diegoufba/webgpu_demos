import compute from './2-compute.wgsl?raw'
import shader from './2-shader.wgsl?raw'
import * as dat from 'dat.gui';
import { initializeWebGPU } from './utils/webgpuInit';
import { getArcRotateCamera, getProjectionMatrix, updateArcRotateCamera } from './utils/matrix';
import { Mat4, mat4, vec3 } from 'wgpu-matrix';
import { setupResizeObserver } from './utils/utils';

async function main() {

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    // let viewMatrix = getViewMatrix()
    let viewMatrix = getArcRotateCamera()

    let modelMatrix = mat4.identity()
    modelMatrix = mat4.scale(modelMatrix, vec3.fromValues(6, 6, 6))
    modelMatrix = mat4.translate(modelMatrix, vec3.fromValues(-0.5, -0.5, 0))

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



    const side = 1;
    let gridSize: number = 200 // grid = gridSize x gridSize
    let sideLength: number = side / gridSize //square side lenght
    let interpolation: number = 1
    let shape: number = 1

    let topology: GPUPrimitiveTopology = 'line-list'

    const paramsArrayBuffer = new ArrayBuffer(20) // 2 u32 e 2 f32
    // const paramsArrayBuffer = new ArrayBuffer(16) // 2 u32 e 2 f32
    const paramsUint32View = new Uint32Array(paramsArrayBuffer)
    const paramsFloat32View = new Float32Array(paramsArrayBuffer)
    paramsUint32View[0] = shape
    paramsUint32View[1] = gridSize
    paramsUint32View[2] = interpolation
    paramsFloat32View[3] = sideLength

    const paramsBuffer: GPUBuffer = device.createBuffer({
        label: 'Params buffer',
        size: paramsArrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)

    const offsetArrayBuffer = new Uint32Array([0])

    const offsetBuffer: GPUBuffer = device.createBuffer({
        label: 'Offset buffer',
        size: offsetArrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(offsetBuffer, 0, offsetArrayBuffer)

    function updateParamsBuffer() {
        // resolution = Math.min(width, height) // pixels resolution x resolution
        sideLength = side / gridSize //square side lenght
        paramsUint32View[0] = shape
        paramsUint32View[1] = gridSize
        paramsUint32View[2] = interpolation
        paramsFloat32View[3] = sideLength
        device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)
    }

    const bindGroupLayoutCompute: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout Compute',
        entries: [
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'storage' }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            },
        ]
    })

    const bindGroupLayoutShader: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 3,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        ]
    })

    let nVertices: number = gridSize * gridSize * 4 * 2
    let pointsBuffer: GPUBuffer = device.createBuffer({
        label: 'Points vertices A',
        size: nVertices * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    let bindGroupCompute: GPUBindGroup
    let bindGroupShader: GPUBindGroup

    function updateSizePointsBuffer() {

        pointsBuffer.destroy()

        nVertices = gridSize * gridSize * 4 * 2
        pointsBuffer = device.createBuffer({
            label: 'Points vertices A',
            size: nVertices * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })

        bindGroupCompute = device.createBindGroup({
            label: 'Bind Group Compute',
            layout: bindGroupLayoutCompute,
            entries: [
                {
                    binding: 1,
                    resource: { buffer: pointsBuffer },
                },
                {
                    binding: 2,
                    resource: { buffer: paramsBuffer },
                },
            ]
        })
        bindGroupShader = device.createBindGroup({
            label: 'Bind Group Compute',
            layout: bindGroupLayoutShader,
            entries: [{
                binding: 0,
                resource: { buffer: pointsBuffer },
            },
            {
                binding: 3,
                resource: { buffer: matrixBuffer }
            },
            ]
        })
    }



    const shaderPipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayoutShader],
    })
    const computePipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayoutCompute],
    })

    const shaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Shader',
        code: shader
    })

    const computeModule: GPUShaderModule = device.createShaderModule({
        label: 'Compute',
        code: compute
    })

    const sampleCount = 4;

    const shaderPipelineDescriptor: GPURenderPipelineDescriptor = {
        label: 'Shader pipeline',
        layout: shaderPipelineLayout,
        vertex: {
            module: shaderModule,
            entryPoint: "vertexMain",
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: {
            topology: topology
            // topology: 'point-list'
        },
        multisample: {
            count: sampleCount
        }
    }

    let canvasWidth = canvas.width
    let canvasHeight = canvas.height
    let texture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount,
        format: canvasFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    })
    let view = texture.createView()

    function getMSAAtexture() {
        return device.createTexture({
            size: [canvas.width, canvas.height],
            sampleCount,
            format: canvasFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        })
    }

    function updateMSAAtextureSize() {
        if (canvasWidth != canvas.width || canvasHeight != canvas.height) {
            texture.destroy()
            texture = getMSAAtexture()
            view = texture.createView()
            canvasWidth = canvas.width
            canvasHeight = canvas.height
        }
    }

    let shaderPipeline: GPURenderPipeline = device.createRenderPipeline(shaderPipelineDescriptor)

    const simulationPipeline: GPUComputePipeline = device.createComputePipeline({
        label: 'Compute pipeline',
        layout: computePipelineLayout,
        compute: {
            module: computeModule,
            entryPoint: 'main',
        }
    })

    const computeShader = async () => {
        updateSizePointsBuffer()
        const encoder: GPUCommandEncoder = device.createCommandEncoder()

        const computePass = encoder.beginComputePass()
        computePass.setPipeline(simulationPipeline)
        computePass.setBindGroup(0, bindGroupCompute)
        computePass.dispatchWorkgroups(gridSize / 8, gridSize / 8)
        computePass.end()
        device.queue.submit([encoder.finish()])
    }

    // let step = (nPoints / 2) / 1000
    // let n = step
    async function render() {
        updateMSAAtextureSize()
        const encoder: GPUCommandEncoder = device.createCommandEncoder()

        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                // view: textureView,
                view: view,
                resolveTarget: textureView,
                loadOp: 'clear',
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
                // clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1 },
                storeOp: 'store'
                // storeOp: 'store'
            }]
        }

        const renderPass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        renderPass.setPipeline(shaderPipeline)
        renderPass.setBindGroup(0, bindGroupShader)

        // renderPass.draw(n)
        renderPass.draw(nVertices / 2)
        // renderPass.draw(90000)
        renderPass.end()
        device.queue.submit([encoder.finish()])

        // n += step

        // console.log(n)
        // //160 000
        // if (n < nVertices / 2) {
        //     window.requestAnimationFrame(render)
        // }

    }

    await computeShader()
    // render()

    // window.requestAnimationFrame(render)

    // const UPDATE_INTERVAL = 60;
    // if (offset < nVertices / 2) {
    //     setInterval(render, UPDATE_INTERVAL)
    // }


    //*********************************************************************************************************
    // Gui
    const shapeMap = {
        star: 1,
        infinity: 2,
        circle: 3,
        heart: 4
    };

    type Shape = 'star' | 'infinity' | 'circle' | 'heart';

    let gui = new dat.GUI();
    gui.domElement.style.marginTop = "10px";
    gui.domElement.id = "datGUI";

    let options = {
        gridSize: gridSize,
        shape: 'star' as Shape,
        interpolation: true,
        points: false,
    };

    const shapes: Shape[] = ['star', 'infinity', 'circle', 'heart'];

    gui.add(options, "shape", shapes).onChange(async (value: Shape) => {
        shape = shapeMap[value];
        updateParamsBuffer()
        await computeShader()
        render()
    });

    gui.add(options, "gridSize", 10, 2000, 10).onChange(async (value) => {
        gridSize = value;
        updateParamsBuffer()
        await computeShader()
        render()
    });

    gui.add(options, "interpolation").onChange(async (value) => {
        interpolation = value ? 1 : 0;
        updateParamsBuffer()
        await computeShader()
        render()
    })
    gui.add(options, "points").onChange((value) => {
        topology = value ? 'point-list' : 'line-list';
        updateParamsBuffer()
        shaderPipelineDescriptor.primitive = { topology: topology }
        shaderPipeline = device.createRenderPipeline(shaderPipelineDescriptor)
        render()
    })

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

    //*********************************************************************************************************
}

main()