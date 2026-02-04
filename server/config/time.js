/**
 * Virtual Clock Utility
 * Allows the system to toggle between real-world time and simulation mode.
 */
const getCurrentDate = () => {
  // If SIMULATION_DATE is set in env, use it (e.g., "2026-02-15")
  if (process.env.SIMULATION_DATE) {
    return new Date(process.env.SIMULATION_DATE);
  }

  // Default Simulation for the task requirements
  // Remove this line in a real "always-live" production environment
  if (process.env.NODE_ENV !== 'production') {
    return new Date('2026-02-15');
  }

  return new Date();
};

module.exports = { getCurrentDate };
