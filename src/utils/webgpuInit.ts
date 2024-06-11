export const initializeWebGPU = async (canvas: HTMLCanvasElement) => {
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.")
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        throw new Error("No appropriate GPUAdapter found.")
    }
    
    const device: GPUDevice = await adapter.requestDevice()

    // const device: GPUDevice = await adapter.requestDevice({
    //     requiredLimits: {
    //         maxStorageBufferBindingSize: 134217728,
    //         maxBufferSize:3019898880,
    //     }
    // })

    const context = canvas.getContext('webgpu')
    if (!context) {
        throw new Error("WebGPU context not available.");
    }

    const canvasFormat: GPUTextureFormat = navigator.gpu.getPreferredCanvasFormat()
    context.configure({
        device,
        format: canvasFormat
    })

    let width: number = canvas.clientWidth;
    let height: number = canvas.clientHeight;
    canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
    canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

    const aspectRatio = width / height

    return { device, context, canvasFormat, aspectRatio }
} 