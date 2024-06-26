import { defineConfig } from 'vite';

export default defineConfig({
  // Indica ao Vite onde procurar os arquivos de entrada.
  root: './',
  base: '/webgpu_demos/',
  // Se necessário, você pode especificar manualmente os pontos de entrada.
  // Por padrão, o Vite usará 'index.html' e 'main.js' como pontos de entrada.
  // Para projetos multipágina, você pode adicionar outros arquivos HTML aqui.
  build: {
    target: 'chrome90',
    rollupOptions: {
      input: {
        main: './index.html',
        triangle: './src/1-triangle.html',
        marching_squares: './src/2-marching-squares.html',
        cube: './src/3-cube.html',
        wave: './src/4-wave.html',
        marching_cubes: './src/5-marching-cubes.html',
        sprites: './src/6-sprites.html',
        light:'./src/7-light.html'
      },
    },
  },
  plugins: [
    {
      name: 'vite-plugin-wgsl',
      transform(src, id) {
        if (id.endsWith('.wgsl')) {
          return {
            code: `export default ${JSON.stringify(src)};`,
            map: null
          };
        }
      }
    }
  ]
});
