// =====================================================
// SCRIPT PARA GENERAR DATOS DE ASISTENCIA Y OBSERVACIONES
// Genera registros de asistencia, observaciones y notas diarias
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Iniciando generación de datos de asistencia...\n');

// =====================================================
// DATOS DE EJEMPLO
// =====================================================

const observationCategories = ['physical', 'cognitive', 'social', 'emotional', 'language', 'general'];

const observationTemplates = {
  physical: [
    'Excelente coordinación motora durante las actividades de salto.',
    'Muestra mejoría en el equilibrio. Puede pararse en un pie por 5 segundos.',
    'Dificultad para sujetar el lápiz correctamente. Necesita más práctica.',
    'Gran energía durante actividades físicas. Participó activamente en juegos de movimiento.',
    'Desarrollo motor fino adecuado. Puede abrochar botones sin ayuda.'
  ],
  cognitive: [
    'Reconoce todos los colores básicos sin dificultad.',
    'Cuenta hasta 10 correctamente. Muestra interés en números mayores.',
    'Excelente memoria. Recordó la secuencia de actividades de ayer.',
    'Resuelve rompecabezas de 12 piezas con mínima ayuda.',
    'Muestra curiosidad por causa y efecto. Pregunta "¿por qué?" constantemente.'
  ],
  social: [
    'Comparte juguetes voluntariamente con otros niños.',
    'Prefiere jugar solo. Necesita más estímulo para interacción grupal.',
    'Líder natural en juegos de grupo. Otros niños lo siguen.',
    'Muestra empatía cuando otro niño llora. Ofreció su juguete para consolar.',
    'Conflicto con otro niño por un juguete. Se resolvió con mediación.'
  ],
  emotional: [
    'Estado de ánimo estable todo el día. Sonrió frecuentemente.',
    'Lloró al despedirse de mamá. Se calmó después de 10 minutos.',
    'Expresó frustración adecuadamente cuando no pudo completar tarea.',
    'Muy alegre hoy. Cantó y bailó durante actividades musicales.',
    'Ansioso al inicio. Necesitó apoyo extra para sentirse cómodo.'
  ],
  language: [
    'Vocabulario en expansión. Usó 3 palabras nuevas hoy.',
    'Construye oraciones completas de 5-6 palabras.',
    'Dificultad para pronunciar la "r". Recomendar evaluación.',
    'Cuenta historias cortas coherentemente. Excelente expresión verbal.',
    'Tímido al hablar en grupo. Habla más en interacciones uno a uno.'
  ],
  general: [
    'Día excelente en general. Participó en todas las actividades.',
    'Se mostró cansado en la tarde. Necesitó tiempo de descanso adicional.',
    'Rechazó el almuerzo. Padre notificado para verificar si se siente bien.',
    'Muy concentrado hoy. Completó todas las tareas asignadas.',
    'Día desafiante. Rabietas frecuentes. Posible falta de sueño.'
  ]
};

const dailyNoteMoods = ['excellent', 'good', 'neutral', 'challenging', 'difficult'];
const energyLevels = ['high', 'medium', 'low'];

const dailyNoteTemplates = {
  highlights: [
    'Sesión muy productiva. Los niños estuvieron muy participativos.',
    'Actividad de arte fue un éxito. Todos disfrutaron pintando.',
    'Excelente comportamiento grupal durante la hora del cuento.',
    'Logré conectar individualmente con cada niño hoy.',
    'Nueva actividad de música fue muy bien recibida.'
  ],
  concerns: [
    'Dos niños mostraron signos de resfriado. Notifiqué a los padres.',
    'Conflictos más frecuentes de lo usual durante juego libre.',
    'Necesitamos más materiales para actividades de arte.',
    'Un niño muy callado hoy. Monitorear en próximos días.',
    null // A veces no hay concerns
  ]
};

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomTime(baseHour, variationMinutes = 30) {
  const minutes = Math.floor(Math.random() * variationMinutes);
  const hour = String(baseHour).padStart(2, '0');
  const minute = String(minutes).padStart(2, '0');
  return `${hour}:${minute}:00`;
}

function addMinutesToTime(timeStr, minutesToAdd) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
}

function getDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// =====================================================
// PROCESO PRINCIPAL
// =====================================================

try {
  // 1. Obtener staff members
  console.log('📋 Paso 1: Obteniendo personal de staff...');

  const staffMembers = db.prepare(`
    SELECT id, first_name, last_name
    FROM users
    WHERE role = 'staff'
  `).all();

  if (staffMembers.length === 0) {
    console.log('❌ No hay personal de staff en la base de datos.');
    console.log('💡 Primero necesitas crear usuarios con rol "staff".\n');
    process.exit(1);
  }

  console.log(`✓ Encontrados ${staffMembers.length} miembros del staff\n`);

  // 2. Obtener sesiones recientes (últimos 30 días)
  console.log('📋 Paso 2: Obteniendo sesiones recientes...');

  const sessions = db.prepare(`
    SELECT
      s.id,
      s.session_date,
      s.session_time,
      s.duration_minutes,
      s.subscription_id,
      s.conducted_by as staff_id,
      sub.child_name,
      cp.id as profile_id
    FROM sessions s
    LEFT JOIN subscriptions sub ON s.subscription_id = sub.id
    LEFT JOIN child_profiles cp ON sub.id = cp.subscription_id
    WHERE s.session_date >= DATE('now', '-30 days')
    AND s.session_date <= DATE('now')
    AND s.status != 'cancelled'
    ORDER BY s.session_date DESC, s.session_time
  `).all();

  console.log(`✓ Encontradas ${sessions.length} sesiones en los últimos 30 días\n`);

  if (sessions.length === 0) {
    console.log('⚠️  No hay sesiones recientes para generar datos.');
    console.log('💡 El sistema necesita tener sesiones programadas.\n');
  }

  // 3. Generar registros de asistencia
  console.log('📋 Paso 3: Generando registros de asistencia...\n');

  const insertAttendance = db.prepare(`
    INSERT OR IGNORE INTO attendance_records (
      session_id,
      check_in_time,
      check_out_time,
      checked_in_by,
      checked_out_by,
      is_late,
      late_minutes,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let attendanceCount = 0;

  sessions.forEach(session => {
    // 80% de las sesiones tienen check-in/out
    if (Math.random() < 0.8) {
      const isLate = Math.random() < 0.2; // 20% llegan tarde
      const lateMinutes = isLate ? Math.floor(Math.random() * 20) + 5 : 0;

      // Usar session_time como hora de inicio
      const sessionTime = session.session_time || '09:00:00';
      const durationMinutes = session.duration_minutes || 60;

      // Calcular hora de salida sumando la duración
      const checkInTime = `${session.session_date} ${addMinutesToTime(sessionTime, isLate ? lateMinutes : -5)}`;
      const checkOutTime = `${session.session_date} ${addMinutesToTime(sessionTime, durationMinutes + Math.floor(Math.random() * 10) - 5)}`;

      const staffId = session.staff_id || getRandomElement(staffMembers).id;

      const notes = isLate ? 'Llegó tarde - Tráfico reportado por el padre' : null;

      try {
        insertAttendance.run(
          session.id,
          checkInTime,
          checkOutTime,
          staffId,
          staffId,
          isLate ? 1 : 0,
          lateMinutes,
          notes
        );
        attendanceCount++;
        console.log(`   ✓ Asistencia registrada para ${session.child_name} (${session.session_date})`);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`   ✗ Error registrando asistencia:`, error.message);
        }
      }
    }
  });

  console.log(`\n✅ ${attendanceCount} registros de asistencia creados!\n`);

  // 4. Generar observaciones de niños
  console.log('📋 Paso 4: Generando observaciones de desarrollo...\n');

  const insertObservation = db.prepare(`
    INSERT INTO child_observations (
      child_profile_id,
      session_id,
      staff_id,
      observation_date,
      category,
      observation_text,
      is_important,
      shared_with_parent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let observationCount = 0;

  // Generar 2-3 observaciones por sesión con perfil
  sessions.filter(s => s.profile_id).forEach(session => {
    const numObservations = Math.floor(Math.random() * 2) + 1; // 1-2 observaciones

    for (let i = 0; i < numObservations; i++) {
      const category = getRandomElement(observationCategories);
      const observation = getRandomElement(observationTemplates[category]);
      const isImportant = Math.random() < 0.2; // 20% son importantes
      const sharedWithParent = Math.random() < 0.5; // 50% compartidas
      const staffId = session.staff_id || getRandomElement(staffMembers).id;

      try {
        insertObservation.run(
          session.profile_id,
          session.id,
          staffId,
          session.session_date,
          category,
          observation,
          isImportant ? 1 : 0,
          sharedWithParent ? 1 : 0
        );
        observationCount++;
      } catch (error) {
        console.error(`   ✗ Error creando observación:`, error.message);
      }
    }
  });

  console.log(`✅ ${observationCount} observaciones creadas!\n`);

  // 5. Generar notas diarias del staff
  console.log('📋 Paso 5: Generando notas diarias del staff...\n');

  const insertDailyNote = db.prepare(`
    INSERT OR IGNORE INTO daily_staff_notes (
      staff_id,
      note_date,
      note_text,
      mood,
      energy_level,
      highlights,
      concerns
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let notesCount = 0;

  // Generar notas para los últimos 7 días para cada staff
  staffMembers.forEach(staff => {
    for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
      const noteDate = getDateDaysAgo(daysAgo);
      const mood = getRandomElement(dailyNoteMoods);
      const energy = getRandomElement(energyLevels);
      const highlights = getRandomElement(dailyNoteTemplates.highlights);
      const concerns = getRandomElement(dailyNoteTemplates.concerns);

      const noteText = `Jornada del día. Estado general: ${mood}. ${highlights}${concerns ? ' ' + concerns : ''}`;

      try {
        insertDailyNote.run(
          staff.id,
          noteDate,
          noteText,
          mood,
          energy,
          highlights,
          concerns
        );
        notesCount++;
        console.log(`   ✓ Nota diaria para ${staff.first_name} ${staff.last_name} (${noteDate})`);
      } catch (error) {
        if (!error.message.includes('UNIQUE constraint')) {
          console.error(`   ✗ Error creando nota:`, error.message);
        }
      }
    }
  });

  console.log(`\n✅ ${notesCount} notas diarias creadas!\n`);

  // 6. Mostrar estadísticas finales
  console.log('📊 ESTADÍSTICAS FINALES:\n');

  const finalStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM attendance_records) as total_attendance,
      (SELECT COUNT(*) FROM child_observations) as total_observations,
      (SELECT COUNT(*) FROM daily_staff_notes) as total_notes,
      (SELECT COUNT(*) FROM child_profiles) as total_profiles
  `).get();

  console.log(`   • Registros de asistencia: ${finalStats.total_attendance}`);
  console.log(`   • Observaciones de desarrollo: ${finalStats.total_observations}`);
  console.log(`   • Notas diarias del staff: ${finalStats.total_notes}`);
  console.log(`   • Perfiles de niños: ${finalStats.total_profiles}`);
  console.log('');

  db.close();

  console.log('🎉 ¡Datos generados exitosamente!\n');
  console.log('💡 Los módulos de staff ahora tienen datos de ejemplo para probar.\n');

} catch (error) {
  console.error('\n❌ Error durante la generación:', error.message);
  console.error('\n📝 Stack trace:');
  console.error(error.stack);
  db.close();
  process.exit(1);
}
