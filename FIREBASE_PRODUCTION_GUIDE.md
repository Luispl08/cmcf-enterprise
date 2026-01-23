# Guía de Configuración de Firebase para Producción

Esta guía te ayudará a asegurar y preparar tu proyecto Firebase para el entorno de producción.

## 1. Reglas de Seguridad (Critical)

Actualmente, es probable que tus reglas estén en "modo prueba" (`allow read, write: if true;`). Esto es peligroso para producción.

### A. Firestore Database
Ve a **Firebase Console** -> **Firestore Database** -> **Rules** y reemplázalas por lo siguiente. Esto permite lectura pública pero solo permite escritura a usuarios autenticados (y administradores para ciertas colecciones si implementas roles).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para verificar si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }

    // Función auxiliar para verificar si es admin (asumiendo que guardas el rol en el token o en una colección de usuarios)
    // Por simplicidad inicial: cualquier usuario autenticado puede escribir sus propios datos, 
    // pero idealmente deberías restringir 'admin' solo a admins reales.
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    match /plans/{planId} {
      allow read: if true; // Planes públicos
      allow write: if isAuthenticated(); // Solo admins deberían poder crear planes (refinar luego)
    }
    
    match /competitions/{compId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    match /payments/{paymentId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || resource.data.userEmail == request.auth.token.email);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated(); // Idealmente solo admins
    }
    
    // Regla por defecto: Bloquear todo lo demás
    match /{document=**} {
      allow read: if true; // O restringir más si es necesario
      allow write: if isAuthenticated();
    }
  }
}
```

### B. Storage (Imágeness)
Ve a **Firebase Console** -> **Storage** -> **Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Permitir lectura a todos (para ver imágenes de perfil, logos, etc.)
      allow read: if true;
      // Solo usuarios autenticados pueden subir archivos
      allow write: if request.auth != null;
    }
  }
}
```

## 2. Dominios Autorizados (Authentication)

Para que el inicio de sesión funcione desde tu despliegue en Vercel (o cualquier otro dominio no-localhost):

1. Ve a **Firebase Console** -> **Authentication** -> **Settings**.
2. Busca la sección **Authorized domains**.
3. Haz clic en **Add domain**.
4. Agrega tu dominio de producción:
   - `cmcf-enterprise.vercel.app` (o el que te haya dado Vercel)
   - Tu dominio personalizado si compraste uno (ej. `cmcf.com`).

Si no haces esto, el login con Google o Email fallará en producción.

## 3. Índices (Indexes)

Tu proyecto ya tiene un archivo `firestore.indexes.json`. Esto optimiza las consultas complejas.
Si al navegar por la app ves errores en la consola que dicen "The query requires an index", Firebase te dará un link directo para crearlo.

Para desplegarlos desde tu local (si tienes Firebase CLI instalado):
```bash
firebase deploy --only firestore:indexes
```

## 4. Variables de Entorno

Asegúrate de que en Vercel (Settings -> Environment Variables) has configuarado todas las variables que tienes en `.env.local`.
Producción usa las mismas API Keys, pero las reglas de seguridad (Paso 1) son las que protegen tus datos, no la ocultación de las keys.

## 5. Correo (Opcional pero Recomendado)

Si usas Authentication por correo/password:
1. Ve a **Authentication** -> **Templates**.
2. Personaliza el correo de verificación y de restablecimiento de contraseña para que se vea profesional con tu nombre `CMCF Enterprise`.

---

¡Siguiendo estos pasos, tu aplicación será segura y funcional para usuarios reales!
