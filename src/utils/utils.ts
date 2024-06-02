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
        { source },
        // { source, flipY: true },
        { texture },
        { width: source.width, height: source.height }
    )
    return texture
}


export const setupResizeObserver = (
    canvas: HTMLCanvasElement, device: GPUDevice, uniformBuffer: GPUBuffer, uniformBufferArray: Float32Array, projectionMatrix: Mat4,
    getProjectionMatrix: (aspectRatio?: number, fovy?: number, nearPlane?: number, farPlane?: number) => Mat4,
    render: () => void) => {

    const observer = new ResizeObserver(entries => {
        let width = entries[0].contentBoxSize[0].inlineSize;
        let height = entries[0].contentBoxSize[0].blockSize;
        canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
        canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

        projectionMatrix = getProjectionMatrix(width / height);
        uniformBufferArray.set(projectionMatrix, 32);
        device.queue.writeBuffer(uniformBuffer, 0, uniformBufferArray);

        render();
    });

    observer.observe(canvas);
}



