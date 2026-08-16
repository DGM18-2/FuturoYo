async function iniciarSesion() {

    // Obtener los datos del formulario
    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    const mensaje = document.getElementById("mensaje");

    // Comprobar que los campos estén llenos
    if (correo === "" || contrasena === "") {

        mensaje.innerText = "Complete todos los campos.";
        mensaje.style.color = "red";

        return;
    }

    try {

        // Enviar los datos al servidor
        const respuesta = await fetch("https://futuroyo.onrender.com/registro")

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                correo: correo,
                contrasena: contrasena

            })

        });

        // Recibir respuesta del servidor
        const datos = await respuesta.json();

        // Comprobar resultado
        if (datos.ok) {

            mensaje.innerText = "Inicio de sesión correcto.";
            mensaje.style.color = "green";

            // Guardar los datos del usuario
            localStorage.setItem(
                "usuario",
                JSON.stringify(datos.usuario)
            );

            // Esperar un momento y entrar a FuturoYO
            setTimeout(function() {

                window.location.href = "index.html";

            }, 1000);

        } else {

            mensaje.innerText = datos.mensaje;
            mensaje.style.color = "red";

        }

    } catch (error) {

        console.error(error);

        mensaje.innerText =
            "No se pudo conectar con el servidor.";

        mensaje.style.color = "red";

    }

}