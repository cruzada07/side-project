// URL del backend (cámbiala si tu servidor usa otro puerto)
const API_URL = window.location.origin;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Utilidades ----------
function showMessage(texto, tipo = "error") {
  const caja = document.getElementById("message");
  if (!caja) return;
  caja.textContent = texto;
  caja.className = `message ${tipo}`;
}

function clearMessage() {
  const caja = document.getElementById("message");
  if (!caja) return;
  caja.textContent = "";
  caja.className = "message";
}

async function postJSON(ruta, cuerpo) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const data = await respuesta.json().catch(() => ({}));
  return { ok: respuesta.ok, status: respuesta.status, data };
}

// ---------- Registro ----------
const registerForm = document.getElementById("register-form");

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!nombre || !apellido || !email || !password) {
      return showMessage("Completa todos los campos.");
    }
    if (!EMAIL_REGEX.test(email)) {
      return showMessage("Ingresa un correo válido.");
    }
    if (password.length < 6) {
      return showMessage("La contraseña debe tener al menos 6 caracteres.");
    }

    const boton = registerForm.querySelector("button[type='submit']");
    boton.disabled = true;
    boton.textContent = "Registrando...";

    try {
      const { ok, data } = await postJSON("/api/register", {
        nombre,
        apellido,
        email,
        password,
      });

      if (ok) {
        window.location.href = "success.html";
        return;
      }
      showMessage(data.message || "No se pudo completar el registro.");
    } catch (error) {
      showMessage(
        "No se pudo conectar con el servidor. ¿Está encendido el backend?"
      );
    } finally {
      boton.disabled = false;
      boton.textContent = "Registrarme";
    }
  });
}

// ---------- Login ----------
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      return showMessage("Ingresa tu correo y tu contraseña.");
    }
    if (!EMAIL_REGEX.test(email)) {
      return showMessage("Ingresa un correo válido.");
    }

    const boton = loginForm.querySelector("button[type='submit']");
    boton.disabled = true;
    boton.textContent = "Verificando...";

    try {
      const { ok, data } = await postJSON("/api/login", { email, password });

      if (ok && data.success) {
        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
        window.location.href = "dashboard.html";
        return;
      }
      showMessage(data.message || "Correo o contraseña incorrectos.");
    } catch (error) {
      showMessage(
        "No se pudo conectar con el servidor. ¿Está encendido el backend?"
      );
    } finally {
      boton.disabled = false;
      boton.textContent = "Iniciar Sesión";
    }
  });
}

// ---------- Dashboard ----------
const welcomeName = document.getElementById("welcome-name");

if (welcomeName) {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));

  if (!usuario) {
    // Sin sesión: de vuelta al login
    window.location.href = "login.html";
  } else {
    welcomeName.textContent = `${usuario.nombre} ${usuario.apellido}`;
  }
}

const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("usuario");
    window.location.href = "index.html";
  });
}