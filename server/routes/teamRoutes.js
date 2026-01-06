const express = require('express');
const router = express.Router();
const { createTeam, getTeams, updateTeam } = require('../controllers/teamController');

router.post('/', createTeam);
router.get('/', getTeams);
router.put('/:id', updateTeam);

module.exports = router;