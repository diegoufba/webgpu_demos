import { Mat4, mat4 } from 'wgpu-matrix'
import shaderMesh from './create-mesh.wgsl'

export const createMesh = (
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
    projectionMatrix: Mat4,
    viewMatrix: Mat4,
    vertices: Float32Array,
    rotateX: number = 0,
    topology: string = 'triangle-list',
    configureDepthStencil: boolean = true,
    is3d: boolean = false,
) => {
    let modelMatrixMesh = mat4.identity()
    modelMatrixMesh = mat4.rotateX(modelMatrixMesh,rotateX)

    //Set Uniform Buffer *****************************************************************************
    const matrixBufferArrayMesh = new Float32Array(4 * 4 * 3)

    const matrixBufferMesh: GPUBuffer = device.createBuffer({
        label: 'Matrix buffer',
        size: matrixBufferArrayMesh.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    matrixBufferArrayMesh.set(modelMatrixMesh, 0)
    matrixBufferArrayMesh.set(viewMatrix, 16)
    matrixBufferArrayMesh.set(projectionMatrix, 32)

    device.queue.writeBuffer(matrixBufferMesh, 0, matrixBufferArrayMesh)

    //************************************************************************************************

    const nDrawMesh = is3d ? vertices.length / 3 : vertices.length / 2

    const vertexBufferMesh: GPUBuffer = device.createBuffer({
        label: 'Vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(vertexBufferMesh, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: is3d ? 12 : 8,
        attributes: [{
            format: is3d ? "float32x3" : "float32x2",
            offset: 0,
            shaderLocation: 0,
        }]
    }

    const shaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Shader',
        code: shaderMesh
    })

    const pipelineMeshDescriptor: GPURenderPipelineDescriptor = {
        label: 'pipelineMesh',
        layout: 'auto',
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
            }]
        },
        primitive: {
            topology: topology as GPUPrimitiveTopology
        },
    }

    if (configureDepthStencil) {
        pipelineMeshDescriptor.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus'
        };
    }

    const pipelineMesh: GPURenderPipeline = device.createRenderPipeline(pipelineMeshDescriptor)

    const bindGroupMesh: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: pipelineMesh.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: { buffer: matrixBufferMesh }
        },
        ]
    })


    return { pipelineMesh, bindGroupMesh, vertexBufferMesh, nDrawMesh, modelMatrixMesh, matrixBufferArrayMesh, matrixBufferMesh }
}
export const updateMatrix = (
    modelMatrix: Mat4,
    viewMatrix: Mat4,
    projectionMatrix: Mat4,
    matrixBufferArray: Float32Array,
    matrixBuffer: GPUBuffer,
    device: GPUDevice
) => {
    matrixBufferArray.set(modelMatrix, 0)
    matrixBufferArray.set(viewMatrix, 16)
    matrixBufferArray.set(projectionMatrix, 32)

    device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)
}