const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'early_stimulation.db');
const db = new Database(dbPath);

console.log('Verificando usuarios en la base de datos...\n');

try {
  const users = db.prepare('SELECT id, email, first_name, last_name, role, is_active, email_verified FROM users').all();
  
  if (users.length === 0) {
    console.log('❌ No se encontraron usuarios en la base de datos');
  } else {
    console.log(`✅ Se encontraron ${users.length} usuario(s):\n`);
    
    users.forEach(user => {
      console.log(`👤 Usuario #${user.id}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.first_name} ${user.last_name}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log(`   Email verificado: ${user.email_verified ? 'Sí' : 'No'}`);
      console.log('');
    });
  }

  // También verificar servicios
  const services = db.prepare('SELECT COUNT(*) as count FROM services').get();
  console.log(`📋 Servicios en la base de datos: ${services.count}`);
  
  // Verificar mensajes de contacto
  const contacts = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get();
  console.log(`📧 Mensajes de contacto: ${contacts.count}`);
  
} catch (error) {
  console.error('❌ Error verificando la base de datos:', error);
} finally {
  db.close();
}