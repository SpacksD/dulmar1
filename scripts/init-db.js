const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Crear el directorio database si no existe
const databaseDir = path.join(process.cwd(), 'database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// Configuración de la base de datos
const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
const db = new Database(dbPath);

// Configurar WAL mode para mejor concurrencia
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Inicializando base de datos...');

// ==============================================
// TABLA DE USUARIOS PARA MÓDULO DE ACCESO
// ==============================================
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role TEXT CHECK(role IN ('admin', 'staff', 'parent')) DEFAULT 'parent',
    is_active BOOLEAN DEFAULT 1,
    email_verified BOOLEAN DEFAULT 0,
    verification_code VARCHAR(6),
    verification_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )
`;

// ==============================================
// TABLA DE SERVICIOS A OFRECER
// ==============================================
const createServicesTable = `
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category TEXT CHECK(category IN ('guarderia', 'musica', 'teatro', 'nutricion', 'estimulacion', 'educacion', 'otros')) NOT NULL,
    age_range_min INTEGER, -- edad mínima en meses
    age_range_max INTEGER, -- edad máxima en meses
    duration INTEGER, -- duración en minutos
    capacity INTEGER, -- capacidad máxima
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// ==============================================
// TABLA PARA RUTAS DE IMÁGENES
// ==============================================
const createImagesTable = `
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    title VARCHAR(255),
    entity_type TEXT CHECK(entity_type IN ('service', 'promotion', 'gallery', 'user', 'general')) NOT NULL,
    entity_id INTEGER, -- ID de la entidad relacionada (service_id, promotion_id, etc.)
    is_primary BOOLEAN DEFAULT 0, -- imagen principal de la entidad
    sort_order INTEGER DEFAULT 0,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  )
`;

// ==============================================
// TABLA PARA GESTIONAR PROMOCIONES
// ==============================================
const createPromotionsTable = `
  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed_amount', 'free_service')) NOT NULL,
    discount_value DECIMAL(10,2),
    min_age INTEGER, -- edad mínima para aplicar (en meses)
    max_age INTEGER, -- edad máxima para aplicar (en meses)
    applicable_services TEXT, -- JSON array de service_ids aplicables
    promo_code VARCHAR(50) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_uses INTEGER, -- máximo número de usos
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    terms_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// ==============================================
// TABLA PARA MENSAJES DE CONTACTO
// ==============================================
const createContactMessagesTable = `
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    child_name VARCHAR(100),
    child_age INTEGER, -- edad en meses
    subject VARCHAR(200),
    message TEXT NOT NULL,
    interested_services TEXT, -- JSON array de service_ids
    preferred_contact_method TEXT CHECK(preferred_contact_method IN ('email', 'phone', 'whatsapp')) DEFAULT 'email',
    status TEXT CHECK(status IN ('new', 'in_progress', 'responded', 'closed')) DEFAULT 'new',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    assigned_to INTEGER,
    admin_notes TEXT,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  )
`;

// ==============================================
// ÍNDICES PARA OPTIMIZAR CONSULTAS
// ==============================================
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_services_category ON services(category)',
  'CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured)',
  'CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_images_primary ON images(entity_type, entity_id, is_primary)',
  'CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date)',
  'CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(promo_code)',
  'CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status)',
  'CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at)'
];

function initializeDatabase() {
  try {
    // Crear tablas
    db.exec(createUsersTable);
    console.log('✓ Tabla users creada');
    
    db.exec(createServicesTable);
    console.log('✓ Tabla services creada');
    
    db.exec(createImagesTable);
    console.log('✓ Tabla images creada');
    
    db.exec(createPromotionsTable);
    console.log('✓ Tabla promotions creada');
    
    db.exec(createContactMessagesTable);
    console.log('✓ Tabla contact_messages creada');

    // Crear índices
    createIndexes.forEach((index, i) => {
      db.exec(index);
    });
    console.log('✓ Índices creados');

    console.log('✅ Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    return false;
  } finally {
    db.close();
  }
}

// Ejecutar inicialización
if (initializeDatabase()) {
  console.log('\n🎉 Base de datos lista para usar!');
  console.log('Ahora puedes ejecutar: npm run seed');
} else {
  process.exit(1);
}