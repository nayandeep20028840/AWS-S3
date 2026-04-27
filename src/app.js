const express = require('express');
const s3Routes = require('./routes/s3.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

app.use('/', s3Routes);

app.use(errorHandler);

module.exports = app;
