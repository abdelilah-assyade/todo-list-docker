const path = require('path');
const express = require('express');
const config = require('./config');
const apiRoutes = require('./routes');
const repository = require('./db/tasksRepository');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.use(express.json());

// The backend also serves the frontend, so the browser only ever talks to one
// origin. That is why no CORS setup is needed anywhere in this project.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

repository
  .ready()
  .then(() => {
    app.listen(config.port, () => {
      console.log('[server] listening on http://localhost:' + config.port);
      console.log('[server] storage driver: ' + repository.driver);
    });
  })
  .catch((err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down');
  process.exit(0);
});