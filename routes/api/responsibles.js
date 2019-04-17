const env = require('../../env.json')
const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Responsibles = mongoose.model('Responsibles');
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

//POST new user (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { responsible } } = req;
  const clientHost = req.headers.origin

  if(!responsible.name) {
    return res.status(422).json({
      errors: {
        name: 'is required',
      },
    });
  }

  if(!responsible.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!responsible.phoneNo) {
    return res.status(422).json({
      errors: {
        'phone number': 'is required',
      },
    });
  }

  let userPrimaryTenant = '', userActiveTenant = ''

  return Users.findById(id)
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      userPrimaryTenant = myUser.primaryTenant
      userActiveTenant = myUser.activeTenant

      return Responsibles.findOne({email: responsible.email})
    })
    .then((existingResp) => {
      if(existingResp) {
        return res.status(422).json({
          message: 'Email already exists!',
        });
      }

      // here we should add an algorithm to generate default password
      const password = generateRandomPassword(15)
      const responsibleId = responsible.name.substr(0,2).toUpperCase() + '_' + generateRandomPassword(7)

      // we add the role to the user
      const finalResp = new Responsibles(Object.assign(responsible, {
        name: responsible.name,
        email: responsible.email,
        password: password,
        phoneNo: responsible.phoneNo,
        responsibleId: responsibleId,
        status: 'Available',
        currentMission: '',
        online: false,
        geolocation: {
          lat: '',
          lng: ''
        },
        lastSentInfoTime: null,
        primaryTenant: userPrimaryTenant,
        activeTenant:  userActiveTenant
      }));

      finalResp.setPassword(password);

      return finalResp.save()
        .then(() => res.json({ ok: true }));
    })
});
//
// //POST new user route (optional, everyone has access)
// router.post('/reset-default-password', auth.optional, (req, res, next) => {
//   const { body: { password } } = req;
//   const clientUrl = req.headers.referer
//   const oldSaltAndId = clientUrl.substr(clientUrl.lastIndexOf('/') + 1)
//   const oldSalt = oldSaltAndId.substr(0, oldSaltAndId.indexOf('~'))
//   const clientId = oldSaltAndId.substr(oldSaltAndId.indexOf('~') + 1)
//
//   if(password.length === 0) {
//     return res.status(422).json({
//       errors: {
//         password: 'is required',
//       },
//     });
//   }
//
//   return Users.findOne({_id: clientId, salt: oldSalt})
//     .then((user) => {
//       if(!user) {
//         return res.status(400).json({
//           message: 'Seems that the url address has been expired!'
//         });
//       }
//
//       const finalUser = new Users(user)
//       finalUser.setPassword(password);
//
//       return finalUser.save()
//         .then(() => res.json({ ok: true }))
//     });
//
// });
//
// //POST login route (optional, everyone has access)
// router.post('/login', auth.optional, (req, res, next) => {
//   const { body: { user } } = req;
//
//   if(!user.email) {
//     return res.status(422).json({
//       errors: {
//         email: 'is required',
//       },
//     });
//   }
//
//   if(!user.password) {
//     return res.status(422).json({
//       errors: {
//         password: 'is required',
//       },
//     });
//   }
//
//   return passport.authenticate('local', { session: true }, (err, passportUser, info) => {
//     if(err) {
//       return next(err);
//     }
//
//     if(passportUser) {
//       const user = passportUser;
//       user.token = passportUser.generateJWT();
//
//       return res.json({ user: user.toAuthJSON() });
//     }
//
//     return res.status(400).json({
//       message: 'No user found with these credentials!'
//     });
//   })(req, res, next);
// });
//
// //GET current route (required, only authenticated users have access)
// router.get('/current', auth.required, (req, res, next) => {
//   const { payload: { id } } = req;
//
//   return Users.findById(id)
//     .then((user) => {
//       if(!user) {
//         return res.status(422).json({
//           message: 'Your account doesn\'t exist anymore!'
//         });
//       }
//
//       return res.json({ user: user.toAuthJSON() });
//     });
// });
//
//GET all users (required, only authenticated users have access)
router.get('/all', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  return Users.findById(id, { primaryTenant: 1, activeTenant: 1 })
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }
      return Responsibles.find(
        {
          primaryTenant: myUser.primaryTenant,
          activeTenant: myUser.activeTenant,
        },
        {
          name: 1,
          email: 1,
          phoneNo: 1,
          responsibleId: 1,
          online: 1,
          geolocation: 1,
          lastSentInfoTime: 1,
          status: 1
        }
      )
        .then((responsibles) => res.json({ responsibles })
      )
    });
});

//GET all active users (required, only authenticated users have access)
router.get('/all-actives', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  return Users.findById(id, { primaryTenant: 1, activeTenant: 1 })
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }
      return Responsibles.find({
        primaryTenant: myUser.primaryTenant,
        activeTenant: myUser.activeTenant,
        online: true,
        status: 'Available',
        geolocation: {
          $ne: {
        		lat : "",
        		lng : ""
        	}
        }
      }, { name: 1, email: 1, phoneNo: 1, responsibleId: 1, geolocation: 1 })
        .then((responsibles) => res.json({ responsibles }))
    });
});

// POST reserve responsible
router.post('/reserve-responsible', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { respId, uniqueId } } = req

  if(!respId) {
    return res.status(422).json({
      errors: {
        'Responsible id' : 'is required',
      },
    });
  }

  if(!uniqueId) {
    return res.status(422).json({
      errors: {
        'message' : 'Error to the server! Please refresh the page!',
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

      // make all responsibles that were reserved for this call available again
      return Responsibles.updateMany({ status: 'Reserved-' + uniqueId }, { $set: { status: 'Available' } })
        // then find the selected one
        .then(() => Responsibles.findById(respId))
        // and reserve it
        .then((resp) => {
          if(!resp) {
            return res.status(422).json({
              message: 'This responsible doesn\'t exist anymore!',
            });
          }

          if(resp.status !== 'Available') {
            return res.status(422).json({
              message: 'This responsible has been reserved already!',
            });
          }

          // return res.json({ user });
          const finalResp = new Responsibles(Object.assign(resp, {
            status: 'Reserved-' + uniqueId
          }));

          return finalResp.save()
            .then(() => res.json({ ok: true, id: respId }));
        });
    });
});

// POST release responsibles
router.post('/release', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { uniqueId } } = req

  if(!uniqueId) {
    return res.status(422).json({
      errors: {
        'message' : 'Error to the server! Please refresh the page!',
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

      // make all responsibles that were reserved for this call available again
      return Responsibles.updateMany({ status: 'Reserved-' + uniqueId }, { $set: { status: 'Available' } })
        .then(() => res.json({ ok: true }));
    });
});

//
// //POST new user route (optional, everyone has access)
// router.post('/deleteTenant', auth.required, (req, res, next) => {
//   const { payload: { id } } = req;
//   const { body: { tenantsList, tenantDeleted } } = req
//
//   if(!tenantsList || tenantsList === []) {
//     return res.status(422).json({
//       errors: {
//         tenantsList: 'is required',
//       },
//     });
//   }
//
//   return Users.findById(id)
//     .then((user) => {
//       if(!user) {
//         return res.status(422).json({
//           message: 'Your account doesn\'t exist anymore!',
//         });;
//       }
//
//       // return res.json({ user });
//       const finalUser = new Users(Object.assign(user, {
//         tenantsList: tenantsList
//       }));
//
//       return finalUser.save()
//         .then(() => Users.find({tenantsList: {$elemMatch: {title: tenantDeleted}}}))
//         // delete or update users
//         .then((users) =>
//           Promise.map(
//             users,
//             (u) => {
//               const newTenantsList = u.tenantsList.filter((tl) =>
//                 tl.title !== tenantDeleted)
//
//                 if(newTenantsList.length > 0) {
//
//                   const finalUser = new Users(Object.assign(u, {
//                     tenantsList: newTenantsList
//                   }));
//                   return finalUser.save()
//
//                 } else {
//                   return Users.deleteOne({ _id: u._id })
//                 }
//             },
//             {
//               concurrency: 1
//             }
//           )
//       )
//       .then(() => res.json({ tenantsList: tenantsList }))
//     })

module.exports = router;
