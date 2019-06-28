const mongoose = require('mongoose');

const { Schema } = mongoose;

const ServicesSchema = new Schema({
  name: String,
  description: String,
  pricePerUnit: String,
  unit: String,
  currency: String,
  primaryTenant: String,
  activeTenant:  String
});

mongoose.model('Services', ServicesSchema);
