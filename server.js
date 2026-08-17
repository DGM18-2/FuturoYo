const BASE_URL = 'https://futuroyo-krbb.onrender.com';
let usuarioSesion = null;

let gastos = [];
let grafico;
let ingresoMensual = 0;
let metaAhorro = 0;
let dineroDisponible = 0;

document.addEventListener('DOMContentLoaded', async () => {
    usuarioSesion = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuarioSesion || !usuarioSesion.id) {
        alert("Debes iniciar sesión primero.");
        window.location.href = "login.html";
        return;
    }

    await cargarDatosDesdeServidor();
});

// --- CONEXIÓN CON MONGODB ---

async function cargarDatosDesdeServidor() {
    try {
        const res = await fetch(`${BASE_URL}/api/datos/${usuarioSesion.id}`);
        const responseData = await res.json();

        if (responseData.exito && responseData.datos) {
            ingresoMensual = responseData.datos.ingresoMensual || 0;
            metaAhorro = responseData.datos.metaAhorro || 0;
            gastos = responseData.datos.gastos || [];

            let totalGastado = gastos.reduce((acc, g) => acc + g.monto, 0);
            dineroDisponible = ingresoMensual - metaAhorro - totalGastado;
            if (dineroDisponible < 0) dineroDisponible = 0;

            if (document.getElementById("mostrarIngreso")) document.getElementById("mostrarIngreso").innerText = ingresoMensual;
            if (document.getElementById("metaInicial")) document.getElementById("metaInicial").innerText = metaAhorro;
            if (document.getElementById("mostrarMeta")) document.getElementById("mostrarMeta").innerText = dineroDisponible;

            mostrarGastos();
            actualizarTotal();
            crearGrafico();
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

async function guardarPlan() {
    ingresoMensual = Number(document.getElementById("ingreso").value);
    metaAhorro = Number(document.getElementById("meta").value);

    if (ingresoMensual <= 0 || metaAhorro < 0) {
        alert("Ingrese valores válidos.");
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
            await cargarDatosDesdeServidor();
            document.getElementById("ingreso").value = "";
            document.getElementById("meta").value = "";
            alert("Plan financiero guardado.");
        }
    } catch (error) {
        alert("Error al guardar el plan.");
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
        alert("Error al guardar el gasto.");
    }
}

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
            <button class="eliminar" onclick="eliminarGasto(${index})">X</button>
        </li>`;
    });
}

function eliminarGasto(index) {
    gastos.splice(index, 1);
    mostrarGastos();
    actualizarTotal();
    crearGrafico();
}

function actualizarTotal() {
    let total = gastos.reduce((acc, g) => acc + g.monto, 0);
    if (document.getElementById("total")) {
        document.getElementById("total").innerText = total;
    }
}

function limpiarCampos() {
    document.getElementById("nombre").value = "";
    document.getElementById("monto").value = "";
}

function revisarLimite() {
    let total = gastos.reduce((acc, g) => acc + g.monto, 0);
    if (total > 50000) {
        alert("¡Has superado el límite de ₡50 000 en gastos!");
    }
}

// --- GRÁFICA DE CHART.JS ---

function crearGrafico() {
    let canvas = document.getElementById("miGrafico");
    if (!canvas) return;

    let comida = 0, transporte = 0, entretenimiento = 0, compras = 0;

    gastos.forEach(function (gasto) {
        if (gasto.categoria == "Comida") comida += gasto.monto;
        if (gasto.categoria == "Transporte") transporte += gasto.monto;
        if (gasto.categoria == "Entretenimiento") entretenimiento += gasto.monto;
        if (gasto.categoria == "Compras") compras += gasto.monto;
    });

    if (grafico) grafico.destroy();

    const ctx = canvas.getContext("2d");
    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Comida", "Transporte", "Entretenimiento", "Compras"],
            datasets: [{
                label: "Gastos por categoría",
                data: [comida, transporte, entretenimiento, compras],
                backgroundColor: [
                    "rgba(255,99,132,0.5)",
                    "rgba(54,162,235,0.5)",
                    "rgba(255,206,86,0.5)",
                    "rgba(75,192,192,0.5)"
                ]
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// --- CHATBOT INTELIGENTE ---

function abrirChat() {
    document.getElementById("ventanaChat").style.display = "block";
}

function cerrarChat() {
    document.getElementById("ventanaChat").style.display = "none";
}

function enviarPregunta() {
    let preguntaInput = document.getElementById("pregunta");
    let texto = preguntaInput.value.trim().toLowerCase();

    if (texto === "") return;

    let mensajes = document.getElementById("mensajes");
    mensajes.innerHTML += `<div class="usuario">${preguntaInput.value}</div>`;
    preguntaInput.value = "";

    let totalGastado = gastos.reduce((acc, g) => acc + g.monto, 0);
    let respuestaBot = "";

    if (texto.includes("ahorro") || texto.includes("ahorrar")) {
        respuestaBot = `Tu meta de ahorro actual es de ₡${metaAhorro}. Te sugiero apartar este dinero al inicio del mes.`;
    } else if (texto.includes("gasto") || texto.includes("gastos")) {
        respuestaBot = `Llevas un total de ₡${totalGastado} en gastos acumulados.`;
    } else if (texto.includes("presupuesto") || texto.includes("disponible") || texto.includes("saldo")) {
        respuestaBot = `Tu ingreso es de ₡${ingresoMensual} y cuentas con ₡${dineroDisponible} disponibles tras restar ahorros y gastos.`;
    } else if (texto.includes("hola") || texto.includes("buenas")) {
        respuestaBot = "¡Hola! Estoy listo para ayudarte con tus finanzas.";
    } else {
        respuestaBot = "Puedes consultarme sobre tu 'ahorro', tus 'gastos' o tu 'presupuesto disponible'.";
    }

    setTimeout(() => {
        mensajes.innerHTML += `<div class="bot">${respuestaBot}</div>`;
        mensajes.scrollTop = mensajes.scrollHeight;
    }, 300);

    mensajes.scrollTop = mensajes.scrollHeight;
}