const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_PATH = path.join(__dirname, '../frontend');

// Configuration MySQL (variables d'environnement pour la production, valeurs locales par défaut)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'luminaca_user',
  password: process.env.DB_PASSWORD || 'OX!HQN9lwW',
  database: process.env.DB_NAME || 'luminaca_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(FRONTEND_PATH, { 
  extensions: ['html', 'htm'],
  index: false 
}));

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction d'initialisation de la base de données
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    console.log('Initialisation de la base de données...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        email VARCHAR(255),
        role ENUM('admin', 'staff') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_session_product (session_id, product_id)
      )
    `);
    
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      console.log('Insertion des produits initiaux...');
      
      const products = [
        // Petites bougies (small) - prix 270
        { id: 1,  name: 'blush small',      price: 270, image: 'small1.jpg',   category: 'small' },
        { id: 2,  name: 'sunset small',     price: 270, image: 'small2.jpg',   category: 'small' },
        { id: 3,  name: 'azurine small',    price: 270, image: 'small3.jpg',   category: 'small' },
        { id: 4,  name: 'rosaline small',   price: 270, image: 'small4.jpg',   category: 'small' },
        { id: 5,  name: 'matcha small',     price: 270, image: 'small5.jpg',   category: 'small' },
        { id: 6,  name: 'solaria small',    price: 270, image: 'small6.jpg',   category: 'small' },
        { id: 7,  name: 'samba small',      price: 270, image: 'small7.jpg',   category: 'small' },
        { id: 12, name: 'euphoria small',   price: 270, image: 'small12.jpg',  category: 'small' },
        { id: 13, name: 'pumpkin small',    price: 270, image: 'small13.jpg',  category: 'small' },
        { id: 14, name: 'soulmate small',   price: 270, image: 'small14.JPG',  category: 'small' },
        { id: 15, name: 'lilora small',     price: 270, image: 'small15.jpg',  category: 'small' },
        { id: 16, name: 'sunkiss small',    price: 270, image: 'small16.JPG',  category: 'small' },
        { id: 17, name: 'angelic small',    price: 270, image: 'small17.jpeg', category: 'small' },
        // Bougies moyennes (medium) - prix 350
        { id: 18, name: 'azurine medium',   price: 350, image: 'medium1.jpg',  category: 'medium' },
        { id: 19, name: 'violetta medium',  price: 350, image: 'medium2.jpg',  category: 'medium' },
        { id: 20, name: 'solaria medium',   price: 350, image: 'medium3.jpg',  category: 'medium' },
        { id: 21, name: 'brownie medium',   price: 350, image: 'medium4.jpg',  category: 'medium' },
        { id: 22, name: 'gold medium',      price: 350, image: 'medium5.jpg',  category: 'medium' },
        { id: 23, name: 'sunset medium',    price: 350, image: 'medium6.jpg',  category: 'medium' },
        { id: 24, name: 'lilora medium',    price: 350, image: 'medium7.jpg',  category: 'medium' },
        { id: 25, name: 'pinkora medium',   price: 350, image: 'medium9.jpg',  category: 'medium' },
        { id: 26, name: 'angelic medium',   price: 350, image: 'medium10.jpg', category: 'medium' },
        { id: 27, name: 'moonstone medium', price: 350, image: 'medium11.JPG', category: 'medium' },
        { id: 28, name: 'blush medium',     price: 350, image: 'medium12.jpg', category: 'medium' },
        // Grandes bougies (large) - prix 420
        { id: 29, name: 'forest large',     price: 420, image: 'l1.jpg',       category: 'large' },
        { id: 30, name: 'pinkora large',    price: 420, image: 'l2.jpg',       category: 'large' },
        { id: 31, name: 'sage large',       price: 420, image: 'l3.jpg',       category: 'large' },
        { id: 32, name: 'skyline large',    price: 420, image: 'l4.JPG',       category: 'large' },
        { id: 33, name: 'eldorado large',   price: 420, image: 'l5.JPG',       category: 'large' },
        { id: 35, name: 'blush large',      price: 420, image: 'l6.JPG',       category: 'large' },
        { id: 36, name: 'plumora large',    price: 420, image: 'l7.JPG',       category: 'large' },
        { id: 37, name: 'tropicale large',  price: 420, image: 'l8.jpg',       category: 'large' },
        { id: 38, name: 'soulmate large',   price: 420, image: 'l9.JPG',       category: 'large' },
        { id: 39, name: 'saphir large',     price: 420, image: 'l10.jpg',      category: 'large' },
        { id: 40, name: 'brownie large',    price: 420, image: 'l11.JPG',      category: 'large' },
        { id: 41, name: 'sunny large',      price: 420, image: 'l12.JPG',      category: 'large' },
        { id: 42, name: 'rosaline large',   price: 420, image: 'l13.JPG',      category: 'large' },
        { id: 43, name: 'loom large',       price: 420, image: 'l14.JPG',      category: 'large' },
        { id: 44, name: 'brum large',       price: 420, image: 'l15.JPG',      category: 'large' },
        { id: 45, name: 'mirelle large',    price: 420, image: 'l16.JPG',      category: 'large' }
      ];

      for (const product of products) {
        await connection.execute(
          'INSERT INTO products (id, name, price, image, category) VALUES (?, ?, ?, ?, ?)',
          [product.id, product.name, product.price, product.image, product.category]
        );
      }
      
      await connection.execute('ALTER TABLE products AUTO_INCREMENT = 46');
      
      console.log(`${products.length} produits insérés avec succès`);
    } else {
      console.log(`Base de données déjà initialisée avec ${existingProducts[0].count} produits`);
    }
    
    // Verification / insertion de l'utilisateur admin
    const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      const adminPasswordHash = bcrypt.hashSync('admin123', 10);
      await connection.execute(
        'INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', adminPasswordHash, 'Administrateur Lumina', 'admin@luminacandles.ma', 'admin']
      );
      console.log('Utilisateur admin créé avec succès');
    } else {
      console.log(`Comptes utilisateurs déjà initialisés (${existingUsers[0].count})`);
    }
    
    connection.release();
    console.log('Initialisation de la base de données terminée');
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

// Route de santé de l'API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Lumina fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// ROUTES PRODUITS
// =====================================================

// Récupérer tous les produits
// Récupérer tous les produits (ou par catégorie)
app.get('/api/products', async (req, res) => {
  let connection;
  try {
    const { category } = req.query;
    connection = await pool.getConnection();
    
    let query = 'SELECT * FROM products';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, id';
    
    const [products] = await connection.execute(query, params);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des produits' });
  } finally {
    if (connection) connection.release();
  }
});

// =====================================================
// ROUTES PANIER
// =====================================================

// Récupérer le panier
app.get('/api/cart', async (req, res) => {
  let connection;
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id est requis' });
    }

    connection = await pool.getConnection();
    
    const [cartItems] = await connection.execute(`
      SELECT ci.*, p.name as product_name, p.price as product_price, p.image as product_image
      FROM cart_items ci 
      LEFT JOIN products p ON ci.product_id = p.id 
      WHERE ci.session_id = ?
    `, [session_id]);
    
    res.json({ success: true, data: cartItems });
  } catch (error) {
    console.error('Erreur récupération panier:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du panier' });
  } finally {
    if (connection) connection.release();
  }
});

// Ajouter au panier
app.post('/api/cart', async (req, res) => {
  let connection;
  try {
    const { session_id, product_id, quantity = 1 } = req.body;
    
    console.log('Données reçues pour panier:', { session_id, product_id, quantity });
    
    if (!session_id || !product_id) {
      return res.status(400).json({ error: 'session_id et product_id sont requis' });
    }

    connection = await pool.getConnection();
    
    const [product] = await connection.execute(
      'SELECT id, name, price FROM products WHERE id = ?',
      [product_id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const [existing] = await connection.execute(
      'SELECT id, quantity FROM cart_items WHERE session_id = ? AND product_id = ?',
      [session_id, product_id]
    );
    
    if (existing.length > 0) {
      await connection.execute(
        'UPDATE cart_items SET quantity = quantity + ? WHERE session_id = ? AND product_id = ?',
        [quantity, session_id, product_id]
      );
    } else {
      await connection.execute(
        'INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)',
        [session_id, product_id, quantity]
      );
    }
    
    const [cartItems] = await connection.execute(`
      SELECT ci.*, p.name as product_name, p.price as product_price, p.image as product_image
      FROM cart_items ci 
      LEFT JOIN products p ON ci.product_id = p.id 
      WHERE ci.session_id = ?
    `, [session_id]);
    
    res.json({ 
      success: true, 
      message: 'Article ajouté au panier',
      data: cartItems 
    });
    
  } catch (error) {
    console.error('Erreur ajout panier:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'ajout au panier',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Mettre à jour la quantité
app.put('/api/cart/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { session_id, quantity } = req.body;
    
    if (!session_id || quantity === undefined) {
      return res.status(400).json({ error: 'session_id et quantity sont requis' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'La quantité doit être supérieure à 0' });
    }

    connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND session_id = ?',
      [quantity, id, session_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Article du panier non trouvé' });
    }
    
    res.json({ success: true, message: 'Quantité mise à jour' });
    
  } catch (error) {
    console.error('Erreur mise à jour quantité:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la quantité' });
  } finally {
    if (connection) connection.release();
  }
});

// Supprimer un article
app.delete('/api/cart/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id est requis' });
    }

    connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM cart_items WHERE id = ? AND session_id = ?',
      [id, session_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Article du panier non trouvé' });
    }
    
    res.json({ success: true, message: 'Article supprimé du panier' });
    
  } catch (error) {
    console.error('Erreur suppression panier:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'article' });
  } finally {
    if (connection) connection.release();
  }
});

// Vider le panier
app.delete('/api/cart', async (req, res) => {
  let connection;
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id est requis' });
    }

    connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM cart_items WHERE session_id = ?',
      [session_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Panier vidé',
      deletedItems: result.affectedRows 
    });
    
  } catch (error) {
    console.error('Erreur vidage panier:', error);
    res.status(500).json({ error: 'Erreur serveur lors du vidage du panier' });
  } finally {
    if (connection) connection.release();
  }
});

// =====================================================
// ROUTES COMMANDES
// =====================================================

// Passer une commande
app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('DÉBUT TRANSACTION - Création commande');
    await connection.beginTransaction();
    
    const { customer, products, session_id } = req.body;
    
    console.log('Données reçues:', { 
      customer: customer ? 'PRÉSENT' : 'ABSENT',
      products: products ? `${products.length} produits` : 'ABSENT',
      session_id 
    });
    
    if (!customer || !customer.fullName || !customer.email || !customer.address || !customer.phone) {
      console.log('Validation client échouée');
      await connection.rollback();
      return res.status(400).json({ error: 'Informations client incomplètes' });
    }
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('Validation produits échouée');
      await connection.rollback();
      return res.status(400).json({ error: 'Aucun produit dans la commande' });
    }
    
    // Créer le client
    console.log('Insertion client...');
    const [customerResult] = await connection.execute(
      'INSERT INTO customers (full_name, email, phone, address) VALUES (?, ?, ?, ?)',
      [customer.fullName, customer.email, customer.phone, customer.address]
    );
    
    const customerId = customerResult.insertId;
    console.log(`Client créé - ID: ${customerId}`);
    
    // Générer numéro de commande
    const orderNumber = 'CMD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Calculer le total
    const totalAmount = products.reduce((total, product) => {
      return total + (parseFloat(product.price) * parseInt(product.quantity));
    }, 0);
    
    // Créer la commande
    console.log('Insertion commande...');
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (order_number, customer_id, total_amount) VALUES (?, ?, ?)',
      [orderNumber, customerId, totalAmount]
    );
    
    const orderId = orderResult.insertId;
    console.log(`Commande créée - ID: ${orderId}, Numéro: ${orderNumber}`);
    
    // Ajouter les articles
    console.log(`Insertion ${products.length} articles...`);
    for (const product of products) {
      const subtotal = parseFloat(product.price) * parseInt(product.quantity);
      
      await connection.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, product.id, product.name, product.price, product.quantity, subtotal]
      );
    }
    console.log('Articles insérés');
    
    // Vider le panier
    if (session_id) {
      console.log(`Vidage panier session: ${session_id}`);
      const [deleteResult] = await connection.execute(
        'DELETE FROM cart_items WHERE session_id = ?',
        [session_id]
      );
      console.log(`Panier vidé - ${deleteResult.affectedRows} articles supprimés`);
    }
    
    // COMMIT
    await connection.commit();
    console.log('TRANSACTION COMMITÉE AVEC SUCCÈS');
    
    console.log(`COMMANDE FINALISÉE: ${orderNumber}`);
    console.log(`   Client: ${customer.fullName} (ID: ${customerId})`);
    console.log(`   Produits: ${products.length}`);
    console.log(`   Total: ${totalAmount} DH`);
    
    res.json({ 
      success: true, 
      orderNumber: orderNumber,
      message: 'Commande passée avec succès'
    });
    
  } catch (error) {
    console.error('ERREUR TRANSACTION:', error);
    await connection.rollback();
    console.log('TRANSACTION ANNULÉE (ROLLBACK)');
    
    res.status(500).json({ 
      error: 'Erreur lors de la création de la commande',
      details: error.message 
    });
  } finally {
    connection.release();
    console.log('FIN TRANSACTION - Connexion libérée');
  }
});

// =====================================================
// NOUVELLES ROUTES POUR AFFICHER LES DONNÉES
// =====================================================

// Récupérer toutes les commandes avec détails client
app.get('/api/orders', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [orders] = await connection.execute(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.order_date,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
    `);
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des commandes' });
  } finally {
    if (connection) connection.release();
  }
});

// Récupérer une commande spécifique avec ses articles
app.get('/api/orders/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    
    // Récupérer la commande
    const [orders] = await connection.execute(`
      SELECT 
        o.*,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    // Récupérer les articles de la commande
    const [items] = await connection.execute(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [id]);
    
    const order = orders[0];
    order.items = items;
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la commande' });
  } finally {
    if (connection) connection.release();
  }
});

// Récupérer tous les clients
app.get('/api/customers', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [customers] = await connection.execute(`
      SELECT * FROM customers ORDER BY created_at DESC
    `);
    
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients' });
  } finally {
    if (connection) connection.release();
  }
});

// Mettre à jour le statut d'une commande
app.put('/api/orders/:id/status', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du statut' });
  } finally {
    if (connection) connection.release();
  }
});

// =====================================================
// ROUTES DEBUG
// =====================================================

app.get('/api/debug/db', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [customers] = await connection.execute('SELECT COUNT(*) as count FROM customers');
    const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [orderItems] = await connection.execute('SELECT COUNT(*) as count FROM order_items');
    const [cartItems] = await connection.execute('SELECT COUNT(*) as count FROM cart_items');
    
    res.json({
      success: true,
      data: {
        customers: customers[0].count,
        orders: orders[0].count,
        order_items: orderItems[0].count,
        cart_items: cartItems[0].count
      }
    });
    
  } catch (error) {
    console.error('Erreur debug DB:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// =====================================================
// ROUTES ADMIN
// =====================================================

app.post('/api/admin/login', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    connection = await pool.getConnection();
    
    const [users] = await connection.execute(
      'SELECT id, username, password, full_name, email, role FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    const user = users[0];
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    if (connection) connection.release();
  }
});

// =====================================================
// ROUTES HTML
// =====================================================

app.get('/admin', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'admin.html'));
});

app.get('/large', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'Large.html'));
});

app.get('/small', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'small.html'));
});

app.get('/medium', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'medium.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'home.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'home.html'));
});

// Gestion 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion erreurs
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: error.message 
  });
});

// Démarrage serveur
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`API disponible sur: http://localhost:${PORT}/api`);
      console.log(`Accueil: http://localhost:${PORT}/`);
      console.log(`Page Large: http://localhost:${PORT}/large`);
      console.log(`NOUVELLES ROUTES:`);
      console.log(`  - GET /api/orders - Liste toutes les commandes`);
      console.log(`  - GET /api/orders/:id - Détails d'une commande`);
      console.log(`  - GET /api/customers - Liste tous les clients`);
      console.log(`  - PUT /api/orders/:id/status - Mettre à jour le statut`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();

// Gestion arrêt propre
process.on('SIGINT', async () => {
  console.log('\nArrêt du serveur...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nArrêt du serveur...');
  await pool.end();
  process.exit(0);
});