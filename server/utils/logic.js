const processSubscriber = (sub, now, settings = { rebateValue: 30 }) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Rebate Calculation
  const divisor = settings.rebateValue || 30;
  const dailyRate = sub.rate / divisor;
  const rebate = dailyRate * (sub.daysDown || 0);
  let amountDue = Math.round((sub.rate - rebate) * 100) / 100;
  if (amountDue <= 0) amountDue = 0; // Fix -0 issue and ensure no negative due

  let effectiveCycle = sub.cycle;

  // New logic for Partial Payments
  let status = sub.isPaidFeb2026 || amountDue === 0 ? 'Paid' : 'Unpaid';
  const remaining = sub.remainingBalance !== undefined ? sub.remainingBalance : amountDue;

  if (!sub.isPaidFeb2026 && remaining < amountDue && remaining > 0) {
    status = 'Partial';
  }

  // Handle Date Overflow (e.g. Feb 29 -> March 1)
  const dueDateObj = new Date(currentYear, currentMonth, effectiveCycle);
  const dueDateAtMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

  // Calculate Status based on full date comparison
  if (status !== 'Paid') {
    if (dueDateAtMidnight < todayAtMidnight) {
      status = 'Overdue';
    } else if (dueDateAtMidnight.getTime() === todayAtMidnight.getTime()) {
      status = 'Due Today';
    } else {
      // If it's not yet due, it's either Upcoming or Partial (stays Partial if it was already set)
      if (status === 'Unpaid') status = 'Upcoming';
    }
  }

  const formattedDueDate = `${dueDateObj.getFullYear()}-${(dueDateObj.getMonth() + 1).toString().padStart(2, '0')}-${dueDateObj.getDate().toString().padStart(2, '0')}`;

  return {
    amountDue, // Full amount due after rebate
    remainingBalance: Math.round(remaining * 100) / 100,
    rebate: Math.round(rebate * 100) / 100,
    dailyRate: Math.round(dailyRate * 100) / 100,
    status,
    effectiveCycle,
    dueDate: formattedDueDate,
    dueDateAtMidnight,
    hasReceipt: (sub.payments || []).some(p => p.month === 'February 2026' && p.receiptImage)
  };
};

const calculateStats = (subscribers, now, settings = { rebateValue: 30 }) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dueToday = 0, overdue = 0, totalCollections = 0;
  let totalMonthlyRevenue = 0;

  subscribers.forEach(sub => {
    if (sub.isArchived) return; // Exclude archived from stats

    const processed = processSubscriber(sub, now, settings);
    const { amountDue, status } = processed;

    totalMonthlyRevenue += amountDue;

    // Sum all payments for Feb 2026
    const febPayments = (sub.payments || [])
      .filter(p => p.month === 'February 2026')
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    totalCollections += febPayments;

    if (!sub.isPaidFeb2026) {
      if (status === 'Overdue') overdue++;
      else if (status === 'Due Today') dueToday++;
    }
  });

  return {
    dueToday,
    overdue,
    totalCollections: Math.round(totalCollections * 100) / 100,
    totalSubscribers: subscribers.length,
    totalMonthlyRevenue: Math.round(totalMonthlyRevenue * 100) / 100
  };
};

module.exports = {
  processSubscriber,
  calculateStats
};
