import compute from './5-compute.wgsl'
import shader from './5-shader.wgsl'
import * as dat from 'dat.gui';
import { initializeWebGPU } from './utils/webgpuInit';
import { getArcRotateCamera, getProjectionMatrix, updateArcRotateCamera } from './utils/matrix';
import { Mat4, mat4, vec3 } from 'wgpu-matrix';
import { setupResizeObserver } from './utils/utils';
import { getEdgeTable, triTable } from './5-tables';

async function main() {

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    // let viewMatrix = getViewMatrix()
    let viewMatrix = getArcRotateCamera()

    let modelMatrix = mat4.identity()
    modelMatrix = mat4.scale(modelMatrix, vec3.fromValues(4, 4, 1))
    modelMatrix = mat4.translate(modelMatrix, vec3.fromValues(-1, -1, 0))

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

    const side = 2;
    let gridSize: number = 50 // grid = gridSize x gridSize
    let sideLength: number = side / gridSize //square side lenght
    let interpolation: number = 1
    let shape: number = 1

    let topology: GPUPrimitiveTopology = 'line-list'

    const paramsArrayBuffer = new ArrayBuffer(16) // 2 u32 e 2 f32
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

    function updateParamsBuffer() {
        // resolution = Math.min(width, height) // pixels resolution x resolution
        sideLength = side / gridSize //square side lenght
        paramsUint32View[0] = shape
        paramsUint32View[1] = gridSize
        paramsUint32View[2] = interpolation
        paramsFloat32View[3] = sideLength
        device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)
    }

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

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: 'read-only-storage' }
        },
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
            binding: 5,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        }
        ]
    })

    let pointsBuffer: GPUBuffer[]
    let bindGroup: GPUBindGroup[]
    let points: Float32Array

    function createPointsBuffer() {
        points = new Float32Array(gridSize * gridSize * gridSize * 12 * 4) // 12 vec3, cada um ocupa 4 espacoes devido ao pad

        pointsBuffer = [
            device.createBuffer({
                label: 'Points vertices A',
                size: points.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            }),
            device.createBuffer({
                label: 'Points vertices B',
                size: points.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
        ]


        bindGroup = [
            device.createBindGroup({
                label: 'Bind Group A',
                layout: bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: pointsBuffer[0] },
                },
                {
                    binding: 1,
                    resource: { buffer: pointsBuffer[1] },
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
                    binding: 5,
                    resource: { buffer: matrixBuffer }
                }
                ]
            }),
            device.createBindGroup({
                label: 'Bind Group B',
                layout: bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: pointsBuffer[1] },
                },
                {
                    binding: 1,
                    resource: { buffer: pointsBuffer[0] },
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
                    binding: 5,
                    resource: { buffer: matrixBuffer }
                }
                ]
            })
        ]
    }

    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
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
        layout: pipelineLayout,
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

    let shaderPipeline: GPURenderPipeline = device.createRenderPipeline(shaderPipelineDescriptor)

    const simulationPipeline: GPUComputePipeline = device.createComputePipeline({
        label: 'Compute pipeline',
        layout: pipelineLayout,
        compute: {
            module: computeModule,
            entryPoint: 'main',
        }
    })

    async function render() {
        createPointsBuffer()
        const encoder: GPUCommandEncoder = device.createCommandEncoder()

        const computePass = encoder.beginComputePass()
        computePass.setPipeline(simulationPipeline)
        computePass.setBindGroup(0, bindGroup[0])
        computePass.dispatchWorkgroups(gridSize / 4, gridSize / 4, gridSize / 4)
        computePass.end()


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

        const renderPass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        renderPass.setPipeline(shaderPipeline)
        renderPass.setBindGroup(0, bindGroup[1])
        renderPass.draw(points.length / 2)
        renderPass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

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
        shape: 'circle' as Shape,
        interpolation: true,
        points: false,
    };

    const shapes: Shape[] = ['star', 'infinity', 'circle', 'heart'];

    gui.add(options, "shape", shapes).onChange((value: Shape) => {
        shape = shapeMap[value];
        updateParamsBuffer()
        render()
    });

    gui.add(options, "gridSize", 10, 80, 10).onChange((value) => {
        gridSize = value;
        updateParamsBuffer()
        render()
    });

    gui.add(options, "interpolation").onChange((value) => {
        interpolation = value ? 1 : 0;
        updateParamsBuffer()
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