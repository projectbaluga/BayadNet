const { RouterOSClient } = require('routeros-client');

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

    // Construct config for node-routeros
    // Note: Router model uses 'username', node-routeros uses 'user'
    const clientConfig = {
        host: config.host,
        user: config.username,
        password: config.password,
        port: config.port || 8728,
        keepalive: false
    };

    const client = new RouterOSClient(clientConfig);
    try {
        await client.connect();
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
   * Toggle PPPoE Secret Status
   */
  async togglePppoeSecret(config, username, enable, existingClient = null) {
    if (!this.isConfigured(config)) {
        return { success: false, message: 'Router Not Configured' };
    }

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
      await client.api().menu('/ppp/secret').where({'.id': id}).update({ disabled: disabled });

      if (!enable) {
         try {
             const active = await client.api().menu('/ppp/active').where({ name: username }).get();
             if (active.length > 0) {
                 const activeId = active[0]['.id'];
                 await client.api().menu('/ppp/active').where({'.id': activeId}).remove();
             }
         } catch (kickErr) {
             console.warn('Mikrotik: Failed to kick active user', kickErr.message);
         }
      }

      return { success: true, enabled: enable, message: `Successfully ${enable ? 'Enabled' : 'Disabled'}` };
    } catch (error) {
      console.error(`Mikrotik Error (${config.host}):`, error.message);
      return { success: false, message: error.message };
    } finally {
      if (shouldClose && client) {
          client.close();
      }
    }
  }

  async getPppoeStatus(config, username) {
     if (!this.isConfigured(config)) return { connected: false, message: 'Router Not Configured' };
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
           remoteAddress: active.length > 0 ? active[0].address : null
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
