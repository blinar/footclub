import pg from 'pg';

// Crée le pool PostgreSQL utilisé par toute l'application
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Vérifie au démarrage que la base répond bien
async function testerConnexion() {
  try {
    const client = await pool.connect();
    console.log('Connexion à PostgreSQL réussie.');
    client.release();
  } catch (erreur) {
    console.error('Erreur de connexion à PostgreSQL :', erreur);
  }
}

testerConnexion();

export default pool;
