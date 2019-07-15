const mongoose = require('mongoose');

const { Schema } = mongoose;

const ContractsSchema = new Schema({
  contractNumber: String,
  company: String,
  startDate: Date,
  endDate: Date,
  comment: String,
  services: Array,
  primaryTenant: String,
  activeTenant:  String,
});

mongoose.model('Contracts', ContractsSchema);
