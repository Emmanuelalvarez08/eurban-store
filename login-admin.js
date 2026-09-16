const form = document.querySelector('#login-form');
const password = document.querySelector('#admin-password');
const error = document.querySelector('#login-error');
const submitButton = form.querySelector('button');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    error.textContent = '';

    try {
        const response = await fetch('/api/admin/login', {
            body: JSON.stringify({ password: password.value }),
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST'
        });
        if (!response.ok) throw new Error('Contraseña incorrecta.');
        window.location.replace('admin.html');
    } catch (loginError) {
        error.textContent = loginError.message || 'No se pudo iniciar sesión.';
        password.select();
        submitButton.disabled = false;
    }
});
