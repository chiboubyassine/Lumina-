-- ============================================================
-- Lumina Candles - Script d'installation de la base de données
-- Compatible avec MySQL 8.0 (MySQL Workbench)
-- À exécuter en tant qu'utilisateur root
-- ============================================================

CREATE DATABASE IF NOT EXISTS luminaca_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'luminaca_user'@'localhost' IDENTIFIED BY 'OX!HQN9lwW';
GRANT ALL PRIVILEGES ON luminaca_db.* TO 'luminaca_user'@'localhost';
FLUSH PRIVILEGES;

USE luminaca_db;

-- ------------------------------------------------------------
-- Tables (suppression pour repartir sur un état propre)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(500),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  role ENUM('admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_session_product (session_id, product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Catalogue complet (IDs alignés avec les boutons du site)
-- Small : ids 1-7, 12-17 | Medium : ids 18-28 | Large : ids 29-45
-- ------------------------------------------------------------
INSERT INTO products (id, name, price, image, category) VALUES
(1,  'blush small',     270, 'small1.jpg',  'small'),
(2,  'sunset small',    270, 'small2.jpg',  'small'),
(3,  'azurine small',   270, 'small3.jpg',  'small'),
(4,  'rosaline small',  270, 'small4.jpg',  'small'),
(5,  'matcha small',    270, 'small5.jpg',  'small'),
(6,  'solaria small',   270, 'small6.jpg',  'small'),
(7,  'samba small',     270, 'small7.jpg',  'small'),
(12, 'euphoria small',  270, 'small12.jpg', 'small'),
(13, 'pumpkin small',   270, 'small13.jpg', 'small'),
(14, 'soulmate small',  270, 'small14.JPG', 'small'),
(15, 'lilora small',    270, 'small15.jpg', 'small'),
(16, 'sunkiss small',   270, 'small16.JPG', 'small'),
(17, 'angelic small',   270, 'small17.jpeg','small'),
(18, 'azurine medium',  350, 'medium1.jpg', 'medium'),
(19, 'violetta medium', 350, 'medium2.jpg', 'medium'),
(20, 'solaria medium',  350, 'medium3.jpg', 'medium'),
(21, 'brownie medium',  350, 'medium4.jpg', 'medium'),
(22, 'gold medium',     350, 'medium5.jpg', 'medium'),
(23, 'sunset medium',   350, 'medium6.jpg', 'medium'),
(24, 'lilora medium',   350, 'medium7.jpg', 'medium'),
(25, 'pinkora medium',  350, 'medium9.jpg', 'medium'),
(26, 'angelic medium',  350, 'medium10.jpg','medium'),
(27, 'moonstone medium',350, 'medium11.JPG','medium'),
(28, 'blush medium',    350, 'medium12.jpg','medium'),
(29, 'forest large',    420, 'l1.jpg',      'large'),
(30, 'pinkora large',   420, 'l2.jpg',      'large'),
(31, 'sage large',      420, 'l3.jpg',      'large'),
(32, 'skyline large',   420, 'l4.JPG',      'large'),
(33, 'eldorado large',  420, 'l5.JPG',      'large'),
(35, 'blush large',     420, 'l6.JPG',      'large'),
(36, 'plumora large',   420, 'l7.JPG',      'large'),
(37, 'tropicale large', 420, 'l8.jpg',      'large'),
(38, 'soulmate large',  420, 'l9.JPG',      'large'),
(39, 'saphir large',    420, 'l10.jpg',     'large'),
(40, 'brownie large',   420, 'l11.JPG',     'large'),
(41, 'sunny large',     420, 'l12.JPG',     'large'),
(42, 'rosaline large',  420, 'l13.JPG',     'large'),
(43, 'loom large',      420, 'l14.JPG',     'large'),
(44, 'brum large',      420, 'l15.JPG',     'large'),
(45, 'mirelle large',   420, 'l16.JPG',     'large');

ALTER TABLE products AUTO_INCREMENT = 46;

-- ------------------------------------------------------------
-- Utilisateur administrateur (mot de passe : admin123, haché bcrypt)
-- ------------------------------------------------------------
INSERT INTO users (username, password, full_name, email, role) VALUES
('admin', '$2b$10$.9htKKI5k1B0/VmhpJUPNO.YbWxYHAnubSTWEwMrHL8j9CX9vzkxG', 'Administrateur Lumina', 'admin@luminacandles.ma', 'admin');

SELECT COUNT(*) AS total_products FROM products;
SELECT id, username, role FROM users;