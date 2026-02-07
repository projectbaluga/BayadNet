const { RouterOSClient } = require('routeros-client');
const { decrypt } = require('../utils/encryption');

class MikrotikService {
  constructor() {
    // No global config anymore
  }

  isConfigured(config) {
    return config && config.host && config.username;
  }

  async connect(config) {
    if (!this.isConfigured(config)) {
      throw new Error('Mikrotik configuration missing (host, username, password)');
    }

    // Decrypt password
    const password = decrypt(config.password);

    // Construct config for node-routeros
    // Note: Router model uses 'username', node-routeros uses 'user'
    const clientConfig = {
        host: config.host,
        user: config.username,
        password: password, // Use decrypted password
        port: config.port || 8728,
        keepalive: false
    };

    const client = new RouterOSClient(clientConfig);

    // Add manual timeout wrapper
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out')), 5000)
    );

    try {
        await Promise.race([connectPromise, timeoutPromise]);
        return client;
    } catch (err) {
        throw new Error(`Failed to connect to Mikrotik (${config.host}): ${err.message}`);
    }
  }

  /**
   * Check connection health for a specific router config
   */
  async checkHealth(config) {
    if (!this.isConfigured(config)) return { connected: false, message: 'Not Configured' };
    let client;
    try {
        client = await this.connect(config);
        const identity = await client.api().menu('/system/identity').get();
        return {
            connected: true,
            name: identity[0]?.name || 'Mikrotik',
            message: 'Connected',
            host: config.host
        };
    } catch (error) {
        // console.error(`Mikrotik Health Check Error (${config.host}):`, error.message);
        return { connected: false, message: error.message, host: config.host };
    } finally {
        if (client) client.close();
    }
  }

  /**
   * Create or Update PPPoE Secret
   */
  async createOrUpdateSecret(config, subscriberData) {
      if (!this.isConfigured(config)) {
          return { success: false, message: 'Router Not Configured' };
      }

      const username = subscriberData.pppoeUsername?.trim();
      let password = subscriberData.pppoePassword;

      // Decrypt if necessary (if it looks like IV:Encrypted)
      if (password && password.includes(':')) {
          password = decrypt(password);
      }

      const profile = subscriberData.pppoeProfile || 'default'; // Or determine based on plan
      const service = 'pppoe';

      if (!username) return { success: false, message: 'No PPPoE Username provided' };

      let client;
      try {
          client = await this.connect(config);

          // Check if exists
          const secrets = await client.api().menu('/ppp/secret').where({ name: username }).get();

          if (secrets.length > 0) {
              // Update
              const id = secrets[0]['.id'];
              const updateData = {};

              // Only update if changed or to ensure consistency
              if (password) updateData.password = password;
              if (profile) updateData.profile = profile;

              if (Object.keys(updateData).length > 0) {
                  await client.api().menu('/ppp/secret').update(updateData, id);
              }

              return { success: true, action: 'updated', message: `Updated PPPoE user '${username}'` };
          } else {
              // Create
              if (!password) return { success: false, message: 'Password required for new PPPoE user' };

              await client.api().menu('/ppp/secret').add({
                  name: username,
                  password: password,
                  profile: profile,
                  service: service,
                  disabled: false // Enable by default on creation
              });

              return { success: true, action: 'created', message: `Created PPPoE user '${username}'` };
          }
      } catch (error) {
          console.error(`Mikrotik Create/Update Error (${config.host}):`, error.message);
          return { success: false, message: error.message };
      } finally {
          if (client) client.close();
      }
  }

  /**
   * Toggle PPPoE Secret Status
   */
  async togglePppoeSecret(config, username, enable, existingClient = null) {
    if (!this.isConfigured(config)) {
        return { success: false, message: 'Router Not Configured' };
    }

    username = username?.trim();
    if (!username) return { success: false, message: 'Invalid Username' };

    let client = existingClient;
    const shouldClose = !existingClient;

    try {
      if (!client) {
          client = await this.connect(config);
      }

      const secrets = await client.api().menu('/ppp/secret').where({ name: username }).get();

      if (secrets.length === 0) {
        return { success: false, message: `PPPoE user '${username}' not found in Router` };
      }

      const id = secrets[0]['.id'];
      const disabled = !enable;

      // Use .update() with the found ID
      await client.api().menu('/ppp/secret').update({ disabled: disabled }, id);

      if (!enable) {
         try {
             // Remove from active connections to disconnect immediately
             const active = await client.api().menu('/ppp/active').where({ name: username }).get();
             // There might be multiple sessions (though unlikely for PPPoE unless allowed)
             for (const session of active) {
                 await client.api().menu('/ppp/active').remove(session['.id']);
             }
         } catch (kickErr) {
             console.warn('Mikrotik: Failed to kick active user', kickErr.message);
         }
      }

      return { success: true, enabled: enable, message: `Successfully ${enable ? 'Enabled' : 'Disabled'}` };
    } catch (error) {
      console.error(`Mikrotik Toggle Error (${config.host}):`, error.message);
      return { success: false, message: error.message };
    } finally {
      if (shouldClose && client) {
          client.close();
      }
    }
  }

  /**
   * Delete PPPoE Secret
   */
  async deleteSecret(config, username) {
    if (!this.isConfigured(config)) return { success: false, message: 'Router Not Configured' };

    username = username?.trim();
    if (!username) return { success: false, message: 'Invalid Username' };

    let client;
    try {
        client = await this.connect(config);

        // Find secret
        const secrets = await client.api().menu('/ppp/secret').where({ name: username }).get();
        if (secrets.length > 0) {
            const id = secrets[0]['.id'];
            await client.api().menu('/ppp/secret').remove(id);
        }

        // Kick active sessions
        try {
             const active = await client.api().menu('/ppp/active').where({ name: username }).get();
             for (const session of active) {
                 await client.api().menu('/ppp/active').remove(session['.id']);
             }
        } catch (kickErr) {
             console.warn('Mikrotik: Failed to kick user on delete', kickErr.message);
        }

        return { success: true, message: `Deleted PPPoE user '${username}'` };
    } catch (error) {
        console.error(`Mikrotik Delete Error (${config.host}):`, error.message);
        return { success: false, message: error.message };
    } finally {
        if (client) client.close();
    }
  }

  /**
   * Get all PPP profiles
   */
  async getProfiles(config) {
    if (!this.isConfigured(config)) return [];
    let client;
    try {
      client = await this.connect(config);
      const profiles = await client.api().menu('/ppp/profile').get();
      return profiles.map(p => p.name);
    } catch (error) {
      console.error(`Mikrotik Get Profiles Error (${config.host}):`, error.message);
      return [];
    } finally {
      if (client) client.close();
    }
  }

  /**
   * Set PPPoE Secret Profile (and kick user to apply)
   */
  async setPppoeProfile(config, username, profileName, existingClient = null) {
    if (!this.isConfigured(config)) {
        return { success: false, message: 'Router Not Configured' };
    }

    username = username?.trim();
    if (!username) return { success: false, message: 'Invalid Username' };

    let client = existingClient;
    const shouldClose = !existingClient;

    try {
      if (!client) {
          client = await this.connect(config);
      }

      // Check if profile exists first (Safety Check)
      if (profileName !== 'default') {
          const profiles = await client.api().menu('/ppp/profile').where({ name: profileName }).get();
          if (profiles.length === 0) {
              console.warn(`Mikrotik: Target profile '${profileName}' not found. Falling back to default.`);
              profileName = 'default';
          }
      }

      const secrets = await client.api().menu('/ppp/secret').where({ name: username }).get();

      if (secrets.length === 0) {
        return { success: false, message: `PPPoE user '${username}' not found in Router` };
      }

      const id = secrets[0]['.id'];

      // Update profile
      await client.api().menu('/ppp/secret').update({ profile: profileName }, id);

      // Kick active sessions to apply new profile and new IP pool
      try {
           const active = await client.api().menu('/ppp/active').where({ name: username }).get();
           for (const session of active) {
               await client.api().menu('/ppp/active').remove(session['.id']);
           }
      } catch (kickErr) {
           console.warn('Mikrotik: Failed to kick user on profile change', kickErr.message);
      }

      return { success: true, message: `Updated profile for '${username}' to '${profileName}'` };
    } catch (error) {
      console.error(`Mikrotik Set Profile Error (${config.host}):`, error.message);
      return { success: false, message: error.message };
    } finally {
      if (shouldClose && client) {
          client.close();
      }
    }
  }

  async getPppoeStatus(config, username) {
     if (!this.isConfigured(config)) return { connected: false, message: 'Router Not Configured' };
     username = username?.trim();

     let client;
     try {
       client = await this.connect(config);
       const secrets = await client.api().menu('/ppp/secret').where({ name: username }).get();

       if (secrets.length === 0) return { exists: false, message: 'User not found in Mikrotik' };

       const isEnabled = String(secrets[0].disabled) === 'false';
       const active = await client.api().menu('/ppp/active').where({ name: username }).get();
       const isOnline = active.length > 0;

       return {
           exists: true,
           enabled: isEnabled,
           online: isOnline,
           profile: secrets[0].profile,
           remoteAddress: active.length > 0 ? active[0].address : null,
           uptime: active.length > 0 ? active[0].uptime : null
       };
     } catch (error) {
       console.error(`Mikrotik Status Error (${config.host}):`, error.message);
       return { error: error.message };
     } finally {
       if (client) client.close();
     }
  }
}

module.exports = new MikrotikService();
