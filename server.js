const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- 1. MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta 'public' para los archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONEXION A MONGO DB ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/futuroyo';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB Atlas'))
  .catch((err) => {
    console.error('Error al conectar a MongoDB:', err.message);
  });

// --- 3. ESQUEMA Y MODELO ---
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String
});

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

// --- 4. RUTAS DE LA API ---

// Ruta de prueba
app.get('/api/ping', (req, res) => {
  res.json({ mensaje: 'API de FuturoYo funcionando correctamente' });
});

// Ruta de Registro
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    const nuevoUsuario = new Usuario({ nombre, email, password });
    await nuevoUsuario.save();

    res.status(201).json({ exito: true, mensaje: 'Usuario registrado con exito' });
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error en el servidor al registrar' });
  }
});

// Ruta de Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email, password });

    if (usuario) {
      res.json({ exito: true, mensaje: 'Inicio de sesion correcto', usuario });
    } else {
      res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error en el servidor al iniciar sesion' });
  }
});

// Ruta fallback compatible con Express 5
app.get('/{0,}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. PUERTO PARA RENDER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en el puerto ${PORT}`);
});