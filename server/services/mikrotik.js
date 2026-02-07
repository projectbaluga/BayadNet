const { RouterOSClient } = require('routeros-client');
const { decrypt } = require('../utils/encryption');
const { URL } = require('url');

function parseServerAddress(input) {
  let urlStr = input.trim();
  // Ensure protocol for parsing
  if (!urlStr.match(/^https?:\/\//)) {
      urlStr = 'http://' + urlStr;
  }

  try {
      const url = new URL(urlStr);
      const hostname = url.hostname;
      const port = url.port;

      let redirectUrl;
      const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);

      if (input.trim().match(/^https?:\/\//)) {
           redirectUrl = input.trim();
           if (!redirectUrl.includes('/payment-reminder')) {
                redirectUrl = redirectUrl.replace(/\/$/, '') + '/payment-reminder';
           }
      } else {
          if (isIp && !port) {
              redirectUrl = `http://${hostname}:3000/payment-reminder`;
          } else {
              redirectUrl = `http://${hostname}${port ? ':' + port : ''}/payment-reminder`;
          }
      }

      return { hostname, redirectUrl };

  } catch (e) {
      // Fallback
      return { hostname: input.trim(), redirectUrl: `http://${input.trim()}:3000/payment-reminder` };
  }
}

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

      const secrets = await client.api().menu('/ppp/secret').where({ name: username }).get();

      if (secrets.length === 0) {
        return { success: false, message: `PPPoE user '${username}' not found in Router` };
      }

      const id = secrets[0]['.id'];

      // Update profile
      await client.api().menu('/ppp/secret').update({ profile: profileName }, id);

      // Kick active sessions to apply new profile
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

  /**
   * Push Initial Configuration Script to Router
   * Now includes:
   * 1. IP Pool for PPPoE (bayadnet-pool)
   * 2. 'default' PPP Profile
   * 3. NAT Masquerade
   * 4. Web Proxy & Redirect Logic (for overdue)
   */
  async pushConfig(config, serverInput) {
    if (!this.isConfigured(config)) return { success: false, message: 'Router Not Configured' };
    if (!serverInput) return { success: false, message: 'Server Address required' };

    let client;
    try {
      client = await this.connect(config);

      const { hostname, redirectUrl } = parseServerAddress(serverInput);
      console.log(`Pushing config: Hostname=${hostname}, RedirectUrl=${redirectUrl}`);

      // --- PART 1: Core Networking Setup ---

      // 1. Create IP Pool
      try {
        const pools = await client.api().menu('/ip/pool').where({ name: 'bayadnet-pool' }).get();
        if (pools.length === 0) {
            await client.api().menu('/ip/pool').add({
                name: 'bayadnet-pool',
                ranges: '10.0.0.2-10.0.0.254',
                comment: 'Created by BayadNet'
            });
        }
      } catch (e) {
        console.warn('Failed to create IP pool:', e.message);
      }

      // 2. Configure 'default' PPP Profile
      try {
        const profiles = await client.api().menu('/ppp/profile').where({ name: 'default' }).get();
        if (profiles.length > 0) {
            // Update existing default profile to use our pool and DNS
            await client.api().menu('/ppp/profile').update({
                'local-address': '10.0.0.1',
                'remote-address': 'bayadnet-pool',
                'dns-server': '8.8.8.8,8.8.4.4',
                'change-tcp-mss': 'yes' // Best practice for PPPoE
            }, profiles[0]['.id']);
        }
      } catch (e) {
        console.warn('Failed to configure default profile:', e.message);
      }

      // 3. NAT Masquerade (Ensure internet access)
      try {
        const natRules = await client.api().menu('/ip/firewall/nat').where({ comment: 'BayadNet: Masquerade' }).get();
        if (natRules.length === 0) {
            await client.api().menu('/ip/firewall/nat').add({
                chain: 'srcnat',
                action: 'masquerade',
                'src-address': '10.0.0.0/24', // Matches our pool
                comment: 'BayadNet: Masquerade'
            });
        }
      } catch (e) {
         console.warn('Failed to create Masquerade rule:', e.message);
      }

      // --- PART 2: Overdue Redirect Logic ---

      // 4. Enable Web Proxy
      try {
          await client.api().menu('/ip/proxy').update({
              enabled: true,
              port: 8080
          });
      } catch (e) {
          console.warn('Failed to enable web proxy:', e.message);
      }

      // 5. Create Profile 'payment-reminder'
      try {
          const profiles = await client.api().menu('/ppp/profile').where({ name: 'payment-reminder' }).get();
          if (profiles.length === 0) {
              await client.api().menu('/ppp/profile').add({
                  name: 'payment-reminder',
                  'rate-limit': '512k/512k',
                  'local-address': '10.0.0.1', // Ensure it has valid IP config too
                  'remote-address': 'bayadnet-pool',
                  'dns-server': '8.8.8.8',
                  'address-list': 'overdue_users',
                  comment: 'Created by BayadNet - Redirects overdue users'
              });
          }
      } catch (e) {
          console.warn('Failed to create profile:', e.message);
      }

      // 6. Create Web Proxy Access Rule (The Redirection Logic)
      try {
          const accessRules = await client.api().menu('/ip/proxy/access').where({ comment: 'Redirect Overdue' }).get();
          if (accessRules.length === 0) {
              await client.api().menu('/ip/proxy/access').add({
                  'src-address-list': 'overdue_users',
                  action: 'deny',
                  'redirect-to': redirectUrl,
                  comment: 'Redirect Overdue'
              });
          } else {
              // Update redirect URL if needed
              await client.api().menu('/ip/proxy/access').update({
                  'redirect-to': redirectUrl
              }, accessRules[0]['.id']);
          }
      } catch (e) {
          console.warn('Failed to create proxy access rule:', e.message);
      }

      // 7. Create NAT Rule (Redirect to Web Proxy)
      try {
          const natRules = await client.api().menu('/ip/firewall/nat').where({ comment: 'Redirect Overdue Users to Proxy' }).get();
          if (natRules.length === 0) {
              // Add BEFORE masquerade (index 0) to ensure it hits
              await client.api().menu('/ip/firewall/nat').add({
                  chain: 'dstnat',
                  action: 'redirect',
                  'to-ports': '8080',
                  protocol: 'tcp',
                  'dst-port': '80',
                  'src-address-list': 'overdue_users',
                  comment: 'Redirect Overdue Users to Proxy',
                  place: 'before' // Try to place at top
              });
              // Note: 'place' might not work in all API versions or libs, but we try.
              // If it appends, user might need to move it up if other dstnat rules exist.
          }
      } catch (e) {
          console.warn('Failed to create NAT rule:', e.message);
      }

      // 8. Update Address List for Server (Host)
      try {
          const listName = 'payment_portal_server';
          const listItems = await client.api().menu('/ip/firewall/address-list').where({ list: listName }).get();

          if (listItems.length > 0) {
              // Check if address matches
              const item = listItems[0];
              if (item.address !== hostname) {
                  await client.api().menu('/ip/firewall/address-list').update({ address: hostname }, item['.id']);
              }
          } else {
              await client.api().menu('/ip/firewall/address-list').add({
                  list: listName,
                  address: hostname,
                  comment: 'BayadNet Portal Server'
              });
          }
      } catch (e) {
          console.warn('Failed to update address list:', e.message);
      }

      // 9. Create Filter Rules (Block others)
      try {
          // Allow DNS
          const dnsRules = await client.api().menu('/ip/firewall/filter').where({ comment: 'Allow DNS for Overdue' }).get();
          if (dnsRules.length === 0) {
              await client.api().menu('/ip/firewall/filter').add({
                  chain: 'forward',
                  action: 'accept',
                  'src-address-list': 'overdue_users',
                  protocol: 'udp',
                  'dst-port': '53',
                  comment: 'Allow DNS for Overdue'
              });
          }

          // Allow Server (Using Address List now)
          let serverRules = await client.api().menu('/ip/firewall/filter').where({ comment: 'Allow Access to Server for Overdue' }).get();
          const targetList = 'payment_portal_server';

          if (serverRules.length > 0) {
              const rule = serverRules[0];
              // If it uses dst-address or doesn't use our target list, remove it to replace with cleaner rule
              if (rule['dst-address'] || rule['dst-address-list'] !== targetList) {
                  await client.api().menu('/ip/firewall/filter').remove(rule['.id']);
                  serverRules = []; // Reset so we create new one below
              }
          }

          if (serverRules.length === 0) {
              await client.api().menu('/ip/firewall/filter').add({
                  chain: 'forward',
                  action: 'accept',
                  'src-address-list': 'overdue_users',
                  'dst-address-list': targetList,
                  comment: 'Allow Access to Server for Overdue'
              });
          }

          // Drop Everything Else
          const dropRules = await client.api().menu('/ip/firewall/filter').where({ comment: 'Block Everything Else for Overdue' }).get();
          if (dropRules.length === 0) {
              await client.api().menu('/ip/firewall/filter').add({
                  chain: 'forward',
                  action: 'drop',
                  'src-address-list': 'overdue_users',
                  comment: 'Block Everything Else for Overdue'
              });
          }
      } catch (e) {
          console.warn('Failed to create filter rules:', e.message);
      }

      return { success: true, message: 'Full configuration pushed successfully (Pool, Profiles, NAT, Proxy)' };

    } catch (error) {
      console.error(`Mikrotik Push Config Error (${config.host}):`, error.message);
      return { success: false, message: error.message };
    } finally {
      if (client) client.close();
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
