require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ---------- Utilidades ----------
const esTexto = (valor) => typeof valor === "string" && valor.trim().length > 0;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Encripta la contraseña con scrypt (incluido en Node, sin dependencias extra)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Compara la contraseña ingresada con el "salt:hash" guardado
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;

  const hashGuardado = Buffer.from(hash, "hex");
  const hashCandidato = crypto.scryptSync(password, salt, 64);

  return (
    hashGuardado.length === hashCandidato.length &&
    crypto.timingSafeEqual(hashGuardado, hashCandidato)
  );
}

// ---------- Rutas ----------
app.get("/", (req, res) => {
  res.json({ success: true, message: "API funcionando correctamente" });
});

// Registro de usuario
app.post("/api/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body || {};

    if (![nombre, apellido, email, password].every(esTexto)) {
      return res
        .status(400)
        .json({ success: false, message: "Todos los campos son obligatorios." });
    }

    const emailLimpio = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(emailLimpio)) {
      return res
        .status(400)
        .json({ success: false, message: "El correo no tiene un formato válido." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    const passwordHash = hashPassword(password);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, apellido, email`,
      [nombre.trim(), apellido.trim(), emailLimpio, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente.",
      usuario: resultado.rows[0],
    });
  } catch (error) {
    // 23505 = violación de restricción UNIQUE (correo duplicado)
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Ese correo ya está registrado." });
    }
    console.error("Error en /api/register:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
});

// Inicio de sesión
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!esTexto(email) || !esTexto(password)) {
      return res.status(400).json({
        success: false,
        message: "Correo y contraseña son obligatorios.",
      });
    }

    const resultado = await pool.query(
      `SELECT id, nombre, apellido, email, password
       FROM usuarios
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const usuario = resultado.rows[0];

    // Mismo mensaje si el correo no existe o la contraseña falla
    if (!usuario || !verifyPassword(password, usuario.password)) {
      return res
        .status(401)
        .json({ success: false, message: "Correo o contraseña incorrectos." });
    }

    // Nunca devolvemos la contraseña al frontend
    const { password: _omitida, ...usuarioPublico } = usuario;

    return res.json({
      success: true,
      message: "Inicio de sesión exitoso.",
      usuario: usuarioPublico,
    });
  } catch (error) {
    console.error("Error en /api/login:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
});

// ---------- Arranque ----------
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  try {
    await pool.query("SELECT 1");
    console.log("Conexión a PostgreSQL exitosa");
  } catch (error) {
    console.error("No se pudo conectar a PostgreSQL:", error.message);
  }
});