import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            {
                find: /^react-aria\/(.*)$/,
                replacement: path.resolve(__dirname, './node_modules/react-aria/dist/exports/$1.js'),
            },
            {
                find: '@',
                replacement: path.resolve(__dirname, './src'),
            },
        ],
    },
    server: {
        port: 5173,
        host: true,
    },
});
