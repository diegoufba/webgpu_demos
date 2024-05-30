import { mat4, vec3 } from 'wgpu-matrix';

export default function camera(){

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
}