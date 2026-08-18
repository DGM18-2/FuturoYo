document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombreInput = document.querySelector('input[type="text"]');
    const emailInput = document.querySelector('input[type="email"]');
    // Seleccionar todos los campos de contraseña para validar confirmación
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const correo = emailInput ? emailInput.value.trim() : '';
    const password = passwordInputs[0] ? passwordInputs[0].value.trim() : '';
    const confirmPassword = passwordInputs[1] ? passwordInputs[1].value.trim() : '';

    if (!nombre || !correo || !password) {
      alert('Por favor completa todos los campos.');
      return;
    }

    if (passwordInputs.length > 1 && password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Cambiado "email" por "correo" para hacer match exacto con el servidor Express
        body: JSON.stringify({ nombre, correo, password })
      });

      const data = await response.json();

      if (response.ok && data.exito) {
        alert('¡Usuario registrado con éxito!');
        window.location.href = 'login.html';
      } else {
        alert(data.mensaje || data.error || 'Error al registrar el usuario');
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      alert('Ocurrió un error al conectar con el servidor.');
    }
  });
});