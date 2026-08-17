document.addEventListener("DOMContentLoaded", () => {
    const formRegistro = document.getElementById("formRegistro");

    if (formRegistro) {
        formRegistro.addEventListener("submit", (e) => {
            e.preventDefault();
            crearCuenta();
        });
    }
});

async function crearCuenta() {
    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;
    const confirmar = document.getElementById("confirmar") ? document.getElementById("confirmar").value : contrasena;
    const mensaje = document.getElementById("mensaje");

    if (nombre === "" || correo === "" || contrasena === "") {
        mensaje.innerText = "Complete todos los campos.";
        mensaje.style.color = "red";
        return;
    }

    if (contrasena !== confirmar) {
        mensaje.innerText = "Las contraseñas no coinciden.";
        mensaje.style.color = "red";
        return;
    }

    try {
        const respuesta = await fetch("https://futuroyo.onrender.com/registro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: nombre,
                correo: correo,
                contrasena: contrasena
            })
        });

        const datos = await respuesta.json();

        if (respuesta.ok || datos.ok) {
            mensaje.innerText = datos.mensaje || "Cuenta creada con éxito.";
            mensaje.style.color = "green";

            setTimeout(function() {
                window.location.href = "login.html";
            }, 1500);
        } else {
            mensaje.innerText = datos.mensaje || "Error al registrar la cuenta.";
            mensaje.style.color = "red";
        }

    } catch (error) {
        console.error(error);
        mensaje.innerText = "No se pudo conectar con el servidor.";
        mensaje.style.color = "red";
    }
}