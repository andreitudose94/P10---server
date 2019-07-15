const env = require('../../env.json')
const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const nodemailer = require('nodemailer');
const Promise = require('bluebird');

const emailInit = (sendTo, subject, html) => {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.APLICATION_EMAIL,
      pass: env.APLICATION_PASSWORD
    }
  });

  const mailOptions = {
    from: env.APLICATION_EMAIL,
    to: sendTo,
    subject: subject,
    html: html
  };

  return { transporter: transporter, mailOptions: mailOptions }
}

const sendEmail = (transporter, mailOptions) =>
  new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        reject(error)
      } else {
        console.log('Email sent: ' + info.response);
        resolve(info)
      }
    });
  });

const generateRandomPassword = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

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

  return Users.findOne({email: user.email})
    .then((existingUser) => {
      if(existingUser) {
        return res.status(422).json({
          message: 'Email already exists!',
        });
      }

      // we add the role to the user
      const finalUser = new Users(Object.assign(user, {
        name: user.name,
        role: 'Admin',
        primaryTenant: user.email + '$default',
        activeTenant:  user.email + '$default',
        tenantsList:  [{
          title: user.email + '$default',
          description: 'This tenant has been created automatically by the app'
        }]
      }));

      finalUser.setPassword(user.password);

      return finalUser.save()
        .then(() => {
          const subject = 'Welcome to FMS (Field Mission Support)'
          const html = `
            <p>
              Hello dear client! <br />
              Click the link below to access the FMS app. <br />
              <a href='${"http:localhost:8080/login"}'> FMS Login URL </a> <br />
              Thanks, <br />
              The Paco team
            </p>
          `

          const { transporter, mailOptions } = emailInit(user.email, subject, html)
          sendEmail(transporter, mailOptions)

        })
        .then(() => res.json({ ok: true }));
    })

});

//POST new user (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { user } } = req;
  const clientHost = req.headers.origin

  if(!user.name) {
    return res.status(422).json({
      errors: {
        name: 'is required',
      },
    });
  }

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }
      return Users.findOne({email: user.email})
    })
    .then((existingUser) => {
      if(existingUser) {
        return res.status(422).json({
          message: 'Email already exists!',
        });
      }

      // here we should add an algorithm to generate default password
      const password = generateRandomPassword(15)

      // we add the role to the user
      const finalUser = new Users(Object.assign(user, {
        name: user.name,
        password: password,
        role: user.role,
        primaryTenant: user.primaryTenant,
        activeTenant:  user.activeTenant,
        tenantsList:  user.tenantsList
      }));

      finalUser.setPassword(password);

      return finalUser.save()
        .then(() => {
          const subject = 'Reset your password on FMS (Field Mission Support)'
          const html = `
            <p>
              Hello dear client! <br />
              Click the link below to reset your password on FMS app. <br />
              <a href='${clientHost + "/reset-default-password/" + finalUser.salt + "~" + finalUser._id}'> Reset Password from here </a> <br />
              Thanks, <br />
              The Paco team
            </p>
          `
          const { transporter, mailOptions } = emailInit(user.email, subject, html)
          sendEmail(transporter, mailOptions)
        })
        .then(() => res.json({ ok: true }));
    })
});

//POST new user route (optional, everyone has access)
router.post('/reset-default-password', auth.optional, (req, res, next) => {
  const { body: { password } } = req;
  const clientUrl = req.headers.referer
  const oldSaltAndId = clientUrl.substr(clientUrl.lastIndexOf('/') + 1)
  const oldSalt = oldSaltAndId.substr(0, oldSaltAndId.indexOf('~'))
  const clientId = oldSaltAndId.substr(oldSaltAndId.indexOf('~') + 1)

  if(password.length === 0) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  return Users.findOne({_id: clientId, salt: oldSalt})
    .then((user) => {
      if(!user) {
        return res.status(400).json({
          message: 'Seems that the url address has been expired!'
        });
      }

      const finalUser = new Users(user)
      finalUser.setPassword(password);

      return finalUser.save()
        .then(() => res.json({ ok: true }))
    });

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

  return passport.authenticate('local', { session: true }, (err, passportUser, info) => {
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
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!'
        });
      }

      return res.json({ user: user.toAuthJSON() });
    });
});


//GET current route (required, only authenticated users have access)
router.post('/changePassword', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { oldPassword, newPassword } } = req;

  if(!oldPassword) {
    return res.status(422).json({
      errors: {
        'old password': 'is required',
      },
    });
  }

  if(!newPassword) {
    return res.status(422).json({
      errors: {
        'newPassword': 'is required',
      },
    });
  }

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!'
        });
      }

      if(!user.validatePassword(oldPassword)) {
        return res.status(422).json({
          message: 'Invalid password!'
        });
      }

      const finalUser = new Users(user)
      finalUser.setPassword(newPassword);

      return finalUser.save()
        .then(() => res.json({ ok: true }))
    })
});



//GET all users (required, only authenticated users have access)
router.get('/all', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  return Users.findById(id, { primaryTenant: 1 })
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }
      return Users.find({ primaryTenant: myUser.primaryTenant }, { name: 1, email: 1, role: 1, tenantsList: 1 })
        .then((users) => res.json({ users }))
    });
});

//POST activate tenant (optional, everyone has access)
router.post('/activateTenant', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { activeTenant } } = req

  if(!activeTenant) {
    return res.status(422).json({
      errors: {
        activeTenant: 'is required',
      },
    });
  }

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      // return res.json({ user });
      const finalUser = new Users(Object.assign(user, {
        activeTenant: activeTenant
      }));

      return finalUser.save()
        .then(() => res.json({ activeTenant: activeTenant }));
    });
});

//POST new tenant (optional, everyone has access)
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
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
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
  const { body: { tenantsList, tenantDeleted } } = req

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
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });;
      }

      // return res.json({ user });
      const finalUser = new Users(Object.assign(user, {
        tenantsList: tenantsList
      }));

      return finalUser.save()
        .then(() => Users.find({tenantsList: {$elemMatch: {title: tenantDeleted}}}))
        // delete or update users
        .then((users) =>
          Promise.map(
            users,
            (u) => {
              const newTenantsList = u.tenantsList.filter((tl) =>
                tl.title !== tenantDeleted)

                if(newTenantsList.length > 0) {

                  const finalUser = new Users(Object.assign(u, {
                    tenantsList: newTenantsList
                  }));
                  return finalUser.save()

                } else {
                  return Users.deleteOne({ _id: u._id })
                }
            },
            {
              concurrency: 1
            }
          )
      )
      .then(() => res.json({ tenantsList: tenantsList }))
    })

});

module.exports = router;
