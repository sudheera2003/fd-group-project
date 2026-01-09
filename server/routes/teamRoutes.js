const express = require('express');
const router = express.Router();
const { createTeam, getTeams, updateTeam, deleteTeam, getTeamById } = require('../controllers/teamController');

router.post('/', createTeam);
router.get('/', getTeams);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.get('/:id', getTeamById);
module.exports = router;