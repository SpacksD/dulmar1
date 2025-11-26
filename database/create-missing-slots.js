// =====================================================
// SCRIPT PARA CREAR SCHEDULE SLOTS FALTANTES
// Crea horarios para servicios que no tienen
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Creando schedule slots faltantes...\n');

// =====================================================
// CONFIGURACIÓN DE HORARIOS POR SERVICIO
// =====================================================

const scheduleConfig = {
  // Talleres de Teatro (ID: 5)
  5: {
    name: 'Talleres de Teatro',
    slots: [
      { day: 1, start: '15:00', end: '17:00', capacity: 15 }, // Lunes
      { day: 2, start: '15:00', end: '17:00', capacity: 15 }, // Martes
      { day: 3, start: '15:00', end: '17:00', capacity: 15 }, // Miércoles
      { day: 4, start: '15:00', end: '17:00', capacity: 15 }, // Jueves
      { day: 5, start: '15:00', end: '17:00', capacity: 15 }, // Viernes
      { day: 6, start: '09:00', end: '11:00', capacity: 15 }, // Sábado
    ]
  },
  // Cuidado de bebés de 8 a 9 (ID: 7)
  7: {
    name: 'Cuidado de bebes de 8 a 9',
    slots: [
      { day: 1, start: '08:00', end: '09:00', capacity: 8 },  // Lunes
      { day: 2, start: '08:00', end: '09:00', capacity: 8 },  // Martes
      { day: 3, start: '08:00', end: '09:00', capacity: 8 },  // Miércoles
      { day: 4, start: '08:00', end: '09:00', capacity: 8 },  // Jueves
      { day: 5, start: '08:00', end: '09:00', capacity: 8 },  // Viernes
      { day: 6, start: '08:00', end: '09:00', capacity: 8 },  // Sábado
    ]
  }
};

// =====================================================
// PROCESO PRINCIPAL
// =====================================================

try {
  const insertStmt = db.prepare(`
    INSERT INTO schedule_slots (
      service_id,
      day_of_week,
      start_time,
      end_time,
      max_capacity,
      is_active
    ) VALUES (?, ?, ?, ?, ?, 1)
  `);

  let totalCreated = 0;
  const results = [];

  for (const [serviceId, config] of Object.entries(scheduleConfig)) {
    console.log(`\n🔹 ${config.name} (ID: ${serviceId})`);

    let createdForService = 0;
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (const slot of config.slots) {
      try {
        const result = insertStmt.run(
          parseInt(serviceId),
          slot.day,
          slot.start,
          slot.end,
          slot.capacity
        );

        console.log(`   ✓ ${dayNames[slot.day]} ${slot.start}-${slot.end} (Cap: ${slot.capacity}) - ID: ${result.lastInsertRowid}`);
        createdForService++;
        totalCreated++;
      } catch (error) {
        console.log(`   ✗ Error creando slot ${dayNames[slot.day]}: ${error.message}`);
      }
    }

    results.push({
      service_id: serviceId,
      service_name: config.name,
      slots_created: createdForService
    });
  }

  // Resumen
  console.log('\n\n📊 RESUMEN:\n');
  console.log('═'.repeat(70));
  console.log(`   ✅ Total de schedule slots creados: ${totalCreated}`);
  console.log('═'.repeat(70));

  results.forEach(r => {
    console.log(`   • ${r.service_name}: ${r.slots_created} slots`);
  });

  console.log('\n🎉 ¡Schedule slots creados exitosamente!\n');
  console.log('💡 Próximos pasos:');
  console.log('   1. Ejecuta: node fix-weekly-schedules.js');
  console.log('   2. Ejecuta: node seed-sessions.js\n');

} catch (error) {
  console.error('❌ Error durante el proceso:', error);
  console.error(error.stack);
} finally {
  db.close();
}
