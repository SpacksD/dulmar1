# Cambios: Acceso de Admin a Módulos de Staff

## 📋 Resumen

Se han implementado cambios para que el **administrador pueda acceder a los módulos de staff** (Asistencia y Perfiles de Niños) **pero NO al Dashboard de staff**.

---

## 🔧 Cambios Realizados

### 1. **Modificación del Sidebar de Staff** (`src/components/staff/StaffSidebar.tsx`)

#### Cambios:
- ✅ Agregado filtrado de menú basado en rol
- ✅ Dashboard solo visible para `staff`
- ✅ Asistencia y Niños visibles para `staff` y `admin`
- ✅ Agenda solo visible para `staff`
- ✅ Título dinámico: "Panel de Gestión" para admin, "Staff Panel" para staff

#### Código:
```typescript
// Define menu items based on user role
const allMenuItems = [
  { href: '/staff/dashboard', icon: Home, label: 'Dashboard', roles: ['staff'] },
  { href: '/staff/attendance', icon: CheckCircle, label: 'Asistencia', roles: ['staff', 'admin'] },
  { href: '/staff/children', icon: Users, label: 'Niños', roles: ['staff', 'admin'] },
  { href: '/staff/schedule', icon: Calendar, label: 'Agenda', roles: ['staff'] },
];

// Filter menu items based on user role
const menuItems = allMenuItems.filter(item =>
  item.roles.includes(user.role || '')
);
```

---

### 2. **Protección del Dashboard de Staff** (`src/app/staff/dashboard/page.tsx`)

#### Cambios:
- ✅ Agregado redirect automático para admins → `/staff/attendance`
- ✅ Solo staff puede ver y cargar datos del dashboard

#### Código:
```typescript
const { data: session, status } = useSession();
const router = useRouter();

// Redirect admins to attendance page
useEffect(() => {
  if (status === 'loading') return;

  if (session?.user?.role === 'admin') {
    router.push('/staff/attendance');
  }
}, [session, status, router]);

useEffect(() => {
  // Only fetch data if user is staff
  if (session?.user?.role === 'staff') {
    fetchDashboardData();
  }
}, [session]);
```

---

### 3. **Protección de la API del Dashboard** (`src/app/api/staff/dashboard/today/route.ts`)

#### Cambios:
- ✅ API solo accesible para `staff`
- ✅ Admins reciben error 403 si intentan acceder

#### Código:
```typescript
// Dashboard is only for staff, not admin
if (session.user.role !== 'staff') {
  return NextResponse.json(
    { success: false, error: 'Solo el staff puede acceder al dashboard' },
    { status: 403 }
  );
}

// Get staff ID from session (always staff at this point)
const staffId = parseInt(session.user.id);
```

---

### 4. **Enlace en el Panel de Admin** (`src/app/admin/layout.tsx`)

#### Cambios:
- ✅ Agregado enlace "Gestión de Staff" en el menú de admin
- ✅ Separador visual antes del enlace
- ✅ Icono `UserCheck` para el enlace

#### Código:
```typescript
const adminMenuItems: MenuItem[] = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/servicios', icon: Settings, label: 'Servicios' },
  { href: '/admin/promociones', icon: Gift, label: 'Promociones' },
  { href: '/admin/horarios', icon: Clock, label: 'Gestión de Horarios' },
  { href: '/admin/reservas', icon: Calendar, label: 'Reservas' },
  { href: '/admin/pagos', icon: CreditCard, label: 'Pagos' },
  { href: '/admin/facturacion-mensual', icon: FileText, label: 'Facturación Mensual' },
  { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { href: '/staff/attendance', icon: UserCheck, label: 'Gestión de Staff', separator: true },
];
```

---

## 📊 Matriz de Permisos

| Módulo | Staff | Admin | Descripción |
|--------|-------|-------|-------------|
| `/staff/dashboard` | ✅ Ver | ❌ Redirect a Asistencia | Dashboard personal del staff |
| `/staff/attendance` | ✅ Ver | ✅ Ver | Control de asistencia de niños |
| `/staff/children` | ✅ Ver | ✅ Ver | Perfiles completos de niños |
| `/staff/schedule` | ✅ Ver | ❌ No visible | Agenda semanal (próximamente) |

---

## 🎯 Flujo de Navegación

### Para Staff:
1. Login con cuenta de staff
2. Acceso al **Staff Panel**
3. Menú completo visible:
   - ✅ Dashboard
   - ✅ Asistencia
   - ✅ Niños
   - ✅ Agenda

### Para Admin:
1. Login con cuenta de admin
2. Acceso al **Panel de Admin**
3. En el menú de admin, al final aparece:
   - ✅ **Gestión de Staff** (enlace a `/staff/attendance`)
4. Al hacer click, accede al panel de staff con menú limitado:
   - ❌ Dashboard (no visible)
   - ✅ Asistencia
   - ✅ Niños
   - ❌ Agenda (no visible)
5. Si intenta acceder directamente a `/staff/dashboard`, es redirigido a `/staff/attendance`

---

## 🧪 Testing

### Casos de Prueba:

1. **Admin intenta acceder a Dashboard de Staff**
   - URL: `/staff/dashboard`
   - Resultado esperado: Redirect automático a `/staff/attendance`
   - ✅ Implementado

2. **Admin accede a Asistencia**
   - URL: `/staff/attendance`
   - Resultado esperado: Ve lista completa de asistencia
   - ✅ Implementado

3. **Admin accede a Perfiles de Niños**
   - URL: `/staff/children`
   - Resultado esperado: Ve todos los perfiles
   - ✅ Implementado

4. **Staff accede a Dashboard**
   - URL: `/staff/dashboard`
   - Resultado esperado: Ve su dashboard personal
   - ✅ Implementado

5. **Sidebar muestra opciones correctas**
   - Para staff: 4 opciones (Dashboard, Asistencia, Niños, Agenda)
   - Para admin: 2 opciones (Asistencia, Niños)
   - ✅ Implementado

---

## 📁 Archivos Modificados

```
src/
├── components/
│   └── staff/
│       └── StaffSidebar.tsx           ✏️ Modificado
├── app/
│   ├── staff/
│   │   └── dashboard/
│   │       └── page.tsx               ✏️ Modificado
│   ├── admin/
│   │   └── layout.tsx                 ✏️ Modificado
│   └── api/
│       └── staff/
│           └── dashboard/
│               └── today/
│                   └── route.ts       ✏️ Modificado
```

---

## 🚀 Próximos Pasos (Opcional)

1. **Agregar logs de auditoría**
   - Registrar cuando admin accede a módulos de staff
   - Útil para compliance y seguridad

2. **Personalizar vista para admin**
   - Mostrar datos agregados de todos los staff
   - Agregar filtros por staff member

3. **Agregar permisos granulares**
   - Permitir configurar qué staff puede ver qué niños
   - Roles más específicos (staff junior, staff senior, etc.)

---

## ✅ Verificación

Para verificar que todo funciona correctamente:

1. **Iniciar servidor**:
   ```bash
   npm run dev
   ```

2. **Probar con cuenta de admin**:
   - Login: `admin@dulmar.com`
   - Verificar menú de admin tiene "Gestión de Staff"
   - Click en "Gestión de Staff"
   - Verificar que solo ve Asistencia y Niños
   - Intentar acceder a `/staff/dashboard` manualmente
   - Verificar redirect automático

3. **Probar con cuenta de staff**:
   - Login: `staff@dulmar.com`
   - Verificar que ve las 4 opciones en el menú
   - Verificar que puede acceder al Dashboard

---

## 📝 Notas Importantes

- ⚠️ El layout de staff (`src/app/staff/layout.tsx`) sigue permitiendo acceso a admin. Esto es intencional ya que la protección específica se hace a nivel de página y API.

- ⚠️ La API del dashboard (`/api/staff/dashboard/today`) ahora solo acepta peticiones de staff. Si necesitas que admin vea estos datos, deberás crear un endpoint separado.

- ✅ Las APIs de Asistencia y Perfiles de Niños ya permitían acceso a ambos roles, por lo que no fue necesario modificarlas.

---

**Fecha de implementación:** Noviembre 2025
**Versión:** 1.0
