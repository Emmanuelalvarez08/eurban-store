document.querySelector('#logout-button').addEventListener('click', async () => {
    if (window.eurbanSupabase) await window.eurbanSupabase.auth.signOut();
    window.location.replace('login-admin.html');
});
