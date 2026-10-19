# Comemos en Casa

App familiar de cocina para el móvil: menú semanal, lista de la compra, despensa, recetario y seguimiento personal de calorías y proteína. Funciona como una app instalada (PWA) y se sincroniza en directo entre todos los móviles.

- **Web:** GitHub Pages (gratis)
- **Datos, fotos y contraseña:** Supabase (plan gratuito)
- Sin compilación: HTML, CSS y JavaScript normales.

## Qué hace

| Parte | Para qué sirve |
|---|---|
| **Hoy** | Lo que come cada persona hoy, sus calorías y proteína, desayunos y picoteos, agua, día de entreno, avisos (poner en remojo, descongelar, tápers viejos). |
| **Menú** | Semana de lunes a domingo. Cada comida puede tener varios platos (plato + acompañamiento + postre), invitados, y cada persona puede comer otra cosa. Generador automático equilibrado. |
| **Compra** | Lista automática según el menú, quién come y lo que ya hay en casa. Ordenada por secciones de Mercadona, con precio aproximado. Se envía por WhatsApp. |
| **Casa** | Despensa (hay / falta), básicos que siempre deben estar y tápers en la nevera. |
| **Recetas** | Más de 100 recetas con pasos, temporizadores, modo cocinar, fotos, valoración por persona y recetas "solo para" alguien. |
| **Mi semana** | Calorías de la semana, evolución del peso y recetas favoritas de cada persona. |
| **Ajustes** | Tema claro u oscuro, nombre, icono y color de la app, perfiles, ingredientes que no gustan, días de compra, contraseña y copias de seguridad. |

## Estructura

```
index.html            página de la app
styles.css            diseño (tema claro y oscuro)
config.js             conexión con Supabase
data.js               recetas, ingredientes, precios y secciones
store.js              guardado y sincronización (Supabase, con cola sin conexión)
app.js                pantallas y lógica
sw.js                 funcionamiento sin conexión
manifest.webmanifest  datos para instalarla en el móvil
supabase/schema.sql   tablas, seguridad y almacenamiento de fotos
vendor/supabase.js    librería oficial de Supabase (v2.117.2)
```

Los datos de la familia (perfiles, menús, registros) **no están en este repositorio**: viven en Supabase y solo se ven con la contraseña.

## Puesta en marcha

### 1. Supabase
1. Crea un proyecto nuevo (región Europa, por ejemplo Frankfurt o Irlanda).
2. **SQL Editor › New query**: pega `supabase/schema.sql` y pulsa **Run**.
3. **Authentication › Users › Add user › Create new user**: correo `familia@comemosencasa.app` (el de `familyEmail` en `config.js`), la contraseña común y marca **Auto Confirm User**.
4. **Authentication › Sign In / Providers**: desactiva **Allow new users to sign up**. Es importante: así nadie más puede crearse una cuenta.
5. **Project Settings › API Keys**: copia la **Project URL** y la clave **publishable** (o la *anon* si sale como *legacy*).
6. (Opcional) Carga los datos de la familia: **SQL Editor** › pega `datos-familia/seed.sql` (está fuera de esta carpeta, **no lo subas a GitHub**) › **Run**.

### 2. config.js
Pon la URL y la clave del paso 5:
```js
window.APP_CONFIG = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseKey: 'sb_publishable_...',
  familyEmail: 'familia@comemosencasa.app'
};
```
Esa clave es pública por diseño; la protección la dan la contraseña y las reglas RLS del paso 1.

### 3. GitHub Pages
1. Crea un repositorio **público** (Pages gratis lo necesita) y sube todo el contenido de esta carpeta a la rama `main`, incluido el archivo oculto `.nojekyll`.
2. **Settings › Pages › Build and deployment › Deploy from a branch › main / (root) › Save**.
3. En uno o dos minutos la app estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

### 4. En cada móvil
Abre el enlace, pon la contraseña, elige quién eres y añádela a la pantalla de inicio (iPhone: Safari › Compartir › Añadir a pantalla de inicio; Android: Chrome › ⋮ › Instalar aplicación).

## Cambiar la contraseña común

Desde la app: **Ajustes › Contraseña de la familia**. Los móviles que ya han entrado siguen dentro.

## APIs externas

- **Open Food Facts** (gratis, sin clave): buscar productos por nombre o código de barras para apuntar calorías de lo que se pica.
- **Fotos**: cada receta admite una foto hecha con el móvil, guardada en Supabase Storage (1 GB gratis).
- Para buscar fotos automáticamente se podría añadir Pexels o Unsplash (gratis con clave). Para recetas en inglés existen TheMealDB o Spoonacular.

## Actualizar la app

Editar los archivos y subirlos a la rama `main`; GitHub Pages publica en uno o dos minutos. Si cambias archivos de la app, sube también el número de versión `V` en `sw.js` para que los móviles descarguen lo nuevo.
