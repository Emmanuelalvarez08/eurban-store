require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fileType = require('file-type');
const multer = require('multer');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendRoot = path.join(__dirname, '..');
const adminPassword = process.env.ADMIN_PASSWORD;
const sessionTtlMs = Number(process.env.SESSION_TTL_HOURS || 8) * 60 * 60 * 1000;
const sessions = new Map();

if (!adminPassword || adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || false,
    credentials: true
}));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(frontendRoot, { dotfiles: 'deny', index: false }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera unos minutos.' }
});
app.use('/api', apiLimiter);

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eurban_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (request, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        callback(null, allowedTypes.includes(file.mimetype));
    }
});

function setSessionCookie(response, token) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', `eurban_admin=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${Math.floor(sessionTtlMs / 1000)}${secure}`);
}

function getSessionToken(request) {
    const cookies = request.headers.cookie || '';
    const sessionCookie = cookies.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith('eurban_admin='));
    return sessionCookie ? decodeURIComponent(sessionCookie.slice('eurban_admin='.length)) : null;
}

function requireAdmin(request, response, next) {
    const token = getSessionToken(request);
    const session = token && sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
        if (token) sessions.delete(token);
        return response.status(401).json({ error: 'Sesión de administrador requerida.' });
    }
    next();
}

function requireSameOrigin(request, response, next) {
    const origin = request.get('origin');
    if (origin) {
        try {
            if (new URL(origin).host !== request.get('host')) {
                return response.status(403).json({ error: 'Origen no permitido.' });
            }
        } catch {
            return response.status(403).json({ error: 'Origen no permitido.' });
        }
    }
    next();
}

setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions) {
        if (session.expiresAt <= now) sessions.delete(token);
    }
}, 15 * 60 * 1000).unref();

app.post('/api/admin/login', loginLimiter, requireSameOrigin, (request, response) => {
    const { password } = request.body || {};
    const passwordBuffer = typeof password === 'string' ? Buffer.from(password) : Buffer.alloc(0);
    const adminPasswordBuffer = Buffer.from(adminPassword);
    if (passwordBuffer.length > 200 || passwordBuffer.length !== adminPasswordBuffer.length || !crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer)) {
        return response.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expiresAt: Date.now() + sessionTtlMs });
    setSessionCookie(response, token);
    response.json({ authenticated: true });
});

app.get('/api/admin/session', requireAdmin, (request, response) => {
    response.json({ authenticated: true });
});

app.post('/api/admin/logout', requireSameOrigin, (request, response) => {
    const token = getSessionToken(request);
    if (token) sessions.delete(token);
    response.setHeader('Set-Cookie', 'eurban_admin=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
    response.sendStatus(204);
});

app.get('/api/productos', async (request, response) => {
    try {
        const [products] = await pool.query(
            'SELECT id, nombre AS name, categoria AS category, precio AS price, descripcion AS description, imagen_tipo AS imageType FROM productos ORDER BY creado_en DESC'
        );
        response.json(products.map((product) => ({
            ...product,
            image: `/api/productos/${product.id}/imagen`
        })));
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'No se pudo cargar el inventario.' });
    }
});

app.get('/api/productos/:id/imagen', async (request, response) => {
    try {
        const [products] = await pool.query(
            'SELECT imagen, imagen_tipo AS imageType FROM productos WHERE id = ?',
            [request.params.id]
        );
        if (!products.length) return response.sendStatus(404);
        response.set('Content-Type', products[0].imageType);
        response.set('Cache-Control', 'public, max-age=3600');
        response.send(products[0].imagen);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

app.post('/api/productos', requireSameOrigin, requireAdmin, upload.single('image'), async (request, response) => {
    const { name, category, price, description = '' } = request.body;
    const numericPrice = Number(price);
    if (!request.file || typeof name !== 'string' || typeof category !== 'string' || !name.trim() || !category.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 || name.length > 160 || category.length > 100 || String(description).length > 2000) {
        return response.status(400).json({ error: 'La foto, el nombre, la categoría y el precio son obligatorios.' });
    }

    try {
        const detectedType = await fileType.fromBuffer(request.file.buffer);
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!detectedType || !allowedTypes.includes(detectedType.mime) || detectedType.mime !== request.file.mimetype) {
            return response.status(400).json({ error: 'El archivo no es una imagen válida.' });
        }
        const [result] = await pool.query(
            'INSERT INTO productos (nombre, categoria, precio, descripcion, imagen, imagen_tipo) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), category.trim(), numericPrice, String(description).trim(), request.file.buffer, detectedType.mime]
        );
        response.status(201).json({ id: result.insertId, message: 'Producto publicado correctamente.' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'No se pudo guardar el producto.' });
    }
});

app.delete('/api/productos/:id', requireSameOrigin, requireAdmin, async (request, response) => {
    if (!/^\d+$/.test(request.params.id)) return response.sendStatus(400);
    try {
        const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [request.params.id]);
        if (!result.affectedRows) return response.sendStatus(404);
        response.sendStatus(204);
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'No se pudo eliminar el producto.' });
    }
});

app.use((error, request, response, next) => {
    if (error instanceof multer.MulterError) {
        return response.status(400).json({ error: 'La imagen no es válida o supera el límite de 8 MB.' });
    }
    next(error);
});

app.use('/api', (request, response) => {
    response.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((error, request, response, next) => {
    console.error('Error no controlado:', error.message);
    response.status(500).json({ error: 'Error interno del servidor.' });
});

app.get('*', (request, response) => {
    response.sendFile(path.join(frontendRoot, 'index.html'));
});

async function start() {
    await pool.query('SELECT 1');
    console.log('Base de datos Eurban conectada.');
    app.listen(port, () => console.log(`Eurban disponible en http://localhost:${port}`));
}

start().catch((error) => {
    console.error('No se pudo iniciar Eurban. Revisa MySQL y el archivo .env.', error.message);
    process.exitCode = 1;
});
