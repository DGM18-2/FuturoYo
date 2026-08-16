const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- 1. MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta 'public' para los archivos estáticos (HTML, CSS, JS del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONEXIÓN A MONGO DB ---
// Lee la variable MONGO_URI de Render o usa la base local si no existe
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/futuroyo';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ Error crítico al conectar a MongoDB:', err.message);
    // Evita que la app se quede colgada sin respuesta ante errores de conexión
  });

// --- 3. DEFINICIÓN DE ESQUEMA Y MODELO DE EJEMPLO ---
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String
});

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

// --- 4. RUTAS DE LA API ---

// Ruta de prueba para verificar que la API está online
app.get('/api/ping', (req, res) => {
  res.json({ mensaje: 'API de FuturoYo funcionando correctamente' });
});

// Ruta de Registro
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // Guardar usuario en la base de datos
    const nuevoUsuario = new Usuario({ nombre, email, password });
    await nuevoUsuario.save();

    res.status(201).json({ exito: true, mensaje: 'Usuario registrado con éxito' });
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
      res.json({ exito: true, mensaje: 'Inicio de sesión correcto', usuario });
    } else {
      res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error en el servidor al iniciar sesión' });
  }
});

// Ruta fallback: Sirve el index.html para cualquier otra ruta no reconocida
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. CONFIGURACIÓN DEL PUERTO PARA RENDER ---
// Render asigna dinámicamente process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});