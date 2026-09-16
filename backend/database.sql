CREATE DATABASE IF NOT EXISTS eurban_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eurban_db;

CREATE TABLE IF NOT EXISTS productos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(160) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT NULL,
    imagen MEDIUMBLOB NOT NULL,
    imagen_tipo VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_productos_creado_en (creado_en)
);
