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

export const generatePlane = (n: number) => {
    const m = Math.sqrt(n);
    if (!Number.isInteger(m)) {
        throw new Error("n deve ser um quadrado perfeito");
    }

    const vertices = [];
    const step = 2 / m; // O passo para cada subdivisão

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            // Vértices do quadrado atual
            const x0 = -1 + j * step;
            const y0 = -1 + i * step;
            const x1 = x0 + step;
            const y1 = y0 + step;

            // Adiciona dois triângulos para formar o quadrado atual
            // Triângulo 1
            vertices.push(x0, y0, 0);
            vertices.push(x1, y0, 0);
            vertices.push(x0, y1, 0);

            // Triângulo 2
            vertices.push(x1, y0, 0);
            vertices.push(x1, y1, 0);
            vertices.push(x0, y1, 0);
        }
    }

    return new Float32Array(vertices);
}