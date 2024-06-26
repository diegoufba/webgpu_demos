export const cubeVertexArray = new Float32Array([
    // float4 position
    1, -1, 1,
    -1, -1, 1,
    -1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, -1,

    1, 1, 1,
    1, -1, 1,
    1, -1, -1,
    1, 1, -1,
    1, 1, 1,
    1, -1, -1,

    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    -1, 1, -1,
    -1, 1, 1,
    1, 1, -1,

    -1, -1, 1,
    -1, 1, 1,
    -1, 1, -1,
    -1, -1, -1,
    -1, -1, 1,
    -1, 1, -1,

    1, 1, 1,
    -1, 1, 1,
    -1, -1, 1,
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,

    1, -1, -1,
    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    -1, 1, -1,
])

export const cubeVertexArrayNormalUV = new Float32Array([
    // float3 position, float2 uv, float3 normal
    // Face inferior
    1, -1, 1,  1, 0,  0, -1, 0, // Vértice 1
    -1, -1, 1, 0, 0,  0, -1, 0, // Vértice 2
    -1, -1, -1, 0, 1,  0, -1, 0, // Vértice 3
    1, -1, -1, 1, 1,  0, -1, 0, // Vértice 4
    1, -1, 1,  1, 0,  0, -1, 0, // Vértice 5
    -1, -1, -1, 0, 1,  0, -1, 0, // Vértice 6

    // Face direita
    1, 1, 1,   1, 0,  1, 0, 0,    // Vértice 7
    1, -1, 1,  1, 1,  1, 0, 0,    // Vértice 8
    1, -1, -1, 0, 1,  1, 0, 0,    // Vértice 9
    1, 1, -1,  0, 0,  1, 0, 0,    // Vértice 10
    1, 1, 1,   1, 0,  1, 0, 0,    // Vértice 11
    1, -1, -1, 0, 1,  1, 0, 0,    // Vértice 12

    // Face superior
    -1, 1, 1,  0, 1,  0, 1, 0,    // Vértice 13
    1, 1, 1,   1, 1,  0, 1, 0,    // Vértice 14
    1, 1, -1,  1, 0,  0, 1, 0,    // Vértice 15
    -1, 1, -1, 0, 0,  0, 1, 0,    // Vértice 16
    -1, 1, 1,  0, 1,  0, 1, 0,    // Vértice 17
    1, 1, -1, 1, 0,  0, 1, 0,     // Vértice 18

    // Face esquerda (normais corrigidas)
    -1, -1, 1,  0, 0,  -1, 0, 0,  // Vértice 19
    -1, 1, 1,   1, 0,  -1, 0, 0,  // Vértice 20
    -1, 1, -1,  1, 1,  -1, 0, 0,  // Vértice 21
    -1, -1, -1, 0, 1,  -1, 0, 0,  // Vértice 22
    -1, -1, 1,  0, 0,  -1, 0, 0,  // Vértice 23
    -1, 1, -1,  1, 1,  -1, 0, 0,  // Vértice 24

    // Face frontal
    1, 1, 1,   1, 1,  0, 0, 1,    // Vértice 25
    -1, 1, 1,  0, 1,  0, 0, 1,    // Vértice 26
    -1, -1, 1, 0, 0,  0, 0, 1,    // Vértice 27
    -1, -1, 1, 0, 0,  0, 0, 1,    // Vértice 28
    1, -1, 1,  1, 0,  0, 0, 1,    // Vértice 29
    1, 1, 1,   1, 1,  0, 0, 1,    // Vértice 30

    // Face traseira
    1, -1, -1, 1, 0,  0, 0, -1,   // Vértice 31
    -1, -1, -1, 0, 0, 0, 0, -1,   // Vértice 32
    -1, 1, -1,  0, 1, 0, 0, -1,   // Vértice 33
    1, 1, -1,   1, 1, 0, 0, -1,   // Vértice 34
    1, -1, -1,  1, 0, 0, 0, -1,   // Vértice 35
    -1, 1, -1,  0, 1, 0, 0, -1,   // Vértice 36
]);





export const cubeVertexArrayUv2 = new Float32Array([
    // float5 position (x, y, z, u, v)
    1, -1, 1, 1, 0,
    -1, -1, 1, 0, 0,
    -1, -1, -1, 0, 1,
    1, -1, -1, 1, 1,
    1, -1, 1, 1, 0,
    -1, -1, -1, 0, 1,

    1, 1, 1, 1, 0,
    1, -1, 1, 1, 1,
    1, -1, -1, 0, 1,
    1, 1, -1, 0, 0,
    1, 1, 1, 1, 0,
    1, -1, -1, 0, 1,

    -1, 1, 1, 0, 0,
    1, 1, 1, 1, 0,
    1, 1, -1, 1, 1,
    -1, 1, -1, 0, 1,
    -1, 1, 1, 0, 0,
    1, 1, -1, 1, 1,

    -1, -1, 1, 1, 0,
    -1, 1, 1, 1, 1,
    -1, 1, -1, 0, 1,
    -1, -1, -1, 0, 0,
    -1, -1, 1, 1, 0,
    -1, 1, -1, 0, 1,

    1, 1, 1, 0, 0,
    -1, 1, 1, 1, 0,
    -1, -1, 1, 1, 1,
    -1, -1, 1, 1, 1,
    1, -1, 1, 0, 1,
    1, 1, 1, 0, 0,

    1, -1, -1, 1, 0,
    -1, -1, -1, 0, 0,
    -1, 1, -1, 0, 1,
    1, 1, -1, 1, 1,
    1, -1, -1, 1, 0,
    -1, 1, -1, 0, 1,
]);

export const cubeVertexArrayUv = new Float32Array([
    //  position   |  texture coordinate
    //-------------+----------------------
    // front face     select the top left image
   -1,  1,  1,        0   , 0  ,
   -1, -1,  1,        0   , 0.5,
    1,  1,  1,        0.25, 0  ,
    1, -1,  1,        0.25, 0.5,
    // right face     select the top middle image
    1,  1, -1,        0.25, 0  ,
    1,  1,  1,        0.5 , 0  ,
    1, -1, -1,        0.25, 0.5,
    1, -1,  1,        0.5 , 0.5,
    // back face      select to top right image
    1,  1, -1,        0.5 , 0  ,
    1, -1, -1,        0.5 , 0.5,
   -1,  1, -1,        0.75, 0  ,
   -1, -1, -1,        0.75, 0.5,
   // left face       select the bottom left image
   -1,  1,  1,        0   , 0.5,
   -1,  1, -1,        0.25, 0.5,
   -1, -1,  1,        0   , 1  ,
   -1, -1, -1,        0.25, 1  ,
   // bottom face     select the bottom middle image
    1, -1,  1,        0.25, 0.5,
   -1, -1,  1,        0.5 , 0.5,
    1, -1, -1,        0.25, 1  ,
   -1, -1, -1,        0.5 , 1  ,
   // top face        select the bottom right image
   -1,  1,  1,        0.5 , 0.5,
    1,  1,  1,        0.75, 0.5,
   -1,  1, -1,        0.5 , 1  ,
    1,  1, -1,        0.75, 1  ,

 ]);

export const cubeVertexArrayUvIndexData = new Uint16Array([
    0,  1,  2,  2,  1,  3,  // front
    4,  5,  6,  6,  5,  7,  // right
    8,  9, 10, 10,  9, 11,  // back
   12, 13, 14, 14, 13, 15,  // left
   16, 17, 18, 18, 17, 19,  // bottom
   20, 21, 22, 22, 21, 23,  // top
 ]);
