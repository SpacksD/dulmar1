// =====================================================
// SCRIPT PARA RETROALIMENTAR DATOS DE STAFF
// Genera perfiles de niños basado en suscripciones existentes
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);

console.log('🔄 Iniciando retroalimentación de datos de staff...\n');

// =====================================================
// DATOS DE EJEMPLO PARA PERFILES
// =====================================================

const allergiesExamples = [
  [
    { allergen: 'Lactosa', severity: 'moderate', notes: 'Puede causar malestar estomacal' },
    { allergen: 'Maní', severity: 'severe', notes: 'Reacción severa - Tiene EpiPen' }
  ],
  [
    { allergen: 'Polen', severity: 'mild', notes: 'Estornudos y congestión en primavera' }
  ],
  [
    { allergen: 'Huevo', severity: 'moderate', notes: 'Evitar alimentos con huevo' }
  ],
  [], // Sin alergias
  [
    { allergen: 'Gluten', severity: 'moderate', notes: 'Enfermedad celíaca diagnosticada' }
  ]
];

const medicalConditionsExamples = [
  [
    { condition: 'Asma', treatment: 'Inhalador Salbutamol', notes: 'Usar antes de actividad física' }
  ],
  [],
  [
    { condition: 'Diabetes Tipo 1', treatment: 'Insulina', notes: 'Monitorear niveles de glucosa' }
  ],
  [],
  [
    { condition: 'TDAH', treatment: 'Metilfenidato 10mg', notes: 'Tomar por la mañana' }
  ]
];

const medicationsExamples = [
  [],
  [
    { medication: 'Omeprazol', dosage: '10mg', frequency: '1 vez al día', notes: 'Tomar en ayunas' }
  ],
  [],
  [
    { medication: 'Paracetamol', dosage: '250mg', frequency: 'Según necesidad', notes: 'Solo para fiebre o dolor' }
  ],
  []
];

const emergencyContactsExamples = [
  [
    { name: 'María González', relation: 'Abuela', phone: '809-555-0101', is_primary: true, notes: 'Vive cerca del centro' },
    { name: 'Juan Pérez', relation: 'Tío', phone: '809-555-0102', is_primary: false, notes: 'Disponible en emergencias' }
  ],
  [
    { name: 'Ana Martínez', relation: 'Tía', phone: '809-555-0201', is_primary: true, notes: 'Contactar primero' }
  ],
  [
    { name: 'Carlos Rodríguez', relation: 'Abuelo', phone: '809-555-0301', is_primary: true, notes: '' },
    { name: 'Rosa Santos', relation: 'Vecina', phone: '809-555-0302', is_primary: false, notes: 'Solo si familia no responde' }
  ],
  [
    { name: 'Pedro Jiménez', relation: 'Padrino', phone: '809-555-0401', is_primary: true, notes: 'Autorizado para recoger' }
  ],
  [
    { name: 'Laura Fernández', relation: 'Hermana mayor', phone: '809-555-0501', is_primary: true, notes: 'Estudiante universitaria' }
  ]
];

const dietaryRestrictionsExamples = [
  'Vegetariano - No consume carne ni pescado',
  'Sin azúcares añadidos por recomendación médica',
  null,
  'Intolerancia a la lactosa - Usar leche de almendras',
  null
];

const favoriteActivitiesExamples = [
  'Le encanta pintar y dibujar, especialmente animales. También disfruta de juegos con bloques de construcción.',
  'Apasionado por los dinosaurios y la música. Toca el xilófono.',
  'Le gusta mucho correr, jugar fútbol y actividades al aire libre.',
  'Disfruta de la lectura de cuentos y juegos de roles (ser doctor o maestro).',
  'Le encanta bailar, cantar y jugar con plastilina.'
];

const behavioralNotesExamples = [
  'Muy sociable y amigable. A veces necesita recordatorios para compartir juguetes.',
  'Un poco tímido al principio pero se adapta bien. Le gusta la rutina.',
  'Muy activo y enérgico. Necesita actividades físicas para canalizar su energía.',
  'Muy independiente. Prefiere jugar solo a veces. Excelente seguimiento de instrucciones.',
  'Sensible y empático. Se altera con ruidos fuertes. Necesita ambiente tranquilo.'
];

const specialNeedsExamples = [
  null,
  'Terapia del habla 2 veces por semana - Dificultad con pronunciación de algunas letras',
  null,
  'Terapia ocupacional - Trabajando en habilidades motoras finas',
  null
];

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function generateBirthDate(childAge) {
  if (!childAge) {
    // Si no hay edad, generar entre 1-6 años
    childAge = Math.floor(Math.random() * 6) + 1;
  }

  const today = new Date();
  const birthYear = today.getFullYear() - childAge;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;

  return `${birthYear}-${String(birthMonth + 1).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
}

// =====================================================
// PROCESO PRINCIPAL
// =====================================================

try {
  // 1. Obtener todas las suscripciones activas
  console.log('📋 Paso 1: Obteniendo suscripciones activas...');

  const subscriptions = db.prepare(`
    SELECT
      s.id,
      s.child_name,
      s.child_age,
      s.user_id,
      u.email as parent_email,
      u.first_name || ' ' || u.last_name as parent_name,
      u.phone as parent_phone
    FROM subscriptions s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.status = 'active'
    ORDER BY s.id
  `).all();

  console.log(`✓ Encontradas ${subscriptions.length} suscripciones activas\n`);

  if (subscriptions.length === 0) {
    console.log('⚠️  No hay suscripciones activas. El script terminará.');
    console.log('💡 Primero necesitas que un padre contrate servicios desde el panel de cliente.\n');
    process.exit(0);
  }

  // 2. Verificar cuáles ya tienen perfil
  console.log('📋 Paso 2: Verificando perfiles existentes...');

  const existingProfiles = db.prepare(`
    SELECT subscription_id FROM child_profiles
  `).all();

  const existingSubIds = new Set(existingProfiles.map(p => p.subscription_id));

  const subscriptionsWithoutProfile = subscriptions.filter(s => !existingSubIds.has(s.id));

  console.log(`✓ ${existingProfiles.length} perfiles ya existen`);
  console.log(`✓ ${subscriptionsWithoutProfile.length} suscripciones necesitan perfil\n`);

  if (subscriptionsWithoutProfile.length === 0) {
    console.log('✅ Todos los perfiles ya están creados!\n');

    // Mostrar resumen
    console.log('📊 RESUMEN ACTUAL:');
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT cp.id) as total_profiles,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN s.session_date = DATE('now') THEN s.id END) as today_sessions
      FROM child_profiles cp
      LEFT JOIN subscriptions sub ON cp.subscription_id = sub.id
      LEFT JOIN sessions s ON sub.id = s.subscription_id
    `).get();

    console.log(`   • Perfiles de niños: ${stats.total_profiles}`);
    console.log(`   • Sesiones totales: ${stats.total_sessions}`);
    console.log(`   • Sesiones hoy: ${stats.today_sessions}`);
    console.log('');

    process.exit(0);
  }

  // 3. Crear perfiles para suscripciones sin perfil
  console.log('📋 Paso 3: Creando perfiles de niños...\n');

  const insertProfile = db.prepare(`
    INSERT INTO child_profiles (
      subscription_id,
      photo_url,
      birth_date,
      allergies,
      medical_conditions,
      medications,
      special_needs,
      emergency_contacts,
      dietary_restrictions,
      favorite_activities,
      behavioral_notes,
      milestones,
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let createdCount = 0;

  subscriptionsWithoutProfile.forEach((sub, index) => {
    const birthDate = generateBirthDate(sub.child_age);
    const allergies = JSON.stringify(getRandomElement(allergiesExamples));
    const medicalConditions = JSON.stringify(getRandomElement(medicalConditionsExamples));
    const medications = JSON.stringify(getRandomElement(medicationsExamples));
    const emergencyContacts = JSON.stringify(getRandomElement(emergencyContactsExamples));
    const specialNeeds = getRandomElement(specialNeedsExamples);
    const dietaryRestrictions = getRandomElement(dietaryRestrictionsExamples);
    const favoriteActivities = getRandomElement(favoriteActivitiesExamples);
    const behavioralNotes = getRandomElement(behavioralNotesExamples);

    // Milestones de ejemplo
    const milestones = JSON.stringify([
      {
        milestone: 'Primeros pasos',
        date_achieved: `${new Date(birthDate).getFullYear() + 1}-06-15`,
        category: 'physical',
        notes: 'Caminó sin ayuda por primera vez'
      },
      {
        milestone: 'Primeras palabras',
        date_achieved: `${new Date(birthDate).getFullYear() + 1}-03-20`,
        category: 'language',
        notes: 'Dijo "mamá" y "papá"'
      }
    ]);

    try {
      insertProfile.run(
        sub.id,                    // subscription_id
        null,                      // photo_url
        birthDate,                 // birth_date
        allergies,                 // allergies
        medicalConditions,         // medical_conditions
        medications,               // medications
        specialNeeds,              // special_needs
        emergencyContacts,         // emergency_contacts
        dietaryRestrictions,       // dietary_restrictions
        favoriteActivities,        // favorite_activities
        behavioralNotes,           // behavioral_notes
        milestones,                // milestones
        sub.user_id                // updated_by
      );

      createdCount++;
      console.log(`   ✓ Perfil creado para: ${sub.child_name} (Suscripción #${sub.id})`);

    } catch (error) {
      console.error(`   ✗ Error creando perfil para ${sub.child_name}:`, error.message);
    }
  });

  console.log(`\n✅ ${createdCount} perfiles creados exitosamente!\n`);

  // 4. Mostrar estadísticas finales
  console.log('📊 ESTADÍSTICAS FINALES:\n');

  const finalStats = db.prepare(`
    SELECT
      COUNT(DISTINCT cp.id) as total_profiles,
      COUNT(DISTINCT s.id) as total_sessions,
      COUNT(DISTINCT CASE WHEN s.session_date = DATE('now') THEN s.id END) as today_sessions,
      COUNT(DISTINCT CASE WHEN s.session_date > DATE('now') THEN s.id END) as future_sessions
    FROM child_profiles cp
    LEFT JOIN subscriptions sub ON cp.subscription_id = sub.id
    LEFT JOIN sessions s ON sub.id = s.subscription_id
  `).get();

  console.log(`   📋 Perfiles de niños: ${finalStats.total_profiles}`);
  console.log(`   📅 Sesiones totales: ${finalStats.total_sessions}`);
  console.log(`   🕐 Sesiones hoy: ${finalStats.today_sessions}`);
  console.log(`   📆 Sesiones futuras: ${finalStats.future_sessions}`);

  // Mostrar perfiles con alertas médicas
  const profilesWithAlerts = db.prepare(`
    SELECT
      cp.id,
      sub.child_name,
      cp.allergies,
      cp.medical_conditions
    FROM child_profiles cp
    JOIN subscriptions sub ON cp.subscription_id = sub.id
    WHERE (cp.allergies != '[]' AND cp.allergies IS NOT NULL)
       OR (cp.medical_conditions != '[]' AND cp.medical_conditions IS NOT NULL)
  `).all();

  console.log(`\n   ⚠️  Niños con alertas médicas: ${profilesWithAlerts.length}`);

  if (profilesWithAlerts.length > 0) {
    console.log('\n   Detalles de alertas:');
    profilesWithAlerts.forEach(p => {
      const allergies = JSON.parse(p.allergies || '[]');
      const conditions = JSON.parse(p.medical_conditions || '[]');

      console.log(`   • ${p.child_name}:`);
      if (allergies.length > 0) {
        allergies.forEach(a => {
          console.log(`      - Alergia: ${a.allergen} (${a.severity})`);
        });
      }
      if (conditions.length > 0) {
        conditions.forEach(c => {
          console.log(`      - Condición: ${c.condition}`);
        });
      }
    });
  }

  console.log('\n🎉 ¡Proceso completado exitosamente!\n');
  console.log('💡 Ahora puedes:');
  console.log('   1. Iniciar sesión como staff (staff@dulmar.com)');
  console.log('   2. Ver el dashboard en /staff/dashboard');
  console.log('   3. Gestionar asistencia en /staff/attendance');
  console.log('   4. Ver perfiles de niños en /staff/children\n');

} catch (error) {
  console.error('❌ Error durante el proceso:', error);
  console.error(error.stack);
} finally {
  db.close();
}
