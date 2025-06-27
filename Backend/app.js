const express = require('express');
const path = require('path');
const cors = require('cors')
require('dotenv').config();
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express')
const yaml = require('yamljs')

// Configuration CORS pour GitHub Pages et Railway
const corsOptions = {
  origin: [
    'https://rocal93.github.io', // Votre domaine GitHub Pages
    'https://sophiebluel-production-c545.up.railway.app', // Votre backend Railway
    'http://localhost:5678', // Port local utilisé dans votre frontend
    'http://127.0.0.1:5678', // Alternative locale avec le bon port
    'http://localhost:5500', // Live Server
    'http://127.0.0.1:5500'  // Live Server alternative
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Charger swagger AVEC gestion d'erreur
let swaggerDocs;
try {
  swaggerDocs = yaml.load('swagger.yaml');
  console.log('✅ Swagger loaded successfully');
} catch (error) {
  console.error('❌ Error loading swagger.yaml:', error);
  swaggerDocs = null;
}

const app = express()

// DEBUG
console.log('=== STARTING APPLICATION ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Middlewares
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Appliquer la configuration CORS
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Vérifier que le dossier images existe
const imagesPath = path.join(__dirname, 'images');
if (!require('fs').existsSync(imagesPath)) {
  console.log('Creating images directory...');
  require('fs').mkdirSync(imagesPath, { recursive: true });
}
app.use('/images', express.static(imagesPath))

// Routes de base AVANT d'importer les modèles
app.get('/', (req, res) => {
  res.json({
    message: 'API Sophie Bluel is running!',
    port: process.env.PORT || 8080,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Importer les modèles et routes APRÈS les routes de base
const db = require("./models");
const userRoutes = require('./routes/user.routes');
const categoriesRoutes = require('./routes/categories.routes');
const worksRoutes = require('./routes/works.routes');

app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/works', worksRoutes);

// Swagger seulement si chargé avec succès
if (swaggerDocs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// Gestion d'erreur
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = parseInt(process.env.PORT) || 8080;

// Démarrer le serveur IMMÉDIATEMENT
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server listening on port: ${port}`);

  // Synchroniser la DB en arrière-plan
  db.sequelize.sync()
    .then(() => {
      console.log('✅ Database is ready');
    })
    .catch(err => {
      console.error('❌ Database sync error:', err);
      // Ne PAS arrêter le serveur si la DB échoue
    });
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

module.exports = app;