import { Mat4, mat4, vec3 } from 'wgpu-matrix';

export const getProjectionMatrix = (
    aspectRatio: number = 1,
    fovy: number = Math.PI / 4,
    nearPlane: number = 0.1,
    farPlane: number = 100
) => {
    return mat4.perspective(fovy, aspectRatio, nearPlane, farPlane)
}

export const getViewMatrix = (
    eye = vec3.fromValues(0, 0, 5),
    target = vec3.fromValues(0, 0, 0),
    up = vec3.fromValues(0, 1, 0)
) => {
    return mat4.lookAt(eye, target, up)
}
export function toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

export const getArcRotateCamera = () =>{
    let target = vec3.fromValues(0, 0, 0);
    let alpha = Math.PI / 2;  // Rotação longitudinal
    let beta = 0.0;   // Rotação latitudinal
    let radius = 10.0; // Distância do alvo

    let eye = vec3.create();
    eye[0] = radius * Math.cos(beta) * Math.cos(alpha);
    eye[1] = radius * Math.sin(beta);
    eye[2] = radius * Math.cos(beta) * Math.sin(alpha);

    let up = vec3.fromValues(0, 1, 0);

    let viewMatrix = mat4.lookAt(eye, target, up)

    return viewMatrix
}

export const updateArcRotateCamera = (
    canvas: HTMLCanvasElement,
    viewMatrix: Mat4,
    matrixBufferArray: Float32Array,
    matrixBuffer: GPUBuffer,
    device: GPUDevice,
    render: () => void
) => {
    let target = vec3.fromValues(0, 0, 0);
    let alpha = Math.PI / 2;  // Rotação longitudinal
    let beta = 0.0;   // Rotação latitudinal
    let radius = 10.0; // Distância do alvo

    let eye = vec3.create();
    eye[0] = radius * Math.cos(beta) * Math.cos(alpha);
    eye[1] = radius * Math.sin(beta);
    eye[2] = radius * Math.cos(beta) * Math.sin(alpha);

    let up = vec3.fromValues(0, 1, 0);

    function updateCamera() {
        // Recalcular a posição da câmera
        eye[0] = radius * Math.cos(beta) * Math.cos(alpha);
        eye[1] = radius * Math.sin(beta);
        eye[2] = radius * Math.cos(beta) * Math.sin(alpha);

        // Recalcular a matriz de visualização
        viewMatrix = mat4.lookAt(eye, target, up)
        matrixBufferArray.set(viewMatrix, 16)
        device.queue.writeBuffer(matrixBuffer, 0, matrixBufferArray)
        render()
    }

    // Controle do mouse
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseout', () => {
        isDragging = false;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            let deltaX = event.clientX - previousMousePosition.x;
            let deltaY = event.clientY - previousMousePosition.y;

            alpha += deltaX * 0.01;
            beta += deltaY * 0.01;

            updateCamera();
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    canvas.addEventListener('wheel',(event)=>{
        radius += event.deltaY * 0.1
        updateCamera()
    })
}