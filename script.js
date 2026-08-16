let gastos = [];

let grafico;

let ingresoMensual = 0;

let metaAhorro = 0;

let dineroDisponible = 0;

function agregarGasto() {

    let nombre = document.getElementById("nombre").value;
    let monto = Number(document.getElementById("monto").value);
    let categoria = document.getElementById("categoria").value;

    if (nombre == "" || monto <= 0) {
        alert("Complete todos los campos.");
        return;
    }

    let gasto = {
        nombre: nombre,
        monto: monto,
        categoria: categoria
    };

gastos.push(gasto);

// Descontar el gasto del dinero disponible

if(dineroDisponible > 0){

    dineroDisponible -= gasto.monto;

    if(dineroDisponible < 0){

        dineroDisponible = 0;

    }

    document.getElementById("mostrarMeta").innerText = dineroDisponible;

}

mostrarGastos();

actualizarTotal();

crearGrafico();
}

    // Restar el gasto a la meta de ahorro
    if (metaAhorro > 0) {

        ahorroRestante -= monto;

        if (ahorroRestante < 0) {
            ahorroRestante = 0;
        }

        document.getElementById("mostrarMeta").innerText = ahorroRestante;
    }

    mostrarGastos();
    actualizarTotal();
    crearGrafico();
    revisarLimite();
    limpiarCampos();


function mostrarGastos() {

    let lista = document.getElementById("lista");

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
function eliminarGasto(index){

    dineroDisponible += gastos[index].monto;

    if(dineroDisponible > ingresoMensual - metaAhorro){

        dineroDisponible = ingresoMensual - metaAhorro;

    }

    document.getElementById("mostrarMeta").innerText = dineroDisponible;

    gastos.splice(index,1);

    mostrarGastos();

    actualizarTotal();

    crearGrafico();

}

function actualizarTotal() {

    let total = 0;

    gastos.forEach(function (gasto) {
        total += gasto.monto;
    });

    document.getElementById("total").innerText = total;
}

function limpiarCampos() {

    document.getElementById("nombre").value = "";
    document.getElementById("monto").value = "";
}

function crearGrafico() {

    let comida = 0;
    let transporte = 0;
    let entretenimiento = 0;
    let compras = 0;

    gastos.forEach(function (gasto) {

        if (gasto.categoria == "Comida") {
            comida += gasto.monto;
        }

        if (gasto.categoria == "Transporte") {
            transporte += gasto.monto;
        }

        if (gasto.categoria == "Entretenimiento") {
            entretenimiento += gasto.monto;
        }

        if (gasto.categoria == "Compras") {
            compras += gasto.monto;
        }

    });

    let datos = [
        comida,
        transporte,
        entretenimiento,
        compras
    ];

    if (grafico) {
        grafico.destroy();
    }

    const ctx = document.getElementById("miGrafico").getContext("2d");

    grafico = new Chart(ctx, {

        type: "bar",

        data: {

            labels: [
                "Comida",
                "Transporte",
                "Entretenimiento",
                "Compras"
            ],

            datasets: [{

                label: "Gastos por categoría",

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

function guardarPlan(){

    ingresoMensual = Number(document.getElementById("ingreso").value);

    metaAhorro = Number(document.getElementById("meta").value);

    if(ingresoMensual <= 0 || metaAhorro < 0){

        alert("Ingrese valores válidos.");

        return;

    }

    if(metaAhorro > ingresoMensual){

        alert("La meta de ahorro no puede ser mayor que el ingreso mensual.");

        return;

    }

    dineroDisponible = ingresoMensual - metaAhorro;

    document.getElementById("mostrarIngreso").innerText = ingresoMensual;

    document.getElementById("metaInicial").innerText = metaAhorro;

    document.getElementById("mostrarMeta").innerText = dineroDisponible;

    document.getElementById("ingreso").value = "";

    document.getElementById("meta").value = "";

    alert("Plan financiero guardado.");

}

function revisarLimite() {

    let total = 0;

    gastos.forEach(function (gasto) {
        total += gasto.monto;
    });

    if (total > 50000) {
        alert("¡Has superado el límite de ₡50 000 en gastos!");
    }
}
function abrirChat(){

    document.getElementById("ventanaChat").style.display="block";

}

function cerrarChat(){

    document.getElementById("ventanaChat").style.display="none";

}

function enviarPregunta(){

    let pregunta=document.getElementById("pregunta").value.toLowerCase();

    if(pregunta=="") return;

    let mensajes=document.getElementById("mensajes");

    mensajes.innerHTML+=`

        <div class="usuario">

            ${pregunta}

        </div>

    `;

    let respuesta="No entendí tu pregunta.";

    if(pregunta.includes("ahorro")){

        respuesta="Una buena meta es ahorrar entre el 10% y el 20% de tus ingresos mensuales.";

    }

    else if(pregunta.includes("gasto")){

        respuesta="Registra todos tus gastos para saber en qué utilizas tu dinero.";

    }

    else if(pregunta.includes("presupuesto")){

        respuesta="Primero separa el dinero para ahorrar y luego administra el resto para tus gastos.";

    }

    else if(pregunta.includes("hola")){

        respuesta="¡Hola! ¿En qué puedo ayudarte?";

    }

    else if(pregunta.includes("consejo")){

        respuesta="Evita las compras impulsivas y fija metas de ahorro cada mes.";

    }

    else if(pregunta.includes("meta")){

        respuesta="Una meta de ahorro debe ser realista y acorde a tus ingresos.";

    }

    else if(pregunta.includes("dinero")){

        respuesta="Controlar tus ingresos y gastos es el primer paso para mejorar tus finanzas.";

    }

    else if(pregunta.includes("gracias")){

        respuesta="¡Con gusto! Estoy para ayudarte.";

    }

    mensajes.innerHTML+=`

        <div class="bot">

            ${respuesta}

        </div>

    `;

    mensajes.scrollTop=mensajes.scrollHeight;

    document.getElementById("pregunta").value="";

}