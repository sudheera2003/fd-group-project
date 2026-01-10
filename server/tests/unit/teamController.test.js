const { updateTeam } = require('../../controllers/teamController');
const Project = require('../../models/Project');
const Team = require('../../models/Team');
const httpMocks = require('node-mocks-http');

jest.mock('../../models/Project');
jest.mock('../../models/Team');

describe('Team Controller Unit Tests', () => {
    
    it('should prevent changing organizer if they have active projects', async () => {
        const req = httpMocks.createRequest({
            params: { id: 'team_123' },
            body: { 
                organizerId: 'new_organizer_id', 
                name: 'Alpha Team'
            }
        });
        const res = httpMocks.createResponse();
        Team.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                _id: 'team_123',
                name: 'Alpha Team',
                organizer: { _id: 'old_organizer_id', email: 'old@test.com', username: 'OldOrg' }
            })
        });
        Project.findOne.mockResolvedValue({
            name: "Tech Fest 2026",
            status: "In Progress"
        });
        await updateTeam(req, res);
        expect(res.statusCode).toBe(400); // Expect Error
        const data = res._getJSONData();
        expect(data.message).toMatch(/Cannot change organizer/);
    });
});