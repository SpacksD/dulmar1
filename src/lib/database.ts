import Database from 'better-sqlite3';
import path from 'path';

// Configuración de la base de datos
const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
const db = new Database(dbPath);

// Configurar WAL mode para mejor concurrencia
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
    role TEXT DEFAULT 'parent' CHECK (role IN ('admin', 'staff', 'parent')),
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
    category TEXT NOT NULL CHECK (category IN ('Cuidado Diario', 'Educación Temprana', 'Actividades Recreativas', 'Cuidado Especial', 'Talleres', 'Eventos')),
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
    entity_type TEXT NOT NULL CHECK (entity_type IN ('service', 'promotion', 'gallery', 'user', 'general')),
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
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_service')),
    discount_value DECIMAL(10,2),
    min_age INTEGER, -- edad mínima para aplicar (en meses)
    max_age INTEGER, -- edad máxima para aplicar (en meses)
    applicable_services TEXT, -- JSON array de service_ids aplicables
    promo_code VARCHAR(50) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_uses INTEGER, -- máximo número de usos
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    terms_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// ==============================================
// TABLA PARA SUBSCRIPCIONES MENSUALES
// ==============================================
const createSubscriptionsTable = `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_code VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    child_name VARCHAR(100) NOT NULL,
    child_age INTEGER NOT NULL, -- edad en meses
    parent_name VARCHAR(200) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,

    -- Información de la subscripción mensual
    start_month INTEGER NOT NULL, -- mes (1-12)
    start_year INTEGER NOT NULL, -- año
    preferred_days TEXT, -- JSON array: ["lunes", "miércoles", "viernes"]
    preferred_times TEXT, -- JSON array: ["09:00", "10:00"]
    sessions_per_month INTEGER DEFAULT 8, -- número de sesiones por mes

    special_requests TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'completed')),

    -- Información financiera
    monthly_price DECIMAL(10,2) NOT NULL,
    promotion_id INTEGER,
    promotion_code VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_monthly_price DECIMAL(10,2) NOT NULL,

    -- Información de pago
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'monthly_plan')),
    payment_reference VARCHAR(100),
    last_payment_date DATETIME,
    next_payment_date DATE,

    -- Información administrativa
    confirmed_by INTEGER,
    admin_notes TEXT,
    cancellation_reason TEXT,
    cancelled_at DATETIME,
    cancelled_by INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
  )
`;

// ==============================================
// TABLA PARA SESIONES INDIVIDUALES
// ==============================================
const createSessionsTable = `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    session_number INTEGER NOT NULL, -- número de sesión dentro del mes (1, 2, 3...)

    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),

    -- Información de la sesión
    duration_minutes INTEGER NOT NULL,
    attendance_confirmed BOOLEAN DEFAULT 0,
    session_notes TEXT, -- notas del terapeuta sobre la sesión
    parent_feedback TEXT, -- feedback de los padres

    -- Información de reprogramación
    original_date DATE, -- fecha original si fue reprogramada
    original_time TIME, -- hora original si fue reprogramada
    rescheduled_reason TEXT,
    rescheduled_by INTEGER,
    rescheduled_at DATETIME,

    -- Información administrativa
    conducted_by INTEGER, -- terapeuta que condujo la sesión
    confirmed_by INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rescheduled_by) REFERENCES users(id) ON DELETE SET NULL
  )
`;

// ==============================================
// TABLA PARA MANTENER COMPATIBILIDAD (MIGRACIÓN)
// ==============================================
const createBookingsTable = `
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    child_name VARCHAR(100) NOT NULL,
    child_age INTEGER NOT NULL,
    parent_name VARCHAR(200) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,

    -- Campos adaptados para subscripciones
    subscription_id INTEGER, -- referencia a la subscripción
    start_month INTEGER, -- mes de inicio
    start_year INTEGER, -- año de inicio
    preferred_days TEXT, -- días preferidos (JSON)
    preferred_times TEXT, -- horarios preferidos (JSON)
    sessions_per_month INTEGER DEFAULT 8,

    special_requests TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'active')),

    original_price DECIMAL(10,2) NOT NULL,
    promotion_id INTEGER,
    promotion_code VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,

    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'monthly_plan')),
    payment_reference VARCHAR(100),
    paid_at DATETIME,

    confirmed_by INTEGER,
    admin_notes TEXT,
    cancellation_reason TEXT,
    cancelled_at DATETIME,
    cancelled_by INTEGER,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
  )
`;

// ==============================================
// TABLA PARA HISTORIAL DE CAMBIOS EN BOOKINGS
// ==============================================
const createBookingHistoryTable = `
  CREATE TABLE IF NOT EXISTS booking_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'confirmed', 'modified', 'cancelled', 'completed', 'payment_updated')),
    previous_status TEXT,
    new_status TEXT,
    changed_by INTEGER,
    change_reason TEXT,
    additional_data TEXT, -- JSON para datos adicionales
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
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
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'responded', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to INTEGER,
    admin_notes TEXT,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  )
`;

// ==============================================
// TABLA PARA RECIBOS/FACTURAS
// ==============================================
const createInvoicesTable = `
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    subscription_id INTEGER,
    booking_id INTEGER, -- para compatibilidad
    user_id INTEGER NOT NULL,

    -- Información del recibo
    invoice_type TEXT DEFAULT 'monthly' CHECK (invoice_type IN ('monthly', 'registration', 'additional')),
    billing_month INTEGER, -- mes facturado
    billing_year INTEGER, -- año facturado
    due_date DATE NOT NULL,

    -- Información financiera
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Estado del recibo
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),

    -- Información de pago
    paid_amount DECIMAL(10,2) DEFAULT 0,
    paid_at DATETIME,
    payment_method TEXT CHECK (payment_method IN ('yape', 'transferencia')),
    payment_reference VARCHAR(100),
    payment_proof TEXT, -- imagen o documento del comprobante

    -- Metadatos
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

// ==============================================
// TABLA PARA ITEMS DE RECIBOS
// ==============================================
const createInvoiceItemsTable = `
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,

    -- Información del item
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    -- Metadatos del servicio
    service_id INTEGER,
    service_name VARCHAR(200),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
  )
`;

// ==============================================
// TABLA PARA HISTORIAL DE PAGOS
// ==============================================
const createPaymentHistoryTable = `
  CREATE TABLE IF NOT EXISTS payment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    -- Información del pago
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('yape', 'transferencia')),
    payment_reference VARCHAR(100),
    payment_proof TEXT, -- imagen del comprobante

    -- Estado del pago
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),

    -- Metadatos
    notes TEXT,
    admin_notes TEXT,
    confirmed_by INTEGER,
    confirmed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
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

  // Índices para subscripciones
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_service ON subscriptions(service_id)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_start_date ON subscriptions(start_year, start_month)',
  'CREATE INDEX IF NOT EXISTS idx_subscriptions_code ON subscriptions(subscription_code)',

  // Índices para sesiones
  'CREATE INDEX IF NOT EXISTS idx_sessions_subscription ON sessions(subscription_id)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_conducted_by ON sessions(conducted_by)',

  // Índices para bookings (compatibilidad)
  'CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_subscription ON bookings(subscription_id)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code)',
  'CREATE INDEX IF NOT EXISTS idx_booking_history_booking ON booking_history(booking_id)',

  // Índices para facturas/recibos
  'CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)',

  // Índices para items de factura
  'CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoice_items_service ON invoice_items(service_id)',

  // Índices para historial de pagos
  'CREATE INDEX IF NOT EXISTS idx_payment_history_invoice ON payment_history(invoice_id)',
  'CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status)',

  'CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status)',
  'CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at)'
];

// ==============================================
// TABLA DE CÓDIGOS DE RECUPERACIÓN DE CONTRASEÑA
// ==============================================
const createPasswordResetCodesTable = `
  CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;

// Índice para códigos de recuperación
const createPasswordResetIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_codes(email)',
  'CREATE INDEX IF NOT EXISTS idx_password_reset_code ON password_reset_codes(code)',
  'CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_codes(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_codes(expires_at)'
];

// Inicializar la base de datos
function initializeDatabase() {
  try {
    // Crear tablas
    db.exec(createUsersTable);
    db.exec(createServicesTable);
    db.exec(createImagesTable);
    db.exec(createPromotionsTable);
    db.exec(createSubscriptionsTable);
    db.exec(createSessionsTable);
    db.exec(createBookingsTable);
    db.exec(createBookingHistoryTable);
    db.exec(createInvoicesTable);
    db.exec(createInvoiceItemsTable);
    db.exec(createPaymentHistoryTable);
    db.exec(createContactMessagesTable);
    db.exec(createPasswordResetCodesTable);

    // Migración para actualizar promotions table (si existe current_uses, renombrarlo a used_count)
    try {
      const tableInfo = db.prepare("PRAGMA table_info(promotions)").all() as Array<{ name: string }>;
      const hasCurrentUses = tableInfo.some((col) => col.name === 'current_uses');
      const hasUsedCount = tableInfo.some((col) => col.name === 'used_count');

      if (hasCurrentUses && !hasUsedCount) {
        db.exec('ALTER TABLE promotions ADD COLUMN used_count INTEGER DEFAULT 0');
        db.exec('UPDATE promotions SET used_count = current_uses');
        console.log('Migrated promotions table: current_uses -> used_count');
      }
    } catch {
      console.log('Migration not needed or already applied');
    }

    // Migración para actualizar bookings table para subscripciones
    try {
      const bookingsTableInfo = db.prepare("PRAGMA table_info(bookings)").all() as Array<{ name: string }>;
      const hasSubscriptionId = bookingsTableInfo.some((col) => col.name === 'subscription_id');

      if (!hasSubscriptionId) {
        console.log('Migrando tabla bookings para subscripciones...');

        // Agregar nuevas columnas para subscripciones
        db.exec('ALTER TABLE bookings ADD COLUMN subscription_id INTEGER');
        db.exec('ALTER TABLE bookings ADD COLUMN start_month INTEGER');
        db.exec('ALTER TABLE bookings ADD COLUMN start_year INTEGER');
        db.exec('ALTER TABLE bookings ADD COLUMN preferred_days TEXT');
        db.exec('ALTER TABLE bookings ADD COLUMN preferred_times TEXT');
        db.exec('ALTER TABLE bookings ADD COLUMN sessions_per_month INTEGER DEFAULT 8');

        console.log('Migración de bookings completada');
      }
    } catch (error) {
      console.log('Migración de bookings no necesaria o ya aplicada:', error);
    }

    // Crear índices después de las migraciones
    createIndexes.forEach(index => {
      try {
        db.exec(index);
      } catch {
        console.log('Error creando índice (probablemente ya existe):', index);
      }
    });

    // Crear índices para password reset
    createPasswordResetIndexes.forEach(index => {
      try {
        db.exec(index);
      } catch {
        console.log('Error creando índice de password reset (probablemente ya existe):', index);
      }
    });

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

// Inicializar si es necesario
initializeDatabase();

export default db;