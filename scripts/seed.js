const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Configuración de la base de datos
const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
const db = new Database(dbPath);

async function seedDatabase() {
  try {
    console.log('Iniciando seed de la base de datos...');

    // Crear usuario administrador de ejemplo
    const adminPasswordHash = await bcrypt.hash('password123', 12);
    
    const insertAdmin = db.prepare(`
      INSERT OR REPLACE INTO users (
        email, password_hash, first_name, last_name, phone, 
        role, is_active, email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAdmin.run(
      'admin@dulmar.com',
      adminPasswordHash,
      'Administrador',
      'DULMAR',
      '+51987654321',
      'admin',
      1,
      1
    );

    // Crear usuario staff de ejemplo
    const staffPasswordHash = await bcrypt.hash('password123', 12);
    
    insertAdmin.run(
      'staff@dulmar.com',
      staffPasswordHash,
      'María Elena',
      'Dulanto',
      '+51987654322',
      'staff',
      1,
      1
    );

    console.log('Usuarios de ejemplo creados');

    // Servicios de ejemplo
    const services = [
      {
        name: 'Educación Inicial (3-5 años)',
        slug: 'educacion-inicial-3-5-anos',
        description: 'Programa educativo integral para el desarrollo cognitivo, emocional y social de los niños de 3 a 5 años. Incluye actividades de lectoescritura, matemáticas básicas, arte y desarrollo de habilidades sociales.',
        short_description: 'Programa educativo integral para el desarrollo cognitivo y social de los niños',
        category: 'Educación Temprana',
        age_range_min: 36,
        age_range_max: 60,
        duration: 300,
        capacity: 15,
        price: 450,
        is_featured: 1
      },
      {
        name: 'Guardería Integral',
        slug: 'guarderia-integral',
        description: 'Cuidado y atención personalizada para bebés y niños pequeños en un ambiente seguro y estimulante. Incluye alimentación, descanso y actividades de estimulación apropiadas para la edad.',
        short_description: 'Cuidado y atención personalizada para bebés y niños pequeños',
        category: 'Cuidado Diario',
        age_range_min: 6,
        age_range_max: 36,
        duration: 660,
        capacity: 12,
        price: 380,
        is_featured: 1
      },
      {
        name: 'Talleres de Música',
        slug: 'talleres-de-musica',
        description: 'Clases de iniciación musical con instrumentos adaptados para niños. Desarrollo del ritmo, coordinación y expresión artística a través de canciones, bailes y juegos musicales.',
        short_description: 'Clases de música, canto y psicomotricidad',
        category: 'Talleres',
        age_range_min: 12,
        age_range_max: 60,
        duration: 60,
        capacity: 8,
        price: 120,
        is_featured: 0
      },
      {
        name: 'Estimulación Temprana',
        slug: 'estimulacion-temprana',
        description: 'Actividades especializadas para el desarrollo neuromotor de bebés y niños pequeños. Ejercicios de motricidad fina y gruesa, estimulación sensorial y cognitiva.',
        short_description: 'Actividades especializadas para el desarrollo neuromotor',
        category: 'Actividades Recreativas',
        age_range_min: 0,
        age_range_max: 36,
        duration: 45,
        capacity: 6,
        price: 200,
        is_featured: 1
      },
      {
        name: 'Talleres de Teatro',
        slug: 'talleres-de-teatro',
        description: 'Actividades teatrales para desarrollar la creatividad, expresión corporal y habilidades comunicativas. Juegos de roles, improvisación y pequeñas representaciones.',
        short_description: 'Desarrollo de habilidades artísticas y expresión creativa',
        category: 'Eventos',
        age_range_min: 24,
        age_range_max: 72,
        duration: 90,
        capacity: 10,
        price: 150,
        is_featured: 0
      },
      {
        name: 'Programa Nutricional',
        slug: 'programa-nutricional',
        description: 'Alimentación balanceada y nutritiva preparada especialmente para niños. Menús diseñados por nutricionistas especializados en alimentación infantil.',
        short_description: 'Alimentación balanceada y nutritiva preparada con amor',
        category: 'Cuidado Especial',
        age_range_min: 6,
        age_range_max: 72,
        duration: null,
        capacity: 20,
        price: 80,
        is_featured: 0
      }
    ];

    const insertService = db.prepare(`
      INSERT INTO services (
        name, slug, description, short_description, category,
        age_range_min, age_range_max, duration, capacity, price, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    services.forEach(service => {
      insertService.run(
        service.name,
        service.slug,
        service.description,
        service.short_description,
        service.category,
        service.age_range_min,
        service.age_range_max,
        service.duration,
        service.capacity,
        service.price,
        service.is_featured
      );
    });

    console.log('Servicios de ejemplo creados');

    // Algunos mensajes de contacto de ejemplo
    const contacts = [
      {
        first_name: 'Ana',
        last_name: 'García',
        email: 'ana.garcia@email.com',
        phone: '+51987123456',
        child_name: 'Sofía',
        child_age: 24,
        subject: 'Consulta sobre guardería',
        message: 'Me interesa saber más sobre el programa de guardería para mi hija de 2 años.',
        preferred_contact_method: 'whatsapp'
      },
      {
        first_name: 'Carlos',
        last_name: 'Mendoza',
        email: 'carlos.mendoza@email.com',
        phone: '+51987654789',
        child_name: 'Diego',
        child_age: 36,
        subject: 'Educación inicial',
        message: 'Quisiera información sobre los horarios y costos de educación inicial.',
        preferred_contact_method: 'email'
      }
    ];

    const insertContact = db.prepare(`
      INSERT INTO contact_messages (
        first_name, last_name, email, phone, child_name, child_age,
        subject, message, preferred_contact_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    contacts.forEach(contact => {
      insertContact.run(
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.phone,
        contact.child_name,
        contact.child_age,
        contact.subject,
        contact.message,
        contact.preferred_contact_method
      );
    });

    console.log('Mensajes de contacto de ejemplo creados');
    console.log('Seed completado exitosamente!');
    
    console.log('\nCredenciales de prueba:');
    console.log('Admin: admin@dulmar.com / password123');
    console.log('Staff: staff@dulmar.com / password123');

  } catch (error) {
    console.error('Error durante el seed:', error);
  } finally {
    db.close();
  }
}

seedDatabase();