// Script para verificar schedule slots disponibles
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📋 Verificando schedule slots...\n');

// Obtener todos los servicios
const services = db.prepare(`
  SELECT id, name
  FROM services
  WHERE is_active = 1
  ORDER BY id
`).all();

console.log(`Total de servicios activos: ${services.length}\n`);

services.forEach(service => {
  const slots = db.prepare(`
    SELECT id, day_of_week, start_time, end_time
    FROM schedule_slots
    WHERE service_id = ? AND is_active = 1
    ORDER BY day_of_week, start_time
  `).all(service.id);

  console.log(`\n🔹 ${service.name} (ID: ${service.id})`);

  if (slots.length === 0) {
    console.log('   ❌ Sin schedule slots configurados');
  } else {
    console.log(`   ✅ ${slots.length} schedule slots configurados:`);

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    slots.forEach(slot => {
      console.log(`      • ${dayNames[slot.day_of_week]} ${slot.start_time}-${slot.end_time} (ID: ${slot.id})`);
    });
  }
});

// Resumen
const totalSlots = db.prepare('SELECT COUNT(*) as count FROM schedule_slots WHERE is_active = 1').get();
console.log(`\n\n📊 Total de schedule slots activos: ${totalSlots.count}`);

db.close();
