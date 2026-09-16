const productGrid = document.querySelector('#product-grid');
const itemCount = document.querySelector('#item-count');
const productsKey = 'eurbanProducts';
const supabaseClient = window.eurbanSupabase;
const defaultProducts = [
    { id: 'sample-jacket', name: 'Chaqueta Eurban', category: 'Abrigos', price: '89.00', imageClass: 'image-jacket' },
    { id: 'sample-shirt', name: 'Camisa Lino', category: 'Camisas', price: '74.00', imageClass: 'image-dress' },
    { id: 'sample-polo', name: 'Polo Studio', category: 'Esenciales', price: '52.00', imageClass: 'image-shirt' },
    { id: 'sample-pants', name: 'Pantalón Forma', category: 'Sastrería', price: '68.00', imageClass: 'image-pants' }
];

function updateItemCount() {
    itemCount.textContent = productGrid.querySelectorAll('.product-card').length;
}

function getLocalProducts() {
    try {
        const storedProducts = localStorage.getItem(productsKey);
        if (storedProducts === null) {
            localStorage.setItem(productsKey, JSON.stringify(defaultProducts));
            return defaultProducts;
        }
        return JSON.parse(storedProducts) || [];
    } catch (error) {
        return [];
    }
}

function createProductCard(product, index) {
        const card = document.createElement('article');
        const imageWrapper = document.createElement('div');
        const image = document.createElement('img');
        const number = document.createElement('span');
        const info = document.createElement('div');
        const category = document.createElement('p');
        const title = document.createElement('h3');
        const price = document.createElement('p');

        card.className = product.image ? 'product-card uploaded-card' : 'product-card';
        card.style.setProperty('--card-index', index + 4);
        imageWrapper.className = 'product-image';
        image.className = 'uploaded-image';
        image.alt = product.name;
        image.src = product.image || '';
        number.textContent = String(index + 5).padStart(2, '0');
        info.className = 'product-info';
        category.className = 'product-category';
        category.textContent = product.category;
        title.textContent = product.name;
        price.className = 'product-price';
        price.textContent = `$${Number(product.price).toFixed(2)}`;

        if (product.image) {
            imageWrapper.append(image);
        } else {
            imageWrapper.classList.add(product.imageClass);
        }
        imageWrapper.append(number);
        info.append(category, title, price);
        card.append(imageWrapper, info);
        return card;
}

function renderPublishedProducts(products) {
    productGrid.innerHTML = '';
    products.forEach((product, index) => productGrid.appendChild(createProductCard(product, index)));
    updateItemCount();
}

async function getRemoteProducts() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('id, nombre, categoria, precio, descripcion, imagen_path')
        .order('creado_en', { ascending: false });

    if (error) throw error;
    return data.map((product) => ({
        ...product,
        name: product.nombre,
        category: product.categoria,
        price: product.precio,
        image: supabaseClient.storage.from('product-images').getPublicUrl(product.imagen_path).data.publicUrl
    }));
}

function revealProductCards() {
    const cards = document.querySelectorAll('.product-card');

    if (!('IntersectionObserver' in window)) {
        cards.forEach((card) => card.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            currentObserver.unobserve(entry.target);
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    cards.forEach((card) => observer.observe(card));
}

async function loadProducts() {
    const products = supabaseClient ? await getRemoteProducts() : getLocalProducts();
    renderPublishedProducts(products);
    revealProductCards();
}

loadProducts().catch(() => renderPublishedProducts(getLocalProducts()));