const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del sitio (HTML, CSS, JS)
app.use(express.static(__dirname));

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'TU_ENLACE_DE_MONGODB_ATLAS';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado exitosamente a MongoDB'))
    .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Ruta principal para cargar tu frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});