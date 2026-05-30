import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolusi path untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware kompresi bawaan untuk optimasi transfer file model 3D
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Caching untuk performa VPS/Railway
    setHeaders: (res, path) => {
        if (path.endsWith('.glb') || path.endsWith('.gltf')) {
            res.setHeader('Content-Type', 'model/gltf-binary');
        }
    }
}));

// Route fallback ke index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[ SERVER READY ] Berjalan di http://localhost:${PORT}`);
});