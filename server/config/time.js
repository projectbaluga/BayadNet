/**
 * Virtual Clock Utility
 * Allows the system to toggle between real-world time and simulation mode.
 */
const getCurrentDate = () => {
  // If SIMULATION_DATE is set in env, use it (e.g., "2026-02-15")
  if (process.env.SIMULATION_DATE) {
    return new Date(process.env.SIMULATION_DATE);
  }

  // Default is now the actual server time (Today)
  return new Date();
};

module.exports = { getCurrentDate };
