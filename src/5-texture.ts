import triangle from './5-texture.wgsl'

async function main() {
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

    const vertices = new Float32Array([
        // 0.0, 0.0,  // center
        // 1.0, 0.0,  // right, center
        // 0.0, 1.0,  // center, top

        // // 2st triangle
        // 0.0, 1.0,  // center, top
        // 1.0, 0.0,  // right, center
        // 1.0, 1.0,
        -0.8, -0.8, 0.0, 0.0,
        0.8, -0.8, 1.0, 0.0,
        0.8, 0.8, 1.0, 1.0,

        -0.8, -0.8, 0.0, 0.0,
        0.8, 0.8, 1.0, 1.0,
        -0.8, 0.8, 0.0, 1.0,
    ])

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

    async function loadImageBitmap(url: string) {
        const res = await fetch(url)
        const blob = await res.blob()
        return await createImageBitmap(blob, { colorSpaceConversion: 'none' })
    }

    const url = "../public/waveTexture.jpg"
    const source = await loadImageBitmap(url)

    const texture = device.createTexture({
        label: url,
        format: 'rgba8unorm',
        size: [source.width, source.height],
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    device.queue.copyExternalImageToTexture(
        { source },
        // { source, flipY: true },
        { texture },
        { width: source.width, height: source.height }
    )

    // const textureWidth = 5
    // const textureHeight = 7
    // const _ = [255, 0, 0, 255] // red
    // const y = [255, 255, 0, 255] //yellow
    // const b = [0, 0, 255, 255] // blue

    // const textureData = new Uint8Array([
    //     _, _, _, _, _,
    //     _, y, y, y, _,
    //     _, y, _, _, _,
    //     _, y, y, _, _,
    //     _, y, _, _, _,
    //     _, y, _, _, _,
    //     _, _, _, _, _,
    // ].flat())

    // const texture: GPUTexture = device.createTexture({
    //     size: [textureWidth, textureHeight],
    //     format: 'rgba8unorm',
    //     usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    // })

    // device.queue.writeTexture(
    //     { texture },
    //     textureData,
    //     { bytesPerRow: textureWidth * 4 },
    //     { width: textureWidth, height: textureHeight }
    // )

    const sampler = device.createSampler({
        magFilter: 'nearest',
        // magFilter:'linear',
        // addressModeU: 'repeat',
        // addressModeV: 'repeat'
    })

    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: triangle
    })

    const trianglePipeline: GPURenderPipeline = device.createRenderPipeline({
        label: 'Triangle pipeline',
        layout: 'auto',
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
        }
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        layout: trianglePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: texture.createView() }
        ]
    })

    function render() {
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
        pass.setPipeline(trianglePipeline)
        pass.setVertexBuffer(0, vertexBuffer)
        pass.setBindGroup(0, bindGroup)
        pass.draw(vertices.length / 4)
        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()
}

main()