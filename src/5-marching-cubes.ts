import compute from './5-compute.wgsl'
import shader from './5-shader.wgsl'
import * as dat from 'dat.gui';
import { initializeWebGPU } from './utils/webgpuInit';
import { getProjectionMatrix, getViewMatrix } from './utils/matrix';
import { Mat4, mat4, vec3 } from 'wgpu-matrix';
import { setupResizeObserver } from './utils/utils';

async function main() {

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)
    let viewMatrix = getViewMatrix()

    let modelMatrix = mat4.identity()
    modelMatrix = mat4.scale(modelMatrix, vec3.fromValues(2, 2, 1))
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

    let gridSize: number = 200 // grid = gridSize x gridSize
    let sideLength: number = 2 / gridSize //square side lenght
    let shape: number = 1

    const paramsArrayBuffer = new ArrayBuffer(12) // 2 u32 e 2 f32
    const paramsUint32View = new Uint32Array(paramsArrayBuffer)
    const paramsFloat32View = new Float32Array(paramsArrayBuffer)
    paramsUint32View[0] = shape
    paramsUint32View[1] = gridSize
    paramsFloat32View[2] = sideLength

    const paramsBuffer: GPUBuffer = device.createBuffer({
        label: 'Params buffer',
        size: paramsArrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)

    function updateParamsBuffer() {
        // resolution = Math.min(width, height) // pixels resolution x resolution
        sideLength = 2 / gridSize //square side lenght
        paramsUint32View[0] = shape
        paramsUint32View[1] = gridSize
        paramsFloat32View[2] = sideLength
        device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)
    }

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
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' }
        },
        ]
    })

    let pointsBuffer: GPUBuffer[]
    // let readPointsBuffer: GPUBuffer
    let bindGroup: GPUBindGroup[]
    let points: Float32Array

    function createPointsBuffer() {
        points = new Float32Array(gridSize * gridSize * 4 * 2)

        pointsBuffer = [
            device.createBuffer({
                label: 'Points vertices A',
                size: points.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                // usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            }),
            device.createBuffer({
                label: 'Points vertices B',
                size: points.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                // usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            })
        ]

        // // Buffer usado para devolver os pontos para a cpu (opcional)
        // readPointsBuffer = device.createBuffer({
        //     label: "Read Points",
        //     size: points.length,
        //     usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        // })
        // //************************************************* ******/

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
                    resource: { buffer: matrixBuffer }
                },
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
                    resource: { buffer: matrixBuffer }
                },
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

    const shaderPipeline: GPURenderPipeline = device.createRenderPipeline({
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
            topology: 'line-list'
            // topology: 'point-list'
        }
    })

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
        computePass.dispatchWorkgroups(gridSize / 8, gridSize / 8)
        computePass.end()

        // encoder.copyBufferToBuffer(pointsBuffer[1], 0, readPointsBuffer, 0, (gridSize * gridSize * 4 * 2))

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

        // await Promise.all([
        //     readPointsBuffer.mapAsync(GPUMapMode.READ),
        // ]);
        // const read = new Float32Array(readPointsBuffer.getMappedRange())
        // const p:number[] = []
        // read.forEach(element => {
        //     if (element != 0) {
        //         p.push(element)
        //     }
        // });
        // console.log(p)
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
        shape: 'star' as Shape
    };

    const shapes: Shape[] = ['star', 'infinity', 'circle', 'heart'];

    gui.add(options, "shape", shapes).onFinishChange((value: Shape) => {
        shape = shapeMap[value];
        updateParamsBuffer()
        render()
    });

    gui.add(options, "gridSize", 10, 2000, 10).onFinishChange((value) => {
        gridSize = value;
        updateParamsBuffer()
        render()
    });

    const updateProjectionMatrix = (newMatrix: Mat4) => {
        projectionMatrix = newMatrix;
    };
    // resize screen
    setupResizeObserver(canvas, device, matrixBuffer, matrixBufferArray, getProjectionMatrix, render, updateProjectionMatrix);

    //*********************************************************************************************************
}

main()