const mongoose = require('mongoose');

const { Schema } = mongoose;

const CallersSchema = new Schema({
  name: String,
  ssn: String,
  company: String,
  primaryTenant: String,
  activeTenant:  String
});

mongoose.model('Callers', CallersSchema);
