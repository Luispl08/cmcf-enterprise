# Guía: Subir Proyecto a GitHub y Desplegar en Vercel

## Parte 1: Subir a GitHub

### Paso 1: Crear repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Configura el repositorio:
   - **Repository name**: `cmcf-enterprise` (o el nombre que prefieras)
   - **Description**: "CMCF Fitness Center - Enterprise Management System"
   - **Visibility**: Elige **Private** o **Public**
   - ❌ **NO** marques "Initialize this repository with a README"
5. Haz clic en **"Create repository"**
6. **Copia la URL del repositorio** que aparece (algo como: `https://github.com/tu-usuario/cmcf-enterprise.git`)

---

### Paso 2: Inicializar Git en tu proyecto local

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
# Navega a la carpeta del proyecto
cd "c:\Users\luisa\OneDrive - MSFT\Desktop\proyectos en antigravity\cmcf-enterprise"

# Inicializa Git (si no está ya inicializado)
git init

# Configura tu nombre y email (si no lo has hecho antes)
git config user.name "Tu Nombre"
git config user.email "tu-email@ejemplo.com"
```

---

### Paso 3: Crear archivo .gitignore

Ya deberías tener un archivo `.gitignore`. Verifica que incluya:

```
node_modules/
.next/
.env.local
.env
*.log
.vercel
```

---

### Paso 4: Hacer el primer commit

```powershell
# Agregar todos los archivos
git add .

# Crear el commit inicial
git commit -m "Initial commit: CMCF Enterprise System"
```

---

### Paso 5: Conectar con GitHub y subir

```powershell
# Conectar con el repositorio remoto (usa la URL que copiaste en Paso 1)
git remote add origin https://github.com/TU-USUARIO/cmcf-enterprise.git

# Renombrar la rama a main (si es necesario)
git branch -M main

# Subir el código a GitHub
git push -u origin main
```

**Si te pide autenticación:**
- Usa tu **Personal Access Token** de GitHub (no tu contraseña)
- Para crear un token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token

---

## Parte 2: Desplegar en Vercel

### Paso 6: Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Selecciona **"Continue with GitHub"**
4. Autoriza a Vercel para acceder a tu cuenta de GitHub

---

### Paso 7: Importar proyecto desde GitHub

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Busca tu repositorio `cmcf-enterprise` en la lista
3. Haz clic en **"Import"**

---

### Paso 8: Configurar el proyecto

En la pantalla de configuración:

1. **Framework Preset**: Vercel debería detectar automáticamente **Next.js**
2. **Root Directory**: Déjalo en `./` (raíz del proyecto)
3. **Build Command**: `npm run build` (por defecto)
4. **Output Directory**: `.next` (por defecto)

---

### Paso 9: Configurar Variables de Entorno

⚠️ **MUY IMPORTANTE**: Debes agregar tus variables de entorno de Firebase.

1. Haz clic en **"Environment Variables"**
2. Agrega las siguientes variables (cópialas de tu archivo `.env.local`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

3. Para cada variable:
   - Pega el **nombre** en el campo "Key"
   - Pega el **valor** en el campo "Value"
   - Selecciona **Production**, **Preview**, y **Development**

---

### Paso 10: Desplegar

1. Haz clic en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel construye y despliega tu aplicación
3. ✅ Una vez completado, verás un mensaje de éxito con confeti 🎉

---

### Paso 11: Obtener el link de tu página

1. Verás tu URL de producción en la pantalla de éxito
2. Será algo como: `https://cmcf-enterprise.vercel.app`
3. Haz clic en **"Visit"** para ver tu sitio en vivo

---

## Configuraciones Adicionales (Opcional)

### Dominio Personalizado

Si quieres usar un dominio propio (ej: `cmcf.com`):

1. Ve a tu proyecto en Vercel
2. Haz clic en **"Settings"** → **"Domains"**
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar los DNS

---

### Configurar Firebase para Vercel

⚠️ **IMPORTANTE**: Debes autorizar el dominio de Vercel en Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Settings** → **Authorized domains**
4. Haz clic en **"Add domain"**
5. Agrega: `cmcf-enterprise.vercel.app` (o tu dominio de Vercel)

---

## Actualizaciones Futuras

Cada vez que hagas cambios en tu código:

```powershell
# Agregar cambios
git add .

# Crear commit
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

**Vercel automáticamente detectará los cambios y desplegará la nueva versión** 🚀

---

## Solución de Problemas

### Error: "Build failed"
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Vercel para ver el error específico

### Error: "Firebase not initialized"
- Asegúrate de que las variables de entorno estén correctas
- Verifica que el dominio de Vercel esté autorizado en Firebase

### Error: "Module not found"
- Asegúrate de que `package.json` tenga todas las dependencias
- Verifica que `node_modules` esté en `.gitignore`

---

## Tu Link Final

Una vez completado, tu aplicación estará disponible en:
**https://[tu-proyecto].vercel.app**

¡Listo! Tu aplicación CMCF Enterprise estará en línea y accesible desde cualquier lugar del mundo. 🌍
