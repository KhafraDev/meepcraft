const http = require('http');
const https = require('https');
const express = require('express');
const app = express();
const meep = require('./routes/meep.js');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.use('/meep', meep);

const port = process.env.PORT || 3000;
http.createServer(app).listen(port);
https.createServer({}, app).listen(port);