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

    const lines = new Float32Array(gridSize * gridSize * 4 * 3)

    const linesBuffer: GPUBuffer[] = [
        device.createBuffer({
            label: 'Lines vertices A',
            size: lines.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        }),
        device.createBuffer({
            label: 'Lines vertices B',
            size: lines.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        })
    ]

    device.queue.writeBuffer(linesBuffer[0], 0, lines)

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
            // topology: 'line-list'
            topology: 'point-list'
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
        // const worgroupCount: number = 1
        computePass.dispatchWorkgroups(worgroupCount, worgroupCount)
        computePass.end()

        const copy: GPUBuffer = device.createBuffer({
            label: 'Lines vertices',
            size: lines.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        })

        encoder.copyBufferToBuffer(linesBuffer[1], 0, copy, 0, linesBuffer[0].size)



        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                loadOp: 'clear',
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
                // clearValue: { r: 1, g: 1, b: 1, a: 1 },
                storeOp: 'store'
            }]
        }

        const renderPass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)
        renderPass.setPipeline(shaderPipeline)
        renderPass.setBindGroup(0, bindGroup[1])
        renderPass.draw(lines.length / 3)
        renderPass.end()
        device.queue.submit([encoder.finish()])

        function countNonZeroValues(floatArray: Float32Array) {
            let count = 0;
            for (let i = 0; i < floatArray.length; i++) {
                if (floatArray[i] !== 0) {
                    count++;
                }
            }
            return count;
        }

        await Promise.all([
            copy.mapAsync(GPUMapMode.READ),
        ]);

        const workgroup = new Float32Array(copy.getMappedRange());

        const lines2 = []

        for (let i = 0; i < workgroup.length - 6; i = i + 6) {
            if (
                workgroup[i] === 0 &&
                workgroup[i + 1] === 0 &&
                workgroup[i + 2] === 0 &&
                workgroup[i + 3] === 0 &&
                workgroup[i + 4] === 0 &&
                workgroup[i + 5] === 0
            ) {
                continue
            }
            lines2.push(
                [
                    workgroup[i], workgroup[i + 1], workgroup[i + 2],
                    workgroup[i + 3], workgroup[i + 4], workgroup[i + 5],
                ]
            )
        }
        // console.log(lines2)

        // console.log(countNonZeroValues(workgroup))
        console.log(workgroup)
    }

    render()
}

main()