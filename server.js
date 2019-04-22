// const express = require('express')
// const app = express()
// const cors = require('cors')
// app.use(cors())
//
// app.get('/', function (req, res) {
//   res.send('Saluuuuut!');
// });
//
// const port = 1234
// app.listen(port, () => console.log('Listening on port ' + port))
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const env = require('./env.json')

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'p10-db', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!isProduction) {
  app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect(env.DB_CONNECT, { useNewUrlParser: true });
mongoose.set('debug', true);

require('./models/Users');
require('./models/Companies');
require('./models/Callers');
require('./models/Responsibles');
require('./models/Calls');
require('./models/Missions');
require('./config/passport');
app.use(require('./routes'));

//Error handlers & middlewares
if(!isProduction) {
  app.use((err, req, res) => {
    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    });
  });
}

app.use((err, req, res) => {
  res.status(err.status || 500);

  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
});

app.listen(env.PORT, () => console.log('Server running on http://localhost:8000/'));
