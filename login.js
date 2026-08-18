document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');

    const correo = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!correo || !password) {
      alert('Por favor ingresa tu correo y contraseña.');
      return;
    }

    const API_URL = window.location.protocol === 'file:' 
      ? 'https://futuroyo-krbb.onrender.com' 
      : '';

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Cambiado "email" a "correo" para coincidir con Express
        body: JSON.stringify({ correo, password })
      });

      const data = await response.json();

      if (response.ok && data.exito) {
        alert('¡Inicio de sesión exitoso!');
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = 'index.html';
      } else {
        alert(data.mensaje || data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error en el login:', error);
      alert('Ocurrió un error al conectar con el servidor.');
    }
  });
});