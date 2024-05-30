import { mat4, vec3 } from 'wgpu-matrix';
import wave from './4-wave.wgsl?raw'
import { generatePlane } from './solids/cube'
import * as dat from 'dat.gui';
// import { mat4, vec3 } from 'gl-matrix'


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

    async function loadImageBitmap(url: string) {
        const res = await fetch(url)
        const blob = await res.blob()
        return await createImageBitmap(blob, { colorSpaceConversion: 'none' })
    }

    const url = "/webgpu_demos/waveTexture.jpg"
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
    const sampler = device.createSampler()

    // const vertices = cubeVertexArray
    const size = 100
    const vertices = generatePlane(size * size)
    // console.log(vertices)


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
        }
        ]
    }

    function toRadians(degrees: number) {
        return degrees * (Math.PI / 180);
    }

    const fovy = toRadians(45)
    const aspectRatio = 1024 / 1024
    const nearPlane = 0.1
    const farPlane = 10
    const projection = mat4.perspective(fovy, aspectRatio, nearPlane, farPlane)

    const eye = vec3.fromValues(0, 0, -5)
    const target = vec3.fromValues(0, 0, 0)
    const up = vec3.fromValues(0, 1, 0)
    const view = mat4.lookAt(eye, target, up)

    let model = mat4.identity()
    let rotation = toRadians(60)
    model = mat4.rotateX(model, rotation)
    model = mat4.scale(model, [1.5, 1.5, 1.5])
    // model = mat4.rotateZ(model, rotation)

    const uniformBufferArray = new Float32Array(4 * 4 * 3)

    const uniformBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: uniformBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    uniformBufferArray.set(model, 0)
    uniformBufferArray.set(view, 16)
    uniformBufferArray.set(projection, 32)

    device.queue.writeBuffer(uniformBuffer, 0, uniformBufferArray)

    const paramsBufferArray = new Float32Array([1, 4, 4, 1])

    const paramsBufferBuffer: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: paramsBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer(paramsBufferBuffer, 0, paramsBufferArray)

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

    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout],
    })


    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: wave
    })

    const trianglePipeline: GPURenderPipeline = device.createRenderPipeline({
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
        primitive: {
            // topology: 'line-list'
            topology: 'triangle-list'
            // topology: 'point-list'
            // topology: 'line-strip'
        }
    })

    const initialTime = Date.now()
    let time = 0
    let speed = 2 / 1000
    function render() {

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
        pass.setPipeline(trianglePipeline)
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
}

main()