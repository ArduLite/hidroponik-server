-- =============================================
-- Migrasi Database Hidroponik Server
-- =============================================

CREATE DATABASE IF NOT EXISTS hidroponik
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hidroponik;

-- Tabel data sensor (ditulis dari MQTT di initMqtt.js)
CREATE TABLE IF NOT EXISTS data_sensor (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nutrisi DECIMAL(10,2) NOT NULL DEFAULT 0,
    suhu DECIMAL(10,2) NOT NULL DEFAULT 0,
    kelembaban DECIMAL(10,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Tabel daftar aktuator (status di-update dari /publish di initWeb.js)
CREATE TABLE IF NOT EXISTS list_aktuator (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nama VARCHAR(50) NOT NULL,
    status ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
    PRIMARY KEY (id),
    UNIQUE KEY uq_aktuator_nama (nama)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Data awal aktuator
INSERT IGNORE INTO list_aktuator (nama, status) VALUES
    ('pompa', 'OFF');