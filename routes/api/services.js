const env = require('../../env.json')
const mongoose = require('mongoose');
const moment = require('moment');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Services = mongoose.model('Services');

//POST new services (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { service } } = req;

  let userPrimaryTenant = '', userActiveTenant = ''

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      userPrimaryTenant = myUser.primaryTenant;
      userActiveTenant = myUser.activeTenant;

      return
    })
    .then(() => {
      const finalService = new Services(
        Object.assign(service, {
          name: service.name,
          description: service.description,
          pricePerUnit: service.pricePerUnit,
          unit: service.unit,
          currency: service.currency,
          primaryTenant: userPrimaryTenant,
          activeTenant: userActiveTenant
        })
      )

      return finalService.save()
        .then(() => res.json({ok: true}))
    })
});

// GET services
router.get('/view', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return Users.findById(id, { primaryTenant: 1, activeTenant: 1 })
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      const userPrimaryTenant = myUser.primaryTenant
      const userActiveTenant = myUser.activeTenant
      return Services.find({ primaryTenant: userPrimaryTenant, activeTenant: userActiveTenant }, {})
        .then((services) => res.json({ services }))
  });
});

module.exports = router;
