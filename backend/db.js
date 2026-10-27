const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

/*
  Ejecuta esta sentencia UNA vez en tu base de datos (psql o pgAdmin)
  para crear la tabla de usuarios:

  CREATE TABLE IF NOT EXISTS usuarios (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    apellido  VARCHAR(100) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    password  TEXT NOT NULL
  );

  Nota: la columna password guarda "salt:hash", nunca la contraseña real.
*/

module.exports = pool;