// ============================================================================
// Firebase Cloud Firestore - Contact Form Handler
// ============================================================================
// Corresponde a la regla de seguridad de Cloud Firestore:
//
// match /mensajes/{mensaje} {
//   allow create: if request.resource.data.keys().hasOnly(['nombre', 'correo', 'mensaje', 'fecha'])
//                 && request.resource.data.nombre is string
//                 && request.resource.data.correo is string
//                 && request.resource.data.mensaje is string
//                 && request.resource.data.mensaje.size() <= 2000
//                 && request.resource.data.fecha == request.time;
//   allow read, update, delete: if false;
// }
// ============================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Configuración de Firebase:
// Puedes reemplazar estos valores o definirlos antes en window.FIREBASE_CONFIG
export const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

let db = null;
let isInitialized = false;

function initFirebase() {
  const isPlaceholder =
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey.includes('TU_') ||
    !firebaseConfig.projectId ||
    firebaseConfig.projectId.includes('TU_');

  if (isPlaceholder) {
    return false;
  }

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isInitialized = true;
    return true;
  } catch (error) {
    console.warn('[Firebase] Error de inicialización:', error);
    return false;
  }
}

// Intentar inicializar Firebase al cargar el módulo
initFirebase();

// Lógica de interacción con el formulario
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nombreInput = document.getElementById('nombre');
  const correoInput = document.getElementById('correo');
  const mensajeInput = document.getElementById('mensaje');
  const charCounter = document.getElementById('char-counter');
  const submitBtn = document.getElementById('submit-btn');
  const feedbackDiv = document.getElementById('form-feedback');

  const nombreError = document.getElementById('nombre-error');
  const correoError = document.getElementById('correo-error');
  const mensajeError = document.getElementById('mensaje-error');

  const MAX_CARACTERES = 2000;

  // Actualizar contador en tiempo real (regla: mensaje.size() <= 2000)
  function updateCharCounter() {
    const currentLength = mensajeInput.value.length;
    charCounter.textContent = `${currentLength} / ${MAX_CARACTERES}`;

    if (currentLength >= MAX_CARACTERES) {
      charCounter.classList.add('limit');
      charCounter.classList.remove('warning');
    } else if (currentLength >= MAX_CARACTERES * 0.9) {
      charCounter.classList.add('warning');
      charCounter.classList.remove('limit');
    } else {
      charCounter.classList.remove('warning', 'limit');
    }
  }

  mensajeInput.addEventListener('input', updateCharCounter);
  updateCharCounter();

  // Limpiar errores al escribir
  function clearFieldError(input, errorElement) {
    input.classList.remove('has-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  function setFieldError(input, errorElement, message) {
    input.classList.add('has-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  nombreInput.addEventListener('input', () => clearFieldError(nombreInput, nombreError));
  correoInput.addEventListener('input', () => clearFieldError(correoInput, correoError));
  mensajeInput.addEventListener('input', () => clearFieldError(mensajeInput, mensajeError));

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFeedback(type, message) {
    feedbackDiv.className = `form-feedback ${type}`;
    feedbackDiv.textContent = message;
    feedbackDiv.style.display = 'flex';
  }

  function hideFeedback() {
    feedbackDiv.style.display = 'none';
    feedbackDiv.textContent = '';
    feedbackDiv.className = 'form-feedback';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFeedback();

    const nombre = nombreInput.value.trim();
    const correo = correoInput.value.trim();
    const mensaje = mensajeInput.value.trim();

    let hasErrors = false;

    // Validación: nombre is string
    if (!nombre) {
      setFieldError(nombreInput, nombreError, 'Por favor, ingresa tu nombre.');
      hasErrors = true;
    }

    // Validación: correo is string
    if (!correo) {
      setFieldError(correoInput, correoError, 'Por favor, ingresa tu correo electrónico.');
      hasErrors = true;
    } else if (!isValidEmail(correo)) {
      setFieldError(correoInput, correoError, 'Ingresa un correo electrónico válido.');
      hasErrors = true;
    }

    // Validación: mensaje is string && mensaje.size() <= 2000
    if (!mensaje) {
      setFieldError(mensajeInput, mensajeError, 'Por favor, escribe un mensaje.');
      hasErrors = true;
    } else if (mensaje.length > MAX_CARACTERES) {
      setFieldError(
        mensajeInput,
        mensajeError,
        `El mensaje no puede exceder ${MAX_CARACTERES} caracteres (longitud actual: ${mensaje.length}).`
      );
      hasErrors = true;
    }

    if (hasErrors) return;

    // Estado visual de carga
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    const labelSpan = submitBtn.querySelector('.btn-label');
    const defaultLabelText = labelSpan ? labelSpan.textContent : 'Enviar mensaje';
    if (labelSpan) labelSpan.textContent = 'Enviando...';

    try {
      // Reintentar inicializar si las credenciales fueron añadidas
      if (!isInitialized) {
        initFirebase();
      }

      // Si no están configuradas las credenciales de Firebase, informar al usuario amigablemente
      if (!isInitialized || !db) {
        showFeedback(
          'info',
          'ℹ️ Formulario validado con la regla de Firestore. Para guardar en vivo en tu base de datos, ingresa tus credenciales en contact.js o en window.FIREBASE_CONFIG.'
        );
        console.info('[Firestore Demo] Documento listo para /mensajes/{id}:', {
          nombre,
          correo,
          mensaje,
          fecha: 'serverTimestamp() [request.time]'
        });
        return;
      }

      // Estructura de documento exacta requerida por la regla de seguridad:
      // keys().hasOnly(['nombre', 'correo', 'mensaje', 'fecha'])
      // fecha == request.time (generado con serverTimestamp())
      const payload = {
        nombre: nombre,
        correo: correo,
        mensaje: mensaje,
        fecha: serverTimestamp()
      };

      await addDoc(collection(db, 'mensajes'), payload);

      showFeedback('success', '¡Mensaje enviado con éxito! Te responderé lo antes posible.');
      form.reset();
      updateCharCounter();
    } catch (error) {
      console.error('[Firebase] Error al guardar en Cloud Firestore:', error);
      if (error?.code === 'permission-denied') {
        showFeedback(
          'error',
          'Error de permisos (permission-denied): Los datos enviados no cumplen con las reglas de Cloud Firestore.'
        );
      } else {
        showFeedback(
          'error',
          `Ocurrió un error al enviar el mensaje: ${error.message || 'Por favor intenta de nuevo.'}`
        );
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      if (labelSpan) labelSpan.textContent = defaultLabelText;
    }
  });
});
