// import { mat4 } from 'wgpu-matrix'
import { mat4, Mat4, vec3 } from 'wgpu-matrix'
import sprite from './6-sprites.wgsl'
import { updateFirstPersonCamera, getFirstPersonCamera, getProjectionMatrix } from './utils/matrix'
import { getTexture, setupResizeObserver } from './utils/utils'
import { initializeWebGPU } from './utils/webgpuInit'
import { createPlane } from './meshes/plane'
import { createMesh, updateMatrix } from './meshes/create-mesh'
import * as dat from 'dat.gui';

async function main() {
    const configureDepthStencil = true

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement

    const { device, context, canvasFormat, aspectRatio } = await initializeWebGPU(canvas)

    let projectionMatrix = getProjectionMatrix(aspectRatio)

    let modelMatrix = mat4.identity()
    modelMatrix = mat4.scale(modelMatrix, vec3.fromValues(1 / 8, 1 / 8, 1))
    modelMatrix = mat4.translate(modelMatrix, vec3.fromValues(0, 1, 0))
    
    let viewMatrix = getFirstPersonCamera()

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
    const spriteBufferArray = new Uint32Array([1])
    const spriteBuffer: GPUBuffer = device.createBuffer({
        label: 'Sprite Buffer',
        size: spriteBufferArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(spriteBuffer, 0, spriteBufferArray)

    const nVertices = 100
    const size = nVertices / 4
    const planeVertices = createPlane(nVertices, size, false)

    

    const { pipelineMesh, bindGroupMesh, vertexBufferMesh, nDrawMesh, modelMatrixMesh, matrixBufferArrayMesh, matrixBufferMesh } =
        createMesh(device, canvasFormat, projectionMatrix, viewMatrix, planeVertices, -Math.PI / 2, 'point-list', configureDepthStencil)


    const vertices = new Float32Array([
        // x, y, u, v
        -1, -1, 0, 0,
        1, -1, 1, 0,
        1, 1, 1, 1,

        1, 1, 1, 1,
        -1, 1, 0, 1,
        -1, -1, 0, 0
    ]);


    const vertexBuffer: GPUBuffer = device.createBuffer({
        label: ' vertices',
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
        }, {
            format: "float32x2",
            offset: 8,
            shaderLocation: 1
        }
        ]
    }

    const numberOfQuads = 100
    const quadInstanceArray = new Float32Array(numberOfQuads * 3)
    const quadInstaceBuffer = device.createBuffer({
        label: 'Quad Instaces Buffer',
        size: quadInstanceArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })

    const k = 40

    for (let i = 0; i < numberOfQuads; i++) {
        quadInstanceArray[i * 3 + 0] = Math.random() * k - k / 2
        quadInstanceArray[i * 3 + 1] = Math.random() * k / 2 - k / 4
        quadInstanceArray[i * 3 + 2] = Math.random() * k / 8 - k / 16
    }

    device.queue.writeBuffer(quadInstaceBuffer, 0, quadInstanceArray)

    const texture = await getTexture("/webgpu_demos/star.png", device)

    const sampler = device.createSampler({
        magFilter: 'nearest'
    })

    const shaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Shader',
        code: sprite
    })

    const bindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        label: 'Bind Group Layout',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'read-only-storage' }
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
            {
                binding: 4,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }
        ]
    })

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: { buffer: matrixBuffer }
        },
        {
            binding: 1,
            resource: { buffer: quadInstaceBuffer }
        },
        {
            binding: 2,
            resource: sampler
        },
        {
            binding: 3,
            resource: texture.createView()
        },
        {
            binding: 4,
            resource: { buffer: spriteBuffer }
        }
        ]
    })

    const pipelineLayout = device.createPipelineLayout({
        label: 'Pipeline Layout',
        bindGroupLayouts: [bindGroupLayout]
    })

    const pipelineDescriptor: GPURenderPipelineDescriptor = {
        label: 'pipeline',
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
                format: canvasFormat,
                blend: {
                    color: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add'
                    },
                    alpha: {
                        srcFactor: 'one',
                        dstFactor: 'one-minus-src-alpha',
                        operation: 'add'
                    }
                }
            }]
        },
        primitive: {
            topology: 'triangle-list'
            // topology: 'line-list'
            // topology: 'point-list'
        },
    }
    if (configureDepthStencil) {
        pipelineDescriptor.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus'
        };
    }

    const pipeline: GPURenderPipeline = device.createRenderPipeline(pipelineDescriptor)


    function render() {
        const depthTexture = device.createTexture({
            size: [canvas.width, canvas.height, 1],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        })

        const encoder: GPUCommandEncoder = device.createCommandEncoder()
        const textureView: GPUTextureView = context!.getCurrentTexture().createView()
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                loadOp: 'clear',
                // clearValue: { r: 1, g: 1, b: 1, a: 1 },
                clearValue: { r: 0.2, g: 0.2, b: 0.298, a: 1 },
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
        const pass: GPURenderPassEncoder = encoder.beginRenderPass(renderPassDescriptor)

        // Primeiro pipeline draw plane
        updateMatrix(modelMatrixMesh, viewMatrix, projectionMatrix, matrixBufferArrayMesh, matrixBufferMesh, device)
        pass.setPipeline(pipelineMesh)
        pass.setBindGroup(0, bindGroupMesh)
        pass.setVertexBuffer(0, vertexBufferMesh)
        pass.draw(nDrawMesh)

        // Segundo pipeline draw squad
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.setVertexBuffer(0, vertexBuffer)
        pass.draw(vertices.length / 4, numberOfQuads)


        pass.end()
        device.queue.submit([encoder.finish()])
    }

    render()

    var gui = new dat.GUI();
    gui.domElement.style.marginTop = "10px";
    gui.domElement.id = "datGUI";
    var options = {
        billboard: true
    }

    gui.add(options, "billboard").onChange(function (value) {
        spriteBufferArray[0] = value ? 1 : 0
        device.queue.writeBuffer(spriteBuffer, 0, spriteBufferArray)
        render()
    })


    const updateViewMatrix = (newMatrix: Mat4) => {
        viewMatrix = newMatrix
    }

    // update camera on mouse move
    updateFirstPersonCamera(canvas, matrixBufferArray, matrixBuffer, device, render, updateViewMatrix)

    const updateProjectionMatrix = (newMatrix: Mat4) => {
        projectionMatrix = newMatrix;
    };
    // resize screen
    setupResizeObserver(canvas, device, matrixBuffer, matrixBufferArray, getProjectionMatrix, render, updateProjectionMatrix);
}

main()