# Sistema de Gestión de Cocheras Hospitalario

Aplicación profesional para la gestión de aparcamientos, diseñada para Administradores (Web) y Porteros (Móvil First).

## Características
- **Modo Portero (Móvil)**: Escaneo OCR de placas, registro rápido, interfaz optimizada.
- **Modo Administrador (Web)**: Dashboard en tiempo real, gestión de personal, reportes.
- **Tecnología**: React + Vite + Firebase (Auth, Firestore).
- **Diseño**: UI Limpia, Profesional y Responsiva.

## Configuración Inicial

### 1. Firebase Setup
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Crea un nuevo proyecto.
3. Habilita **Authentication** y activa el proveedor **Email/Password**.
4. Habilita **Firestore Database** en modo de prueba (o producción con reglas adecuadas).
5. Ve a Configuración del Proyecto -> General -> Tus apps -> Web (</>).
6. Copia la configuración (`const firebaseConfig = ...`).
7. Abre `src/firebase.js` y pega tus credenciales.

### 2. Crear Primer Usuario (Administrador)
Desde la consola de Firebase > Authentication > Users:
1. "Agregar usuario".
2. Email: `admin@hospital.com`
3. Password: `password123` (o la que desees).
4. **IMPORTANTE**: Ve a Firestore Database y crea una colección `users`.
5. Crea un documento con el **UID** del usuario que acabas de crear (copialo de la columna UID en Auth).
6. En el documento, agrega el campo: `role: "admin"`.

### 3. Crear Usuario Portero
1. Crea otro usuario en Auth (`portero@hospital.com`).
2. En Firestore > `users`, crea un documento con su UID.
3. Agrega el campo: `role: "porter"`.

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Reglas de Seguridad (Firestore Rules Recomendadas)
Recomendado copiar esto en la pestaña "Reglas" de Firestore para empezar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    match /personnel/{docId} {
      allow read, write: if request.auth != null;
    }
    match /active_parking/{docId} {
      allow read, write: if request.auth != null;
    }
    match /history/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
