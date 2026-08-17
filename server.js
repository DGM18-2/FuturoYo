const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// --- 1. MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// --- 2. CONEXIÓN A MONGO DB ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://danialbertogm18_db_user:JZbhKTbGD5yFYwKC@cluster0.ycq5pnn.mongodb.net/futuroyo?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB Atlas'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err.message));

// --- 3. ESQUEMAS Y MODELOS ---
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  password: String
});

const DatosFinancierosSchema = new mongoose.Schema({
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

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
const DatosFinancieros = mongoose.models.DatosFinancieros || mongoose.model('DatosFinancieros', DatosFinancierosSchema);

// --- 4. RUTAS DE AUTENTICACIÓN ---
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const nuevoUsuario = new Usuario({ nombre, email, password });
    await nuevoUsuario.save();
    res.status(201).json({ exito: true, mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error en el servidor al registrar' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email, password });

    if (usuario) {
      res.json({ exito: true, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
    } else {
      res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error al iniciar sesión' });
  }
});

// --- 5. RUTAS DE DATOS FINANCIEROS (POR USUARIO) ---
app.get('/api/datos/:usuarioId', async (req, res) => {
  try {
    let datos = await DatosFinancieros.findOne({ usuarioId: req.params.usuarioId });
    if (!datos) {
      datos = await DatosFinancieros.create({ usuarioId: req.params.usuarioId, ingresoMensual: 0, metaAhorro: 0, gastos: [] });
    }
    res.json({ exito: true, datos });
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error al obtener datos' });
  }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { usuarioId, ingresoMensual, metaAhorro } = req.body;
    const datos = await DatosFinancieros.findOneAndUpdate(
      { usuarioId },
      { ingresoMensual: parseFloat(ingresoMensual), metaAhorro: parseFloat(metaAhorro) },
      { new: true, upsert: true }
    );
    res.json({ exito: true, datos });
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error al guardar plan' });
  }
});

app.post('/api/gastos', async (req, res) => {
  try {
    const { usuarioId, nombre, monto, categoria } = req.body;
    const datos = await DatosFinancieros.findOneAndUpdate(
      { usuarioId },
      { $push: { gastos: { nombre, monto: parseFloat(monto), categoria } } },
      { new: true, upsert: true }
    );
    res.json({ exito: true, datos });
  } catch (error) {
    res.status(500).json({ exito: false, error: 'Error al guardar gasto' });
  }
});

// --- 6. RUTA DEL CHATBOT INTELIGENTE CON GEMINI AI ---
app.post('/api/chat', async (req, res) => {
  try {
    const { pregunta, contextoFinanciero } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ respuesta: "Error: La variable GEMINI_API_KEY no está configurada en Render." });
    }

    const promptSystem = `Eres el asistente financiero inteligente de "FuturoYo".
Responde a las dudas del usuario de forma amable, práctica y concisa (2-3 oraciones máximo).
Contexto financiero actual del usuario:
- Ingreso Mensual: ₡${contextoFinanciero?.ingresoMensual || 0}
- Meta de Ahorro: ₡${contextoFinanciero?.metaAhorro || 0}
- Dinero Disponible: ₡${contextoFinanciero?.dineroDisponible || 0}
- Total Gastado: ₡${contextoFinanciero?.totalGastado || 0}

Pregunta del usuario: "${pregunta}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptSystem }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ respuesta: `Error de Google API: ${data.error.message}` });
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";
    res.json({ respuesta: botReply });
  } catch (error) {
    console.error("Error en servidor al procesar el chat:", error);
    res.status(500).json({ respuesta: "Error interno del servidor al procesar la solicitud." });
  }
});

app.get('/{0,}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));