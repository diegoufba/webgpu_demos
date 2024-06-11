import compute from './5-compute.wgsl'
import shader from './5-shader.wgsl'
import * as dat from 'dat.gui';
import { initializeWebGPU } from './utils/webgpuInit';
import { getArcRotateCamera, getProjectionMatrix, updateArcRotateCamera } from './utils/matrix';
import { Mat4, mat4, vec3 } from 'wgpu-matrix';
import { setupResizeObserver } from './utils/utils';
import { getEdgeTable, triTable } from './5-tables';
import Stats from 'stats.js';

const main = async () => {


    // for (let index = 0; index < 15; index++) {
    //     let alternatingColor = Math.floor(index / 3) % 2 == 0;
    //     console.log(alternatingColor);
    // }


    async function loadRawFile(filePath: RequestInfo | URL, dimensions: number[]) {
        const response = await fetch(filePath);
        const arrayBuffer = await response.arrayBuffer();
        const rawData = new Uint8Array(arrayBuffer);

        // Normalizar os dados para a faixa [0, 1]
        const data = new Float32Array(dimensions[0] * dimensions[1] * dimensions[2]);
        for (let i = 0; i < rawData.length; i++) {
            data[i] = rawData[i] / 255.0;
            // data[i] = rawData[i] ;
        }

        return data;
    }

    const dimensions = [64, 64, 64];
    // const dimensions = [256, 256, 256];
    const rawData = await loadRawFile('/webgpu_demos/fuel_64x64x64_uint8.raw', dimensions);
    // const rawData = await loadRawFile('/webgpu_demos/bonsai_256x256x256_uint8.raw', dimensions);
    // let max = 0
    // rawData.forEach((d)=>{
    //     if(d>max){
    //         max = d
    //     }
    // })
    // console.log(max)


    const configureDepthStencil = true

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    // let viewMatrix = getViewMatrix()
    let viewMatrix = getArcRotateCamera()

    let modelMatrix = mat4.identity()
    modelMatrix = mat4.scale(modelMatrix, vec3.fromValues(6, 6, 6))
    // modelMatrix = mat4.translate(modelMatrix, vec3.fromValues(-1, -1, -1))
    modelMatrix = mat4.translate(modelMatrix, vec3.fromValues(-0.5, -0.5, -0.5))

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
    let gridSize: number = 64 // grid = gridSize x gridSize
    let sideLength: number = side / gridSize //square side lenght
    let shape: number = 1
    let isovalue: number = 0.0
    let drawingPercentage: number = 100

    let topology: GPUPrimitiveTopology = 'triangle-list'

    const paramsArrayBuffer = new ArrayBuffer(16) // 2 u32 e 2 f32
    const paramsUint32View = new Uint32Array(paramsArrayBuffer)
    const paramsFloat32View = new Float32Array(paramsArrayBuffer)
    paramsUint32View[0] = shape
    paramsUint32View[1] = gridSize
    paramsFloat32View[2] = sideLength
    paramsFloat32View[3] = isovalue

    const paramsBuffer: GPUBuffer = device.createBuffer({
        label: 'Params buffer',
        size: paramsArrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)

    function updateParamsBuffer() {
        // resolution = Math.min(width, height) // pixels resolution x resolution
        sideLength = side / gridSize //square side lenght
        paramsUint32View[0] = shape
        paramsUint32View[1] = gridSize
        paramsFloat32View[2] = sideLength
        paramsFloat32View[3] = isovalue
        device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)
    }
    let color = 0
    const colorArrayBuffer = new Uint32Array([color])

    const colorBuffer: GPUBuffer = device.createBuffer({
        label: 'Params buffer',
        size: colorArrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(colorBuffer, 0, colorArrayBuffer)

    const edgeTableArray = new Int32Array(getEdgeTable().flat())

    const edgeTableBuffer: GPUBuffer = device.createBuffer({
        label: 'Tritable Buffer',
        size: edgeTableArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer(edgeTableBuffer, 0, edgeTableArray)

    const triTableArray = new Int32Array(triTable.flat())

    const triTableBuffer: GPUBuffer = device.createBuffer({
        label: 'Tritable Buffer',
        size: triTableArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer(triTableBuffer, 0, triTableArray)

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
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            },
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'uniform' }
            },
            {
                binding: 6,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' }
            }
        ]
    })
    const bindGroupLayoutShader: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout Shader',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'read-only-storage' }
        },
        {
            binding: 5,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        {
            binding: 7,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        ]
    })

    let nVertices: number = gridSize * gridSize * gridSize * 15 * 3
    let pointsBuffer: GPUBuffer = device.createBuffer({
        label: 'Points vertices A',
        size: nVertices * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })

    let isovaluesBuffer: GPUBuffer = device.createBuffer({
        label: 'Isovalues',
        size: rawData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    device.queue.writeBuffer(isovaluesBuffer, 0, rawData)

    let bindGroupCompute: GPUBindGroup
    let bindGroupShader: GPUBindGroup

    function updateSizePointsBuffer() {

        pointsBuffer.destroy()

        nVertices = gridSize * gridSize * gridSize * 15 * 3 // 15 Pontos por posica no grid
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
                {
                    binding: 3,
                    resource: { buffer: edgeTableBuffer }
                },
                {
                    binding: 4,
                    resource: { buffer: triTableBuffer }
                },
                {
                    binding: 6,
                    resource: { buffer: isovaluesBuffer }
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
                binding: 5,
                resource: { buffer: matrixBuffer }
            },
            {
                binding: 7,
                resource: { buffer: colorBuffer },
            },
            ]
        })
    }

    const shaderPipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayoutShader],
    })

    const computePipelineLayout = device.createPipelineLayout({
        label: 'Compute Layout',
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
        }
    }
    if (configureDepthStencil) {
        shaderPipelineDescriptor.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus'
        };
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
        computePass.dispatchWorkgroups(gridSize / 4, gridSize / 4, gridSize / 4)
        computePass.end()
        device.queue.submit([encoder.finish()])
    }


    const getDepthTexture = () => {
        return device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        })
    }
    let canvasWidth = canvas.width
    let canvasHeight = canvas.height
    let depthTexture: GPUTexture = getDepthTexture()


    const render = async () => {
        if (canvasWidth != canvas.width || canvasHeight != canvas.height) {
            depthTexture.destroy()
            depthTexture = getDepthTexture()
            canvasWidth = canvas.width
            canvasHeight = canvas.height
        }
        const encoder: GPUCommandEncoder = device.createCommandEncoder()
        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                loadOp: 'clear',
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
                // clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1 },
                storeOp: 'store'
            }]
        }
        if (configureDepthStencil) {
            renderPassDescriptor.depthStencilAttachment = {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: "store"
            };
        }

        const renderPass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        renderPass.setPipeline(shaderPipeline)
        renderPass.setBindGroup(0, bindGroupShader)
        renderPass.draw((nVertices / 3) * (drawingPercentage / 100))
        renderPass.end()
        device.queue.submit([encoder.finish()])
    }

    await computeShader()

    render()

    //*********************************************************************************************************
    // Gui
    const shapeMap = {
        sphere: 1,
        cylinder: 2,
        cone: 3,
        fuel: 4,

    };

    type Shape = 'sphere' | 'cylinder' | 'cone' | 'fuel';

    let gui = new dat.GUI();
    gui.domElement.style.marginTop = "10px";
    gui.domElement.id = "datGUI";

    let options = {
        gridSize: gridSize,
        shape: 'sphere' as Shape,
        isovalue: isovalue,
        points: false,
        drawing: 100,
        color: false
    };

    const shapes: Shape[] = ['sphere', 'cylinder', 'cone', 'fuel'];

    gui.add(options, "shape", shapes).onChange(async (value: Shape) => {
        shape = shapeMap[value];
        if (shape == 4) {
            gridSize = 64
            options.gridSize = 64;
            gridSizeController.updateDisplay();
            if (gridSizeController.domElement.parentElement) {
                gridSizeController.domElement.parentElement.style.display = 'none';
            }
            if (isovalueController.domElement.parentElement) {
                isovalueController.domElement.parentElement.style.display = 'block';
            }
        } else {
            if (gridSizeController.domElement.parentElement) {
                gridSizeController.domElement.parentElement.style.display = 'block';
            }
            if (isovalueController.domElement.parentElement) {
                isovalue = 0.0
                options.isovalue = isovalue;
                isovalueController.updateDisplay();
                isovalueController.domElement.parentElement.style.display = 'none';
            }
        }
        updateParamsBuffer()
        await computeShader()
        render()
    });

    gui.add(options, "drawing", 1, 100, 1).onChange(async (value) => {
        drawingPercentage = value;
        render()
    });

    const gridSizeController = gui.add(options, "gridSize", 10, 64, 1).onChange(async (value) => {
        gridSize = value;
        updateParamsBuffer()
        await computeShader()
        render()
    });
    const isovalueController = gui.add(options, "isovalue", 0, 1, 0.01).onChange(async (value) => {
        isovalue = value;
        updateParamsBuffer()
        await computeShader()
        render()
    });
    if (isovalueController.domElement.parentElement) {
        isovalueController.domElement.parentElement.style.display = 'none';
    }

    gui.add(options, "points").onChange((value) => {
        topology = value ? 'point-list' : 'triangle-list';
        updateParamsBuffer()
        shaderPipelineDescriptor.primitive = { topology: topology }
        shaderPipeline = device.createRenderPipeline(shaderPipelineDescriptor)
        render()
    })

    gui.add(options, "color").onChange(async (value) => {
        color = value ? 1 : 0;
        colorArrayBuffer[0] = color
        device.queue.writeBuffer(colorBuffer, 0, colorArrayBuffer)
        await computeShader()
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

    var stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    function animate() {
        stats.begin();
        // monitored code goes here
        stats.end();
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

main()