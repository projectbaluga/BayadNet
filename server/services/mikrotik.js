const { RouterOSClient } = require('node-routeros');

class MikrotikService {
  constructor() {
    this.config = {
      host: process.env.MIKROTIK_HOST,
      user: process.env.MIKROTIK_USER,
      password: process.env.MIKROTIK_PASSWORD,
      port: process.env.MIKROTIK_PORT || 8728,
      keepalive: false // Close after use to avoid stale connections
    };
  }

  isConfigured() {
    return this.config.host && this.config.user;
  }

  async connect() {
    if (!this.isConfigured()) {
      throw new Error('Mikrotik configuration missing (MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASSWORD)');
    }
    const client = new RouterOSClient(this.config);
    try {
        await client.connect();
        return client;
    } catch (err) {
        throw new Error(`Failed to connect to Mikrotik: ${err.message}`);
    }
  }

  /**
   * Check connection health
   */
  async checkHealth() {
    if (!this.isConfigured()) return { connected: false, message: 'Not Configured' };
    let client;
    try {
        client = await this.connect();
        // Just verify we can run a simple command
        const identity = await client.menu('/system/identity').get();
        return {
            connected: true,
            name: identity[0]?.name || 'Mikrotik',
            message: 'Connected'
        };
    } catch (error) {
        console.error('Mikrotik Health Check Error:', error.message);
        return { connected: false, message: error.message };
    } finally {
        if (client) client.close();
    }
  }

  /**
   * Toggle PPPoE Secret Status
   * @param {string} username - PPPoE Secret Name
   * @param {boolean} enable - True to enable (internet on), False to disable (internet off)
   * @param {object} [existingClient] - Optional existing RouterOSClient instance to reuse
   */
  async togglePppoeSecret(username, enable, existingClient = null) {
    if (!this.isConfigured()) {
        console.warn('Mikrotik: Not configured, skipping toggle.');
        return { success: false, message: 'Not Configured' };
    }

    let client = existingClient;
    const shouldClose = !existingClient; // Only close if we created the connection

    try {
      if (!client) {
          client = await this.connect();
      }

      // Get the secret to find its ID
      const secrets = await client.menu('/ppp/secret').where({ name: username }).get();

      if (secrets.length === 0) {
        return { success: false, message: `PPPoE user '${username}' not found in Router` };
      }

      const id = secrets[0]['.id']; // RouterOS usually uses .id

      // disabled=yes means Internet OFF.
      // If we want enable=true, we set disabled=false (no).
      // If we want enable=false, we set disabled=true (yes).
      const disabled = !enable;

      // Update
      await client.menu('/ppp/secret').set({ '.id': id, disabled: disabled });

      // If we disable, we should also kick the active connection so they disconnect immediately
      if (!enable) {
         try {
             const active = await client.menu('/ppp/active').where({ name: username }).get();
             if (active.length > 0) {
                 const activeId = active[0]['.id'];
                 await client.menu('/ppp/active').remove(activeId);
                 console.log(`Mikrotik: Kicked active session for ${username}`);
             }
         } catch (kickErr) {
             console.warn('Mikrotik: Failed to kick active user (might be already offline)', kickErr.message);
         }
      }

      console.log(`Mikrotik: ${username} set to ${enable ? 'Enabled' : 'Disabled'}`);
      return { success: true, enabled: enable, message: `Successfully ${enable ? 'Enabled' : 'Disabled'}` };
    } catch (error) {
      console.error('Mikrotik Error:', error);
      return { success: false, message: error.message };
    } finally {
      if (shouldClose && client) {
          client.close();
      }
    }
  }

  async getPppoeStatus(username) {
     if (!this.isConfigured()) return { connected: false, message: 'Not Configured' };
     let client;
     try {
       client = await this.connect();
       const secrets = await client.menu('/ppp/secret').where({ name: username }).get();

       if (secrets.length === 0) return { exists: false, message: 'User not found in Mikrotik' };

       // disabled=true -> Enabled=False
       // disabled=false -> Enabled=True
       const isEnabled = String(secrets[0].disabled) === 'false';

       // Check if currently active (online)
       const active = await client.menu('/ppp/active').where({ name: username }).get();
       const isOnline = active.length > 0;

       return {
           exists: true,
           enabled: isEnabled,
           online: isOnline,
           profile: secrets[0].profile,
           remoteAddress: active.length > 0 ? active[0].address : null
       };
     } catch (error) {
       console.error('Mikrotik Status Error:', error);
       return { error: error.message };
     } finally {
       if (client) client.close();
     }
  }
}

module.exports = new MikrotikService();
