const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const env = require('./env.json')
const http = require("http");

const socketIO = require("socket.io");

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
require('./models/Messages');
require('./models/Missions');
require('./config/passport');
app.use(require('./routes'));

const Messages = mongoose.model('Messages');

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

let filterMessages = {}, ds_messages = []
// our server instance
const server = http.createServer(app);
// This creates our socket using the instance of the server
const io = socketIO(server);
io.set('origins', 'http://localhost:8080');
io.on("connection", socket => {
  //Returning data for messages
  socket.on("messages_data", (resp) => {
    filterMessages = resp;
    Messages.find({
      primaryTenant: resp.primaryTenant,
      activeTenant: resp.activeTenant,
      callIndex: resp.callIndex
    })
      .then(message => socket.emit("get_messages", message))

    setInterval(() => {
      socket.emit("get_messages", ds_messages)
    }, 10000)
  });

  // disconnect is fired when a client leaves the server
  socket.on("disconnect", () => {
    console.log("user disconnected");
  })
})

setInterval(() => {
  const messagesConnected = Object.keys(filterMessages)

  if(messagesConnected.length) {
    Messages.find({
      primaryTenant: filterMessages.primaryTenant,
      activeTenant: filterMessages.activeTenant,
      callIndex: filterMessages.callIndex
    }).then((messages) => {ds_messages = messages})
  }
}, 10000)

server.listen(env.PORT, () => console.log('Server running on http://localhost:8000/'));
