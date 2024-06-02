import { Mat4, mat4 } from 'wgpu-matrix'
import { toRadians } from '../utils/matrix'
import { createPlane } from '../meshes/plane'
import referencePlane from './shader.wgsl'

export const getReferencePlane = (
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
    projectionMatrix: Mat4,
    viewMatrix: Mat4
) => {
    let modelMatrixPlane = mat4.identity()
    modelMatrixPlane = mat4.rotateX(modelMatrixPlane, toRadians(-90))

    //Set Uniform Buffer *****************************************************************************
    const matrixBufferArrayPlane = new Float32Array(4 * 4 * 3)

    const matrixBufferPlane: GPUBuffer = device.createBuffer({
        label: 'Uniform buffer',
        size: matrixBufferArrayPlane.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    matrixBufferArrayPlane.set(modelMatrixPlane, 0)
    matrixBufferArrayPlane.set(viewMatrix, 16)
    matrixBufferArrayPlane.set(projectionMatrix, 32)

    device.queue.writeBuffer(matrixBufferPlane, 0, matrixBufferArrayPlane)

    //************************************************************************************************

    const size = 100
    const scale = size / 4

    const vertices = createPlane(false, true, size, size, scale, scale)
    const vertexCountPlane = vertices.length / 2

    const vertexBufferPlane: GPUBuffer = device.createBuffer({
        label: 'Triangle vertices',
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })

    device.queue.writeBuffer(vertexBufferPlane, 0, vertices)

    const vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 8,
        attributes: [{
            format: "float32x2",
            offset: 0,
            shaderLocation: 0,
        }]
    }

    const triangleShaderModule: GPUShaderModule = device.createShaderModule({
        label: 'Triangle shader',
        code: referencePlane
    })

    const pipelinePlane: GPURenderPipeline = device.createRenderPipeline({
        label: 'Triangle pipelinePlane',
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
        },
        primitive: {
            // topology: 'triangle-list'
            // topology: 'line-list'
            topology: 'point-list'
        }
    })

    const bindGroupPlane: GPUBindGroup = device.createBindGroup({
        label: 'Bind Group',
        layout: pipelinePlane.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: { buffer: matrixBufferPlane }
        },
        ]
    })


    return { pipelinePlane, bindGroupPlane, vertexBufferPlane, vertexCountPlane, modelMatrixPlane, matrixBufferArrayPlane, matrixBufferPlane }
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