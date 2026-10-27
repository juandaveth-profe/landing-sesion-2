// Firebase App & Firestore — CDN imports (v13.1.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// ---------- Firebase config ----------
const firebaseConfig = {
  apiKey: "AIzaSyAfL1ry6zHpGQFcef0W-SO1irW53KOF_X0",
  authDomain: "mi-landing-conmemoria.firebaseapp.com",
  projectId: "mi-landing-conmemoria",
  storageBucket: "mi-landing-conmemoria.firebasestorage.app",
  messagingSenderId: "391414921329",
  appId: "1:391414921329:web:3cdc72c13309bbfd8b83d0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- DOM references ----------
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("form-submit-btn");

// ---------- Helper: show status message ----------
function showStatus(message, type = "success") {
  statusEl.textContent = message;
  statusEl.className = `form-status form-status--${type} form-status--visible`;

  // Auto‑hide after 5 seconds
  setTimeout(() => {
    statusEl.classList.remove("form-status--visible");
  }, 5000);
}

// ---------- Form submission ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = form.nombre.value.trim();
  const correo = form.correo.value.trim();
  const mensaje = form.mensaje.value.trim();

  if (!nombre || !correo || !mensaje) {
    showStatus("Por favor completa todos los campos.", "error");
    return;
  }

  // Disable button while sending
  submitBtn.disabled = true;
  submitBtn.classList.add("form-submit-btn--loading");

  try {
    await addDoc(collection(db, "mensajes"), {
      nombre,
      correo,
      mensaje,
      fecha: serverTimestamp(),
    });

    showStatus("¡Mensaje enviado con éxito! 🎉", "success");
    form.reset();
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    showStatus("Hubo un error al enviar el mensaje. Intenta de nuevo.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("form-submit-btn--loading");
  }
});
