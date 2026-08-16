async function crearCuenta(){

    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    const respuesta = await fetch("https://futuroyo.onrender.com/registro")

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            nombre,
            correo,
            contrasena

        })

    };

    const datos = await respuesta.json();

    alert(datos.mensaje);
    document.getElementById("nombre")
    document.getElementById("correo")
    document.getElementById("contrasena")
    document.getElementById("confirmar")
    document.getElementById("mensaje")
}