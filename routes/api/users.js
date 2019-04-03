const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
router.post('/', auth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  // we add the role to the user
  const finalUser = new Users(Object.assign(user, {
    role: 'Admin',
    primaryTenant: user.email + '-default',
    activeTenant:  user.email + '-default',
    tenantsList:  [{
      title: user.email + '-default',
      description: 'This tenant has been created automatically by the app'
    }]
  }));

  finalUser.setPassword(user.password);

  return finalUser.save()
    .then(() => res.json({ user: finalUser.toAuthJSON() }));
});

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  const { body: { user } } = req;

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err);
    }

    if(passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json({ user: user.toAuthJSON() });
    }

    return res.status(400).json({
      message: 'No user found with these credentials!'
    });
  })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      return res.json({ user: user.toAuthJSON() });
    });
});

//POST new user route (optional, everyone has access)
router.post('/addTenant', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { tenantsList } } = req

  if(!tenantsList || tenantsList === []) {
    return res.status(422).json({
      errors: {
        tenantsList: 'is required',
      },
    });
  }

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      // return res.json({ user });
      const finalUser = new Users(Object.assign(user, {
        tenantsList: tenantsList
      }));

      return finalUser.save()
        .then(() => res.json({ tenantsList: tenantsList }));
    });
});

//POST new user route (optional, everyone has access)
router.post('/deleteTenant', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { tenantsList } } = req

  if(!tenantsList || tenantsList === []) {
    return res.status(422).json({
      errors: {
        tenantsList: 'is required',
      },
    });
  }

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      // return res.json({ user });
      const finalUser = new Users(Object.assign(user, {
        tenantsList: tenantsList
      }));

      return finalUser.save()
        .then(() => res.json({ tenantsList: tenantsList }));
    });
});

module.exports = router;
