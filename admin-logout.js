document.querySelector('#logout-button').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { credentials: 'same-origin', method: 'POST' });
    window.location.replace('login-admin.html');
});
