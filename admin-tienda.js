const form = document.querySelector('#product-form');
const list = document.querySelector('#product-list');
const count = document.querySelector('#product-count');
const message = document.querySelector('#form-message');
const supabaseClient = window.eurbanSupabase;

function showMessage(text) {
    message.textContent = text;
}

async function requireAdmin() {
    if (!supabaseClient) throw new Error('Configura Supabase antes de usar el panel.');
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) window.location.replace('login-admin.html');
}

async function loadProducts() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('id, nombre, categoria, precio, imagen_path')
        .order('creado_en', { ascending: false });
    if (error) throw error;

    count.textContent = data.length;
    list.innerHTML = '';
    if (!data.length) {
        list.innerHTML = '<p class="empty-state">Aún no hay prendas publicadas.</p>';
        return;
    }

    data.forEach((product) => {
        const item = document.createElement('article');
        const image = document.createElement('img');
        const details = document.createElement('div');
        const title = document.createElement('h3');
        const category = document.createElement('p');
        const price = document.createElement('strong');
        const button = document.createElement('button');

        item.className = 'product-item';
        image.alt = product.nombre;
        image.src = supabaseClient.storage.from('product-images').getPublicUrl(product.imagen_path).data.publicUrl;
        title.textContent = product.nombre;
        category.textContent = product.categoria;
        price.textContent = `$${Number(product.precio).toFixed(2)}`;
        button.className = 'delete-button';
        button.dataset.id = product.id;
        button.dataset.path = product.imagen_path;
        button.type = 'button';
        button.textContent = 'Eliminar';
        details.append(title, category, price);
        item.append(image, details, button);
        list.appendChild(item);
    });
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = document.querySelector('#product-image').files[0];
    if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
        showMessage('Selecciona una imagen JPG, PNG o WebP de máximo 8 MB.');
        return;
    }

    const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `${crypto.randomUUID()}.${extension}`;
    const product = {
        nombre: document.querySelector('#product-name').value.trim(),
        categoria: document.querySelector('#product-category').value.trim(),
        precio: Number(document.querySelector('#product-price').value),
        descripcion: document.querySelector('#product-description').value.trim(),
        imagen_path: path
    };

    try {
        const { error: uploadError } = await supabaseClient.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabaseClient.from('productos').insert(product);
        if (insertError) {
            await supabaseClient.storage.from('product-images').remove([path]);
            throw insertError;
        }
        form.reset();
        showMessage('Prenda publicada correctamente.');
        await loadProducts();
    } catch (error) {
        showMessage(error.message || 'No se pudo publicar la prenda.');
    }
});

list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-id]');
    if (!button) return;
    try {
        const { error: deleteError } = await supabaseClient.from('productos').delete().eq('id', button.dataset.id);
        if (deleteError) throw deleteError;
        const { error: imageError } = await supabaseClient.storage.from('product-images').remove([button.dataset.path]);
        if (imageError) console.error(imageError);
        await loadProducts();
    } catch (error) {
        showMessage(error.message || 'No se pudo eliminar la prenda.');
    }
});

requireAdmin().then(loadProducts).catch((error) => showMessage(error.message));