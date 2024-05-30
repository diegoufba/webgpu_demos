export const createPlane = (
    verticesWidth: number,
    verticesHeight: number = verticesWidth,
    width: number = 1,
    height: number = width
) => {
    const vertices: number[] = [];

    const calculatePosition = (x: number, y: number): [number, number] => {
        return [((x / (verticesWidth - 1)) * 2 - 1) * width, ((y / (verticesHeight - 1)) * 2 - 1) * height];
    };

    const calculateUV = (x: number, y: number): [number, number] => {
        return [x / (verticesWidth - 1), y / (verticesHeight - 1)];
    };

    for (let y = 0; y < verticesHeight - 1; y++) {
        for (let x = 0; x < verticesWidth - 1; x++) {
            const [x0, y0] = [x, y];
            const [x1, y1] = [x + 1, y];
            const [x2, y2] = [x, y + 1];
            const [x3, y3] = [x + 1, y + 1];

            const [xt0, yt0] = calculatePosition(x0, y0);
            const [xt1, yt1] = calculatePosition(x1, y1);
            const [xt2, yt2] = calculatePosition(x2, y2);
            const [xt3, yt3] = calculatePosition(x3, y3);

            const [u0, v0] = calculateUV(x0, y0);
            const [u1, v1] = calculateUV(x1, y1);
            const [u2, v2] = calculateUV(x2, y2);
            const [u3, v3] = calculateUV(x3, y3);

            // Primeiro triângulo (x0, y0) -> (x1, y1) -> (x2, y2)
            vertices.push(
                xt0, yt0, u0, v0,
                xt1, yt1, u1, v1,
                xt2, yt2, u2, v2,
            );

            // Segundo triângulo (x1, y1) -> (x3, y3) -> (x2, y2)
            vertices.push(
                xt1, yt1, u1, v1,
                xt3, yt3, u3, v3,
                xt2, yt2, u2, v2,
            );
        }
    }

    return new Float32Array(vertices);
};
