import compute from './2-compute.wgsl?raw'
import shader from './2-shader.wgsl?raw'
import * as dat from 'dat.gui';

async function main() {

    //*********************************************************************************************************
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.")
    }

    const adpater = await navigator.gpu.requestAdapter()
    if (!adpater) {
        throw new Error("No appropriate GPUAdapter found.")
    }

    const device: GPUDevice = await adpater.requestDevice()

    const context = canvas.getContext('webgpu')
    if (!context) {
        throw new Error("WebGPU context not available.");
    }

    const canvasFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat()
    context.configure({
        device,
        format: canvasFormat,
    })
    //*********************************************************************************************************

    let width: number = 1024
    let height: number = 1024

    let resolution: number = (width < height) ? width : height // pixels resolution x resolution
    resolution = width/1.5
    let gridSize: number = Math.floor(resolution / 4) // grid = gridSize x gridSize
    let sideLength: number = resolution / gridSize //square side lenght
    let shape: number = 1

    const paramsArrayBuffer = new ArrayBuffer(16) // 2 u32 e 2 f32
    const paramsUint32View = new Uint32Array(paramsArrayBuffer)
    const paramsFloat32View = new Float32Array(paramsArrayBuffer)
    paramsUint32View[0] = shape
    paramsUint32View[1] = gridSize
    paramsFloat32View[2] = resolution
    paramsFloat32View[3] = sideLength

    const paramsBuffer: GPUBuffer = device.createBuffer({
        label: 'Params buffer',
        size: paramsArrayBuffer.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)

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
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: 'uniform' }
        },
        ]
    })

    let pointsBuffer: GPUBuffer[]
    let bindGroup: GPUBindGroup[]
    let points: Float32Array

    function createPointsBuffer() {
        points = new Float32Array(gridSize * gridSize * 4 * 2)

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
                ]
            })
        ]
    }

    createPointsBuffer()

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
        const encoder: GPUCommandEncoder = device.createCommandEncoder()

        const computePass = encoder.beginComputePass()
        computePass.setPipeline(simulationPipeline)
        computePass.setBindGroup(0, bindGroup[0])
        computePass.dispatchWorkgroups(gridSize / 8, gridSize / 8)
        computePass.end()

        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                loadOp: 'clear',
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
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
    gui.domElement.style.marginTop = "100px";
    gui.domElement.id = "datGUI";

    let options = {
        gridSize: gridSize,
        shape: 'star' as Shape
    };

    const shapes: Shape[] = ['star', 'infinity', 'circle', 'heart'];

    gui.add(options, "shape", shapes).onFinishChange((value: Shape) => {
        shape = shapeMap[value];
        paramsUint32View[0] = shape
        device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)
        createPointsBuffer()
        render()
    });

    gui.add(options, "gridSize", 10, Math.floor(resolution), 10).onFinishChange((value) => {
        gridSize = value;
        sideLength = resolution / gridSize;
        paramsUint32View[1] = gridSize
        paramsFloat32View[3] = sideLength
        device.queue.writeBuffer(paramsBuffer, 0, paramsArrayBuffer)
        createPointsBuffer()
        render()
    });

    //*********************************************************************************************************
}

main()