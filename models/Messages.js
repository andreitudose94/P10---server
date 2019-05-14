const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessagesSchema = new Schema({
  text: String,
  callIndex: String,
  datetimeSent: Date,
  sentBy: String,
  read: Boolean,
  primaryTenant: String,
  activeTenant:  String,
});

mongoose.model('Messages', MessagesSchema);
