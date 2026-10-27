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
const btnText = submitBtn.querySelector(".btn-text");
const formWrapper = document.querySelector(".contact-form-wrapper");

// ---------- Form submission ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = form.nombre.value.trim();
  const correo = form.correo.value.trim();
  const mensaje = form.mensaje.value.trim();

  if (!nombre || !correo || !mensaje) {
    statusEl.textContent = "Por favor completa todos los campos.";
    statusEl.className = "form-status form-status--error form-status--visible";
    return;
  }

  // Disable button and show "Enviando..."
  submitBtn.disabled = true;
  btnText.textContent = "Enviando...";

  // Hide any previous error
  statusEl.className = "form-status";

  try {
    await addDoc(collection(db, "mensajes"), {
      nombre,
      correo,
      mensaje,
      fecha: serverTimestamp(),
    });

    // Replace the form with the thank-you message
    const thankYou = document.createElement("div");
    thankYou.className = "form-success-message";

    const icon = document.createElement("span");
    icon.className = "form-success-icon";
    icon.textContent = "✉️";

    const text = document.createElement("p");
    text.className = "form-success-text";

    // Build the message safely with textContent fragments
    const before = document.createTextNode("¡Gracias por escribirme, ");
    const nombreEl = document.createElement("strong");
    nombreEl.textContent = nombre;
    const middle = document.createTextNode("! Te respondo pronto a tu correo ");
    const correoEl = document.createElement("strong");
    correoEl.textContent = correo;
    const after = document.createTextNode(".");

    text.appendChild(before);
    text.appendChild(nombreEl);
    text.appendChild(middle);
    text.appendChild(correoEl);
    text.appendChild(after);

    thankYou.appendChild(icon);
    thankYou.appendChild(text);

    // Remove form + status, insert thank-you
    form.remove();
    statusEl.remove();
    formWrapper.appendChild(thankYou);

  } catch (error) {
    console.error("Error al enviar mensaje:", error);

    // Re-enable button
    submitBtn.disabled = false;
    btnText.textContent = "Enviar";

    statusEl.textContent = "No se pudo enviar, intenta de nuevo.";
    statusEl.className = "form-status form-status--error form-status--visible";
  }
});
