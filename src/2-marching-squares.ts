import compute from './2-compute.wgsl?raw'
import shader from './2-shader.wgsl?raw'

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
        format: canvasFormat
    })
    //*********************************************************************************************************

    let width: number = 512
    let height: number = 512

    let resolution: number = (width < height) ? width : height // pixels resolution x resolution
    let gridSize: number = Math.floor(resolution / 4) // grid = gridSize x gridSize
    let sideLength: number = resolution / gridSize //square side lenght
    let shape: number = 1

    const lines = new Float32Array(gridSize * gridSize * 4 * 2)

    const linesBuffer: GPUBuffer[] = [
        device.createBuffer({
            label: 'Lines vertices A',
            size: lines.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST ,
        }),
        device.createBuffer({
            label: 'Lines vertices B',
            size: lines.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST ,
        })
    ]

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
        ]
    })

    const bindGroup: GPUBindGroup[] = [
        device.createBindGroup({
            label: 'Bind Group A',
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: linesBuffer[0] },
            },
            {
                binding: 1,
                resource: { buffer: linesBuffer[1] },
            },
            ]
        }),
        device.createBindGroup({
            label: 'Bind Group B',
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: linesBuffer[1] },
            },
            {
                binding: 1,
                resource: { buffer: linesBuffer[0] },
            },
            ]
        })
    ]

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
        const worgroupCount: number = gridSize
        computePass.dispatchWorkgroups(worgroupCount/8, worgroupCount/8)
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
        renderPass.draw(lines.length / 2)
        renderPass.end()
        device.queue.submit([encoder.finish()])
    }

    render()
}

main()