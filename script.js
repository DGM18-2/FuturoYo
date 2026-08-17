const BASE_URL = 'https://futuroyo-krbb.onrender.com';
let usuarioSesion = null;

let gastos = [];
let grafico;
let ingresoMensual = 0;
let metaAhorro = 0;
let dineroDisponible = 0;

// Verificar sesion e inicializar datos al cargar la pagina
document.addEventListener('DOMContentLoaded', async () => {
    usuarioSesion = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuarioSesion || !usuarioSesion.id) {
        alert("Debes iniciar sesion primero.");
        window.location.href = "login.html";
        return;
    }

    await cargarDatosDesdeServidor();
});

// --- FUNCION DE CERRAR SESION ---

function cerrarSesion() {
    localStorage.removeItem('usuario');
    window.location.href = "login.html";
}

// --- CONEXION CON MONGODB ATLAS ---

async function cargarDatosDesdeServidor() {
    try {
        const res = await fetch(`${BASE_URL}/api/datos/${usuarioSesion.id}`);
        const responseData = await res.json();

        if (responseData.exito && responseData.datos) {
            ingresoMensual = responseData.datos.ingresoMensual || 0;
            metaAhorro = responseData.datos.metaAhorro || 0;
            gastos = responseData.datos.gastos || [];

            // Recalcular dinero disponible
            let totalGastado = gastos.reduce((acc, g) => acc + g.monto, 0);
            dineroDisponible = ingresoMensual - metaAhorro - totalGastado;
            if (dineroDisponible < 0) dineroDisponible = 0;

            // Renderizar datos en la interfaz
            if (document.getElementById("mostrarIngreso")) document.getElementById("mostrarIngreso").innerText = ingresoMensual;
            if (document.getElementById("metaInicial")) document.getElementById("metaInicial").innerText = metaAhorro;
            if (document.getElementById("mostrarMeta")) document.getElementById("mostrarMeta").innerText = dineroDisponible;

            mostrarGastos();
            actualizarTotal();
            crearGrafico();
        }
    } catch (error) {
        console.error("Error al cargar datos desde el servidor:", error);
    }
}

async function guardarPlan() {
    ingresoMensual = Number(document.getElementById("ingreso").value);
    metaAhorro = Number(document.getElementById("meta").value);

    if (ingresoMensual <= 0 || metaAhorro < 0) {
        alert("Ingrese valores validos.");
        return;
    }

    if (metaAhorro > ingresoMensual) {
        alert("La meta de ahorro no puede ser mayor que el ingreso mensual.");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuarioSesion.id,
                ingresoMensual: ingresoMensual,
                metaAhorro: metaAhorro
            })
        });

        if (res.ok) {
            let totalGastado = gastos.reduce((acc, g) => acc + g.monto, 0);
            dineroDisponible = ingresoMensual - metaAhorro - totalGastado;
            if (dineroDisponible < 0) dineroDisponible = 0;

            document.getElementById("mostrarIngreso").innerText = ingresoMensual;
            document.getElementById("metaInicial").innerText = metaAhorro;
            document.getElementById("mostrarMeta").innerText = dineroDisponible;

            document.getElementById("ingreso").value = "";
            document.getElementById("meta").value = "";

            alert("Plan financiero guardado en tu cuenta.");
        }
    } catch (error) {
        alert("Error al guardar el plan en el servidor.");
    }
}

async function agregarGasto() {
    let nombre = document.getElementById("nombre").value;
    let monto = Number(document.getElementById("monto").value);
    let categoria = document.getElementById("categoria").value;

    if (nombre == "" || monto <= 0) {
        alert("Complete todos los campos.");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/gastos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuarioSesion.id,
                nombre: nombre,
                monto: monto,
                categoria: categoria
            })
        });

        if (res.ok) {
            await cargarDatosDesdeServidor();
            revisarLimite();
            limpiarCampos();
        }
    } catch (error) {
        alert("Error al guardar el gasto en la base de datos.");
    }
}

// --- INTERFAZ Y RENDERIZADO DE GASTOS ---

function mostrarGastos() {
    let lista = document.getElementById("lista");
    if (!lista) return;

    lista.innerHTML = "";

    gastos.forEach(function (gasto, index) {
        lista.innerHTML += `
        <li>
            <div>
                <strong>${gasto.nombre}</strong><br>
                ${gasto.categoria} - ₡${gasto.monto}
            </div>

            <button class="eliminar" onclick="eliminarGasto(${index})">
                X
            </button>
        </li>
        `;
    });
}

function eliminarGasto(index) {
    dineroDisponible += gastos[index].monto;

    if (dineroDisponible > ingresoMensual - metaAhorro) {
        dineroDisponible = ingresoMensual - metaAhorro;
    }

    if (document.getElementById("mostrarMeta")) {
        document.getElementById("mostrarMeta").innerText = dineroDisponible;
    }

    gastos.splice(index, 1);

    mostrarGastos();
    actualizarTotal();
    crearGrafico();
}

function actualizarTotal() {
    let total = 0;
    gastos.forEach(function (gasto) {
        total += gasto.monto;
    });

    if (document.getElementById("total")) {
        document.getElementById("total").innerText = total;
    }
}

function limpiarCampos() {
    document.getElementById("nombre").value = "";
    document.getElementById("monto").value = "";
}

function revisarLimite() {
    let total = 0;
    gastos.forEach(function (gasto) {
        total += gasto.monto;
    });

    if (total > 50000) {
        alert("Has superado el limite de ₡50 000 en gastos.");
    }
}

// --- GRAFICO DE CHART.JS ---

function crearGrafico() {
    let canvas = document.getElementById("miGrafico");
    if (!canvas) return;

    let comida = 0;
    let transporte = 0;
    let entretenimiento = 0;
    let compras = 0;

    gastos.forEach(function (gasto) {
        if (gasto.categoria == "Comida") comida += gasto.monto;
        if (gasto.categoria == "Transporte") transporte += gasto.monto;
        if (gasto.categoria == "Entretenimiento") entretenimiento += gasto.monto;
        if (gasto.categoria == "Compras") compras += gasto.monto;
    });

    let datos = [comida, transporte, entretenimiento, compras];

    if (grafico) {
        grafico.destroy();
    }

    const ctx = canvas.getContext("2d");

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Comida", "Transporte", "Entretenimiento", "Compras"],
            datasets: [{
                label: "Gastos por categoria",
                data: datos,
                backgroundColor: [
                    "rgba(255,99,132,0.5)",
                    "rgba(54,162,235,0.5)",
                    "rgba(255,206,86,0.5)",
                    "rgba(75,192,192,0.5)"
                ],
                borderColor: [
                    "rgb(255,99,132)",
                    "rgb(54,162,235)",
                    "rgb(255,206,86)",
                    "rgb(75,192,192)"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// --- CHATBOT ASISTENTE VIRTUAL ---

function abrirChat() {
    document.getElementById("ventanaChat").style.display = "block";
}

function cerrarChat() {
    document.getElementById("ventanaChat").style.display = "none";
}

async function enviarPregunta() {
    let preguntaInput = document.getElementById("pregunta");
    let pregunta = preguntaInput.value.trim();

    if (pregunta === "") return;

    let mensajes = document.getElementById("mensajes");

    // 1. Mostrar mensaje del usuario
    mensajes.innerHTML += `<div class="usuario">${pregunta}</div>`;

    // 2. Indicador de carga
    let tempId = "msg-" + Date.now();
    mensajes.innerHTML += `<div class="bot" id="${tempId}"><em>Pensando...</em></div>`;
    mensajes.scrollTop = mensajes.scrollHeight;
    preguntaInput.value = "";

    // -------------------------------------------------------------
    // PEGA AQUI TU API KEY (Debe empezar con "AIzaSy...")
    const API_KEY = "PEGA_AQUI_TU_API_KEY"; 
    // -------------------------------------------------------------

    let totalGastado = gastos.reduce((acc, g) => acc + g.monto, 0);

    // RESPUESTA DE RESPALDO (Si no hay clave o es tipo 'AQ.')
    if (!API_KEY || API_KEY.startsWith("AQ.") || API_KEY === "PEGA_AQUI_TU_API_KEY") {
        let texto = pregunta.toLowerCase();
        let respuestaLocal = "";

        if (texto.includes("ahorro") || texto.includes("ahorrar")) {
            respuestaLocal = `Tu meta de ahorro actual es de ₡${metaAhorro}. Te recomiendo separar esta cantidad apenas recibas tu ingreso.`;
        } else if (texto.includes("gasto") || texto.includes("gastos")) {
            respuestaLocal = `Has registrado un total de ₡${totalGastado} en gastos. Revisa la grafica para mas detalles.`;
        } else if (texto.includes("presupuesto") || texto.includes("disponible") || texto.includes("saldo")) {
            respuestaLocal = `Tu ingreso es de ₡${ingresoMensual} y cuentas con ₡${dineroDisponible} disponibles tras restar ahorros y gastos.`;
        } else {
            respuestaLocal = "Hola, cuentas con mi ayuda. Puedes preguntarme sobre tu 'ahorro', tus 'gastos' o tu 'presupuesto disponible'.";
        }

        setTimeout(() => {
            document.getElementById(tempId).innerText = respuestaLocal;
            mensajes.scrollTop = mensajes.scrollHeight;
        }, 400);
        return;
    }

    // SI LA CLAVE ES VALIDA (AIzaSy...), LLAMA A GEMINI AI
    const promptText = `Eres el asistente financiero inteligente de FuturoYo.
Responde de forma amable, practica y breve (maximo 3 oraciones).
Contexto del usuario: Ingreso: ₡${ingresoMensual}, Meta Ahorro: ₡${metaAhorro}, Disponible: ₡${dineroDisponible}, Gastado: ₡${totalGastado}.
Pregunta: "${pregunta}"`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById(tempId).innerText = "Error API: " + data.error.message;
        } else {
            const respuestaBot = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";
            document.getElementById(tempId).innerText = respuestaBot;
        }
    } catch (error) {
        document.getElementById(tempId).innerText = "Error al conectar con el servidor.";
    }

    mensajes.scrollTop = mensajes.scrollHeight;
}