const form = document.querySelector('#product-form');
const list = document.querySelector('#product-list');
const count = document.querySelector('#product-count');
const message = document.querySelector('#form-message');

function renderProducts(products) {
    count.textContent = products.length;
    list.innerHTML = '';

    if (!products.length) {
        list.innerHTML = '<p class="empty-state">Aún no hay prendas publicadas.</p>';
        return;
    }

    products.forEach((product) => {
        const item = document.createElement('article');
        item.className = 'product-item';
        item.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div>
                <h3>${product.name}</h3>
                <p>${product.category}</p>
                <strong>$${Number(product.price).toFixed(2)}</strong>
            </div>
            <button class="delete-button" type="button" data-id="${product.id}">Eliminar</button>
        `;
        list.appendChild(item);
    });
}

async function loadProducts() {
    const response = await fetch('/api/productos', { credentials: 'same-origin' });
    if (response.status === 401) return window.location.replace('login-admin.html');
    if (!response.ok) throw new Error('No se pudo cargar el inventario.');
    renderProducts(await response.json());
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = document.querySelector('#product-image').files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    data.append('name', document.querySelector('#product-name').value.trim());
    data.append('category', document.querySelector('#product-category').value.trim());
    data.append('price', document.querySelector('#product-price').value);
    data.append('description', document.querySelector('#product-description').value.trim());

    try {
        const response = await fetch('/api/productos', { credentials: 'same-origin', method: 'POST', body: data });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo publicar');
        form.reset();
        message.textContent = 'Prenda publicada correctamente.';
        await loadProducts();
    } catch (error) {
        message.textContent = error.message || 'No se pudo publicar la prenda.';
    }
});

list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-id]');
    if (!button) return;
    try {
        const response = await fetch(`/api/productos/${button.dataset.id}`, { credentials: 'same-origin', method: 'DELETE' });
        if (!response.ok) throw new Error('No se pudo eliminar la prenda.');
        await loadProducts();
    } catch (error) {
        message.textContent = error.message;
    }
});

loadProducts().catch((error) => {
    message.textContent = error.message;
});