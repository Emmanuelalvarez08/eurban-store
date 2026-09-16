const form = document.querySelector('#login-form');
const email = document.querySelector('#admin-email');
const password = document.querySelector('#admin-password');
const error = document.querySelector('#login-error');
const submitButton = form.querySelector('button');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    error.textContent = '';

    try {
        if (!window.eurbanSupabase) throw new Error('Configura Supabase antes de iniciar sesión.');
        const { error: loginError } = await window.eurbanSupabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        if (loginError) throw new Error('Correo o contraseña incorrectos.');
        window.location.replace('admin.html');
    } catch (loginError) {
        error.textContent = loginError.message || 'No se pudo iniciar sesión.';
        password.select();
        submitButton.disabled = false;
    }
});
