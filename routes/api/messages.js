const env = require('../../env.json')
const mongoose = require('mongoose');
const moment = require('moment');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Messages = mongoose.model('Messages');

//GET all message (required, only authenticated users have access)
router.post('/view', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { callIndex } } = req;

  if(!callIndex) {
    return res.status(422).json({
      callIndex: 'Is required!',
    });
  }
  console.log('callIndexcallIndex', callIndex);
  return Users.findById(id, { primaryTenant: 1, activeTenant: 1 })
    .then((myUser) => {
      if(!myUser) {
        return res.status(422).json({
          message: 'Your account doesn\'t exist anymore!',
        });
      }

      const userPrimaryTenant = myUser.primaryTenant
      const userActiveTenant = myUser.activeTenant

      return Messages.find({
        primaryTenant: userPrimaryTenant,
        activeTenant: userActiveTenant,
        callIndex: callIndex
      })
        .then((messages) => res.json({ messages }))
    });
});

//POST new message (auth required)
router.post('/new', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: { newMessage } } = req;
  console.log(newMessage);

  if(!newMessage.text) {
    return res.status(422).json({
      errors: {
        message: 'is required',
      },
    });
  }

  if(!newMessage.callIndex) {
    return res.status(422).json({
      errors: {
        'CallIndex': 'is required',
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
      return
    })
    .then(() => {
      const finalMessage = new Messages(Object.assign(newMessage, {
        text: newMessage.text,
        callIndex: newMessage.callIndex,
        datetimeSent: newMessage.datetimeSent,
        sentBy: newMessage.sentBy,
        read: newMessage.read,
        primaryTenant: newMessage.primaryTenant,
        activeTenant:  newMessage.activeTenant,
      }));
      return finalMessage.save()
    })

    .then(() => res.json({
        ok: true
      })
    );
});

// POST reserve responsible
router.post('/update', auth.required, (req, res, next) => {
  const { payload: { id } } = req;
  const { body: {
    callIndex,
    primaryTenant,
    activeTenant,
  } } = req

  if(!callIndex) {
    return res.status(422).json({
      errors: {
        'callIndex' : 'is required',
      },
    });
  }

  if(!primaryTenant) {
    return res.status(422).json({
      errors: {
        'primaryTenant' : 'is required',
      },
    });
  }

  if(!activeTenant) {
    return res.status(422).json({
      errors: {
        'activeTenant' : 'is required',
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

      console.log({
        callIndex,
        primaryTenant,
        activeTenant,
        user: user.name
      });
      // make all responsibles that were reserved for this call available again
      return Messages.updateMany(
        {
          callIndex: callIndex,
          primaryTenant: primaryTenant,
          activeTenant: activeTenant,
          sentBy: {  $ne : user.name }
        },
        {
          $set: { read: true }
        }
      )
      .then(() => res.json({ ok: true }));
    });
});

module.exports = router;
