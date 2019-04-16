const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/companies', require('./companies'));
router.use('/callers', require('./callers'));
router.use('/responsibles', require('./responsibles'));

module.exports = router;
