# Guía de Inicio Local - CMCF Enterprise

Esta guía te ayudará a ejecutar la aplicación **CMCF Enterprise** en tu entorno local.

## 1. Prerrequisitos
Asegúrate de tener instalado:
- **Node.js**: v18 o superior.
- **Git**: Para clonar el repositorio.

## 2. Instalación
Si aún no has descargado las dependencias, abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

## 3. Configuración de Entorno (.env.local)
El sistema puede funcionar en dos modos:
1.  **Modo Mock (Desarrollo)**: No requiere conexión real a Firebase. Usa datos simulados.
2.  **Modo Online (Producción)**: Se conecta a tu base de datos Firebase real.

Para iniciar, asegúrate de tener un archivo `.env.local` en la raíz.
Si quieres usar el **Modo Mock**, simplemente no incluyas las keys de Firebase o déjalas vacías.
Si quieres usar el **Modo Online**, llena las siguientes variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 4. Iniciar el Servidor de Desarrollo
Ejecuta el siguiente comando para iniciar la app:

```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000).

## 5. Credenciales de Prueba (Modo Mock)
Si estás en Modo Mock (sin conexión a Firebase), usa estas credenciales para probar:

### Administrador
- **Email**: admin@cmcf.com
- **Contraseña**: cmcfadmin
- **Acceso**: Panel de Control total (`/admin`), Gestión de Usuarios, Pagos, Clases.

### Usuario Regular
- **Email**: john@connor.com
- **Contraseña**: 123456
- **Acceso**: Dashboard de Usuario (`/dashboard`), Perfil, Pagos.

## 6. Solución de Problemas Comunes
- **"Firebase Keys Missing"**: Revisa la consola del navegador (F12). Si ves una advertencia amarilla, estás en modo Mock. Es normal si no has configurado el .env.local.
- **Errores de Red**: Asegúrate de tener conexión a internet si estás intentando usar el Modo Online.

---
**¿Listo para desplegar?** Revisa el archivo `deployment_guide.md` para subir tu app a Vercel.
