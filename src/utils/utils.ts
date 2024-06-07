import { Mat4 } from "wgpu-matrix"

export const getTexture = async (location: string, device: GPUDevice) => {
    const res = await fetch(location)
    const blob = await res.blob()
    const source = await createImageBitmap(blob, { colorSpaceConversion: 'none' })

    const texture: GPUTexture = device.createTexture({
        label: location,
        format: 'rgba8unorm',
        size: [source.width, source.height],
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    device.queue.copyExternalImageToTexture(
        // { source },
        { source, flipY: true },
        { texture },
        { width: source.width, height: source.height }
    )
    return texture
}


export const setupResizeObserver = (
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    uniformBuffer: GPUBuffer,
    uniformBufferArray: Float32Array,
    getProjectionMatrix: (aspectRatio?: number, fovy?: number, nearPlane?: number, farPlane?: number) => Mat4,
    render: () => void,
    updateProjectionMatrix: (newMatrix: Mat4) => void,
) => {

    const observer = new ResizeObserver(entries => {
        let width = entries[0].contentBoxSize[0].inlineSize;
        let height = entries[0].contentBoxSize[0].blockSize;
        canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

        const newProjectionMatrix = getProjectionMatrix(width / height);
        updateProjectionMatrix(newProjectionMatrix)
        uniformBufferArray.set(newProjectionMatrix, 32);
        device.queue.writeBuffer(uniformBuffer, 0, uniformBufferArray);

        render();
    });

    observer.observe(canvas);
}

export const setDepthStencil = (
    configureDepthStencil: boolean,
    device: GPUDevice,
    canvas: HTMLCanvasElement,
    pipelineDescriptor: GPURenderPipelineDescriptor
) => {

    let canvasWidth = canvas.width
    let canvasHeight = canvas.height
    let depthTexture: GPUTexture

    if (configureDepthStencil) {
        depthTexture = getDepthTexture()
        pipelineDescriptor.depthStencil = {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus'
        }
    }

    function getDepthTexture() {
        return device.createTexture({
            size: [canvas.width, canvas.height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        })
    }

    const updateDepthTextureSize = () => {
        if (configureDepthStencil && canvasWidth != canvas.width || canvasHeight != canvas.height) {
            depthTexture.destroy()
            depthTexture = getDepthTexture()
            canvasWidth = canvas.width
            canvasHeight = canvas.height
        }
    }

    const addDepthSpencil = (renderPassDescriptor: GPURenderPassDescriptor) => {
        if (configureDepthStencil) {
            renderPassDescriptor.depthStencilAttachment = {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        }
    }



    return { updateDepthTextureSize, addDepthSpencil }
}
