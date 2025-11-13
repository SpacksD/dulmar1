# Guía de Configuración SEO - Centro Infantil DULMAR

## ✅ Optimizaciones Implementadas

Se han implementado las siguientes optimizaciones SEO para mejorar la visibilidad en buscadores:

### 1. **Archivos Base de SEO**
- ✅ `public/robots.txt` - Control de indexación de buscadores
- ✅ `src/app/sitemap.ts` - Sitemap dinámico que incluye todas las páginas y servicios
- ✅ `src/lib/structured-data.ts` - Helpers para Schema.org (datos estructurados)

### 2. **Metadata Optimizada**
- ✅ Layout principal con metadata completa (títulos, descripciones, Open Graph, Twitter Cards)
- ✅ Metadata dinámica para páginas de servicios individuales
- ✅ Metadata específica para página de servicios
- ✅ Metadata específica para página de contacto
- ✅ URLs canónicas en todas las páginas

### 3. **Datos Estructurados (Schema.org)**
- ✅ LocalBusiness/ChildCare schema en página principal
- ✅ Organization schema para branding
- ✅ Service schema en páginas de servicios individuales
- ✅ Breadcrumb schema para navegación

### 4. **Optimización de Imágenes**
- ✅ Componente ServiceImage migrado a Next.js Image
- ✅ Optimización automática de imágenes (WebP, AVIF)
- ✅ Lazy loading nativo
- ✅ Placeholders blur para mejor UX
- ✅ Configuración de next.config.ts para imágenes

### 5. **Performance y Seguridad**
- ✅ Headers de seguridad configurados
- ✅ DNS Prefetch habilitado
- ✅ Remoción de console.logs en producción

---

## 📋 Pasos Pendientes para Completar la Configuración

### 1. **Configurar Variables de Entorno**

Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` y actualiza:

```env
NEXT_PUBLIC_BASE_URL=https://www.centrodulmar.com
```

### 2. **Completar Información del Negocio en layout.tsx**

Abre `src/app/layout.tsx` y actualiza los siguientes campos:

```typescript
// Líneas 85-104
telephone: "+51-XXX-XXX-XXX", // ⚠️ Cambiar por tu número real
email: "contacto@dulmar.com", // ⚠️ Cambiar por tu email real

// Descomentar y completar dirección:
address: {
  streetAddress: "Av. Principal 123", // ⚠️ Tu dirección
  addressLocality: "Lima", // ⚠️ Tu ciudad
  addressRegion: "Lima", // ⚠️ Tu región
  postalCode: "15001", // ⚠️ Tu código postal
  addressCountry: "PE",
},

// Descomentar y completar horarios:
openingHours: [
  "Monday:08:00-18:00",
  "Tuesday:08:00-18:00",
  "Wednesday:08:00-18:00",
  "Thursday:08:00-18:00",
  "Friday:08:00-18:00",
  "Saturday:09:00-13:00",
],

// Descomentar y agregar redes sociales (líneas 114-117):
sameAs: [
  "https://www.facebook.com/tuPaginaFacebook",
  "https://www.instagram.com/tuInstagram",
],
```

### 3. **Registrar el Sitio en Google Search Console**

1. Ve a [Google Search Console](https://search.google.com/search-console)
2. Agrega tu propiedad: `https://www.centrodulmar.com`
3. Verifica la propiedad (método recomendado: archivo HTML o DNS)
4. Una vez verificado, copia el código de verificación
5. En `src/app/layout.tsx`, línea 74, descomenta y agrega:

```typescript
verification: {
  google: "tu-codigo-de-verificacion-google",
},
```

6. Envía tu sitemap en Search Console:
   - URL: `https://www.centrodulmar.com/sitemap.xml`

### 4. **Registrar en Google My Business (Opcional pero Recomendado)**

Para mejorar el SEO local:

1. Ve a [Google My Business](https://www.google.com/business/)
2. Registra tu centro infantil
3. Completa toda la información (dirección, horarios, fotos, servicios)
4. Verifica tu negocio (generalmente por correo postal)

### 5. **Optimizar Imágenes Existentes**

Asegúrate de que todas las imágenes tengan:

- **Alt text descriptivo**: Describe qué muestra la imagen
- **Tamaño apropiado**: No subas imágenes más grandes de lo necesario
- **Formato correcto**: JPG para fotos, PNG para logos/gráficos

### 6. **Actualizar Meta Titles y Descriptions en la Base de Datos**

En la base de datos, tabla `services`, completa los campos:

- `meta_title` - Título optimizado para SEO (50-60 caracteres)
- `meta_description` - Descripción optimizada (150-160 caracteres)

Ejemplo:
```sql
UPDATE services
SET meta_title = 'Estimulación Temprana 0-2 años | Centro DULMAR',
    meta_description = 'Programa de estimulación temprana para bebés de 0 a 2 años. Desarrollo cognitivo, motor y social con profesionales especializados.'
WHERE id = 1;
```

### 7. **Configurar Analytics (Opcional)**

Para medir el tráfico y el rendimiento SEO:

1. Crea una cuenta en [Google Analytics](https://analytics.google.com/)
2. Crea una propiedad GA4
3. Copia el ID de medición (G-XXXXXXXXXX)
4. En `.env.local` agrega:
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
5. Instala el paquete:
   ```bash
   npm install @next/third-parties
   ```
6. Agrega Google Analytics al layout principal

---

## 🚀 Despliegue y Verificación

### Antes de Desplegar

1. Verifica que `.env.local` no se suba a git (está en `.gitignore`)
2. Configura las variables de entorno en tu plataforma de hosting (Vercel, Netlify, etc.)
3. Ejecuta un build de producción local:
   ```bash
   npm run build
   ```

### Después del Despliegue

1. **Verifica el sitemap**: Visita `https://www.centrodulmar.com/sitemap.xml`
2. **Verifica robots.txt**: Visita `https://www.centrodulmar.com/robots.txt`
3. **Prueba las meta tags**: Usa [Meta Tags Debugger](https://metatags.io/)
4. **Verifica Open Graph**: Usa [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
5. **Prueba Twitter Cards**: Usa [Twitter Card Validator](https://cards-dev.twitter.com/validator)
6. **Verifica Schema.org**: Usa [Google Rich Results Test](https://search.google.com/test/rich-results)

### Monitoreo Continuo

1. **Google Search Console**: Revisa semanalmente
   - Errores de indexación
   - Rendimiento de búsqueda
   - Coverage (cobertura)
   - Experiencia de página

2. **Google Analytics**: Monitorea
   - Tráfico orgánico
   - Páginas más visitadas
   - Tasa de rebote
   - Tiempo en sitio

3. **PageSpeed Insights**: Optimiza regularmente
   - Core Web Vitals
   - Performance score
   - SEO score

---

## 📊 Métricas de Éxito

Después de 1-2 meses, deberías ver mejoras en:

- ✅ Posicionamiento en búsquedas de "centro infantil [tu ciudad]"
- ✅ Aparición en Google Maps para búsquedas locales
- ✅ Aumento en tráfico orgánico
- ✅ Rich snippets en resultados de búsqueda
- ✅ Mejor CTR (Click-Through Rate) en resultados

---

## 🔍 Palabras Clave Recomendadas

Asegúrate de usar estas palabras clave en tu contenido:

### Primarias
- Centro infantil [ciudad]
- Estimulación temprana [ciudad]
- Educación inicial
- Guardería [ciudad]
- Cuidado infantil

### Secundarias
- Desarrollo infantil 0-6 años
- Programa de estimulación temprana
- Clases para bebés
- Talleres para niños
- Nido [ciudad]

### Long-tail (específicas)
- "mejor centro de estimulación temprana en [ciudad]"
- "clases de estimulación para bebés de 6 meses"
- "guardería con programa de desarrollo infantil"

---

## 📞 Soporte

Si tienes preguntas sobre la implementación SEO, revisa:

- [Next.js SEO Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search/docs)
- [Schema.org Documentation](https://schema.org/)

---

**Última actualización**: 2025-11-13
**Estado**: ✅ Implementación Base Completa | ⚠️ Configuración Final Pendiente
