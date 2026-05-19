import pg from 'pg';

// Crée le pool PostgreSQL utilisé par toute l'application
// Les identifiants viennent du fichier .env pour ne pas les exposer dans le code
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
    // On teste une connexion pour s'assurer que la base de données est accessible
    const client = await pool.connect();
    console.log('Connexion à PostgreSQL réussie.');
    // On libère la connexion après le test pour qu'elle redevienne disponible
    client.release();
  } catch (erreur) {
    // Si la base est introuvable ou le mot de passe faux, on log l'erreur au démarrage
    console.error('Erreur de connexion à PostgreSQL :', erreur);
  }
}

// Lance le test de connexion au démarrage du serveur
testerConnexion();

// Export du pool pour que tous les contrôleurs puissent faire des requêtes SQL
export default pool;
