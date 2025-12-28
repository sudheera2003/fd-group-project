const express = require('express');
const router = express.Router();
const { createTeam, getTeams } = require('../controllers/teamController');

router.post('/', createTeam);
router.get('/', getTeams);

module.exports = router;