import { mat4, vec3 } from 'wgpu-matrix';
// import { mat4, vec3 } from 'gl-matrix'

export const getMatrixProjection = (
    aspectRatio: number = 1,
    fovy: number = Math.PI / 4,
    nearPlane: number = 0.1,
    farPlane: number = 100
) => {
    return mat4.perspective(fovy, aspectRatio, nearPlane, farPlane)
}

export const getMatrixView = (
    eye = vec3.fromValues(0, 0, 5),
    target = vec3.fromValues(0, 0, 0),
    up = vec3.fromValues(0, 1, 0)
) => {
    return mat4.lookAt(eye, target, up)
}
// export const getMatrixProjection = (
//     aspectRatio: number = 1,
//     fovy: number = Math.PI / 4,
//     nearPlane: number = 0.1,
//     farPlane: number = 100
// ) => {
//     const projection = mat4.create()
//     return mat4.perspective(projection, fovy, aspectRatio, nearPlane, farPlane)
// }

// export const getMatrixView = (
//     eye = vec3.fromValues(0, 0, 5),
//     target = vec3.fromValues(0, 0, 0),
//     up = vec3.fromValues(0, 1, 0)
// ) => {
//     const view = mat4.create()
//     return mat4.lookAt(view, eye, target, up)
// }

export function toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}