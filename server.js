const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del sitio (HTML, CSS, JS)
app.use(express.static(__dirname));

// --- CONEXIÓN A MONGODB ATLAS ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://danialbertogm18_db_user:hTMd0yg0BwyZaMNN@cluster0.ycq5pnn.mongodb.net/futuroyo?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado exitosamente a MongoDB Atlas'))
    .catch((err) => console.error('Error al conectar a MongoDB:', err));

// --- MODELOS DE MONGODB ---

// 1. Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// 2. Modelo de Datos Financieros
const datosFinancierosSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    ingresoMensual: { type: Number, default: 0 },
    metaAhorro: { type: Number, default: 0 },
    gastos: [
        {
            nombre: String,
            monto: Number,
            categoria: String,
            fecha: { type: Date, default: Date.now }
        }
    ]
});

const DatosFinancieros = mongoose.model('DatosFinancieros', datosFinancierosSchema);

// --- RUTAS DE LA API ---

// 1. Registro de usuarios
app.post('/api/registro', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({ exito: false, mensaje: 'Todos los campos son obligatorios.' });
        }

        const usuarioExistente = await Usuario.findOne({ correo });
        if (usuarioExistente) {
            return res.status(400).json({ exito: false, mensaje: 'El correo ya está registrado.' });
        }

        const nuevoUsuario = new Usuario({ nombre, correo, password });
        await nuevoUsuario.save();

        // Crear registro financiero inicial para el nuevo usuario
        await DatosFinancieros.create({ usuarioId: nuevoUsuario._id, ingresoMensual: 0, metaAhorro: 0, gastos: [] });

        res.json({ exito: true, mensaje: 'Usuario registrado con éxito', id: nuevoUsuario._id });
    } catch (error) {
        console.error("Error en /api/registro:", error);
        res.status(500).json({ exito: false, mensaje: 'Error interno en el servidor.' });
    }
});

// 2. Inicio de sesión (Login)
app.post('/api/login', async (req, res) => {
    try {
        const { correo, password } = req.body;

        const usuario = await Usuario.findOne({ correo, password });
        if (!usuario) {
            return res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas.' });
        }

        res.json({
            exito: true,
            mensaje: 'Inicio de sesión exitoso',
            usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo }
        });
    } catch (error) {
        console.error("Error en /api/login:", error);
        res.status(500).json({ exito: false, mensaje: 'Error al iniciar sesión.' });
    }
});

// 3. Obtener datos financieros del usuario
app.get('/api/datos/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        let datos = await DatosFinancieros.findOne({ usuarioId });

        if (!datos) {
            datos = await DatosFinancieros.create({ usuarioId, ingresoMensual: 0, metaAhorro: 0, gastos: [] });
        }

        res.json({ exito: true, datos });
    } catch (error) {
        console.error("Error en GET /api/datos:", error);
        res.status(500).json({ exito: false, mensaje: 'Error al obtener los datos.' });
    }
});

// 4. Guardar o actualizar Plan Financiero (Ingreso y Meta)
app.post('/api/plan', async (req, res) => {
    try {
        const { usuarioId, ingresoMensual, metaAhorro } = req.body;

        const datos = await DatosFinancieros.findOneAndUpdate(
            { usuarioId },
            { ingresoMensual, metaAhorro },
            { new: true, upsert: true }
        );

        res.json({ exito: true, mensaje: 'Plan guardado correctamente', datos });
    } catch (error) {
        console.error("Error en /api/plan:", error);
        res.status(500).json({ exito: false, mensaje: 'Error al guardar el plan.' });
    }
});

// 5. Agregar un gasto
app.post('/api/gastos', async (req, res) => {
    try {
        const { usuarioId, nombre, monto, categoria } = req.body;

        const nuevoGasto = { nombre, monto, categoria };
        const datos = await DatosFinancieros.findOneAndUpdate(
            { usuarioId },
            { $push: { gastos: nuevoGasto } },
            { new: true, upsert: true }
        );

        res.json({ exito: true, mensaje: 'Gasto agregado correctamente', datos });
    } catch (error) {
        console.error("Error en /api/gastos:", error);
        res.status(500).json({ exito: false, mensaje: 'Error al registrar el gasto.' });
    }
});

// Ruta por defecto para cargar el frontend en Express v5
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- PUERTO DINÁMICO DE RENDER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});