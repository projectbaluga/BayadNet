const mikrotikService = require('../services/mikrotik');

// Mock routeros-client
const mockApi = {
    menu: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
};

const mockClient = {
    connect: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
    api: jest.fn().mockReturnValue(mockApi)
};

jest.mock('routeros-client', () => {
    return {
        RouterOSClient: jest.fn().mockImplementation(() => mockClient)
    };
});

describe('MikrotikService', () => {
    const config = {
        host: '192.168.1.1',
        username: 'admin',
        password: 'password',
        port: 8728
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect successfully', async () => {
            const client = await mikrotikService.connect(config);
            expect(client).toBe(mockClient);
            expect(mockClient.connect).toHaveBeenCalled();
        });
    });

    describe('createOrUpdateSecret', () => {
        it('should create a new secret if it does not exist', async () => {
            mockApi.get.mockResolvedValueOnce([]); // No existing user

            const subscriberData = {
                pppoeUsername: 'newuser',
                pppoePassword: 'secretpassword'
            };

            const result = await mikrotikService.createOrUpdateSecret(config, subscriberData);

            expect(result.success).toBe(true);
            expect(result.action).toBe('created');
            expect(mockApi.menu).toHaveBeenCalledWith('/ppp/secret');
            expect(mockApi.add).toHaveBeenCalledWith(expect.objectContaining({
                name: 'newuser',
                password: 'secretpassword',
                disabled: false
            }));
        });

        it('should update an existing secret', async () => {
            mockApi.get.mockResolvedValueOnce([{ '.id': '*1' }]); // Existing user

            const subscriberData = {
                pppoeUsername: 'existinguser',
                pppoePassword: 'newpassword'
            };

            const result = await mikrotikService.createOrUpdateSecret(config, subscriberData);

            expect(result.success).toBe(true);
            expect(result.action).toBe('updated');
            expect(mockApi.update).toHaveBeenCalledWith(
                expect.objectContaining({ password: 'newpassword' }),
                '*1'
            );
        });
    });

    describe('togglePppoeSecret', () => {
        it('should disable a user', async () => {
            mockApi.get
                .mockResolvedValueOnce([{ '.id': '*2', disabled: false }]) // secret
                .mockResolvedValueOnce([{ '.id': '*3' }]); // active session

            const result = await mikrotikService.togglePppoeSecret(config, 'user1', false);

            expect(result.success).toBe(true);
            expect(mockApi.update).toHaveBeenCalledWith({ disabled: true }, '*2');
            // Check kick logic
            expect(mockApi.menu).toHaveBeenCalledWith('/ppp/active');
            expect(mockApi.remove).toHaveBeenCalledWith('*3');
        });

        it('should enable a user', async () => {
             mockApi.get.mockResolvedValueOnce([{ '.id': '*2', disabled: true }]); // Existing user

             const result = await mikrotikService.togglePppoeSecret(config, 'user1', true);

             expect(result.success).toBe(true);
             expect(mockApi.update).toHaveBeenCalledWith({ disabled: false }, '*2');
        });
    });

    describe('deleteSecret', () => {
        it('should delete a user and kick active sessions', async () => {
            mockApi.get
                .mockResolvedValueOnce([{ '.id': '*2' }]) // secret
                .mockResolvedValueOnce([{ '.id': '*3' }]); // active

            const result = await mikrotikService.deleteSecret(config, 'user1');

            expect(result.success).toBe(true);
            expect(mockApi.remove).toHaveBeenCalledWith('*2'); // remove secret
            expect(mockApi.remove).toHaveBeenCalledWith('*3'); // remove active
        });
    });
});
