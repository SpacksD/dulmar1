// =====================================================
// SCRIPT SIMPLIFICADO: CREAR CHILD_PROFILES FALTANTES
// Solo crea profiles para subscripciones existentes
// Las sessions se generarán automáticamente al verificar pagos
// =====================================================

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'early_stimulation.db');
const db = new Database(dbPath);

console.log('📂 Usando base de datos:', dbPath);
console.log('🔄 Creando child_profiles faltantes...\n');

// Buscar subscripciones sin child_profile
const subscriptionsWithoutProfiles = db.prepare(`
  SELECT
    s.id as subscription_id,
    s.child_name,
    s.child_age,
    s.special_requests,
    s.user_id,
    s.status
  FROM subscriptions s
  LEFT JOIN child_profiles cp ON s.id = cp.subscription_id
  WHERE cp.id IS NULL
  AND s.status IN ('pending', 'active')
`).all();

console.log(`📋 Encontradas ${subscriptionsWithoutProfiles.length} subscripciones sin child_profile\n`);

if (subscriptionsWithoutProfiles.length === 0) {
  console.log('✅ Todos los child_profiles ya existen\n');
  db.close();
  process.exit(0);
}

// Mostrar lista de subscripciones a procesar
console.log('Subscripciones a procesar:');
subscriptionsWithoutProfiles.forEach(sub => {
  console.log(`   - ID ${sub.subscription_id}: ${sub.child_name} (${sub.child_age} años) - Status: ${sub.status}`);
});
console.log('');

// Crear child_profiles
const createProfileStmt = db.prepare(`
  INSERT INTO child_profiles (
    subscription_id, birth_date, special_needs,
    allergies, medical_conditions, medications,
    emergency_contacts, updated_by
  ) VALUES (?, ?, ?, '[]', '[]', '[]', '[]', ?)
`);

let created = 0;
let errors = 0;

for (const sub of subscriptionsWithoutProfiles) {
  try {
    // Calcular fecha de nacimiento aproximada basada en la edad
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - sub.child_age);
    const birthDateStr = birthDate.toISOString().split('T')[0];

    createProfileStmt.run(
      sub.subscription_id,
      birthDateStr,
      sub.special_requests || null,
      sub.user_id || 1 // Si no hay user_id, usar 1 (admin)
    );

    console.log(`   ✅ Profile creado para: ${sub.child_name} (Subscription ${sub.subscription_id})`);
    created++;
  } catch (error) {
    console.error(`   ❌ Error creando profile para subscription ${sub.subscription_id}:`, error.message);
    errors++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN');
console.log('='.repeat(60));
console.log(`✅ Child profiles creados: ${created}`);
if (errors > 0) {
  console.log(`❌ Errores: ${errors}`);
}
console.log('='.repeat(60));

console.log('\n💡 NOTA: Las sessions se generarán automáticamente cuando el');
console.log('   admin verifique los pagos de estas subscripciones.\n');

db.close();
console.log('🔒 Base de datos cerrada');
console.log('✅ Proceso completado\n');
