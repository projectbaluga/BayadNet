const processSubscriber = (sub, now, settings = { rebateValue: 30 }) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = `${monthNames[currentMonth]} ${currentYear}`;

  // Rebate Calculation
  const divisor = settings.rebateValue || 30;
  const dailyRate = sub.rate / divisor;
  const rebate = dailyRate * (sub.daysDown || 0);
  let amountDue = Math.round((sub.rate - rebate) * 100) / 100;
  if (amountDue <= 0) amountDue = 0; // Fix -0 issue and ensure no negative due

  let effectiveCycle = sub.cycle;

  // Dynamic Payment Check
  const monthPayments = (sub.payments || [])
    .filter(p => p.month === currentMonthName)
    .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  // For backward compatibility with the hardcoded field if it exists
  const legacyPaidField = `isPaid${currentMonthName.replace(' ', '')}`;
  const isPaid = sub[legacyPaidField] || monthPayments >= amountDue || (amountDue === 0);

  let status = isPaid ? 'Paid' : 'Unpaid';

  // Handle Date Overflow (e.g. Feb 29 -> March 1)
  // Check if we need to shift to next month due to new installation logic
  let targetYear = currentYear;
  let targetMonth = currentMonth;

  const cycleDateCurrentMonth = new Date(currentYear, currentMonth, effectiveCycle);
  // Compare timestamps to be safe (ensure both are midnight based or date based)
  const cycleTimestamp = new Date(cycleDateCurrentMonth.getFullYear(), cycleDateCurrentMonth.getMonth(), cycleDateCurrentMonth.getDate()).getTime();

  // Logic: If startDate exists and is ON or AFTER the current month's cycle date
  // AND no payments have been made for this month
  // THEN shift the cycle to the next month (Grace Period for new installs)
  if (sub.startDate) {
    const startDateObj = new Date(sub.startDate);
    const startDateTimestamp = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()).getTime();

    if (startDateTimestamp >= cycleTimestamp && monthPayments === 0) {
       targetMonth++;
       // JS Date automatically handles month overflow (12 -> Jan next year) in the constructor,
       // but we should set variables cleanly if we want to construct string names or logging
    }
  }

  const dueDateObj = new Date(targetYear, targetMonth, effectiveCycle);
  const dueDateAtMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

  // Use remainingBalance if it exists, otherwise calculate it
  const remaining = sub.remainingBalance !== undefined ? sub.remainingBalance : Math.max(0, amountDue - monthPayments);

  if (!isPaid && remaining < amountDue && remaining > 0) {
    status = 'Partial';
  }

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
    hasReceipt: (sub.payments || []).some(p => p.month === currentMonthName && p.receiptImage),
    currentMonthName
  };
};

const calculateStats = (subscribers, now, settings = { rebateValue: 30 }) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  let dueToday = 0, overdue = 0, totalCollections = 0;
  let totalMonthlyRevenue = 0;

  subscribers.forEach(sub => {
    if (sub.isArchived) return; // Exclude archived from stats

    const processed = processSubscriber(sub, now, settings);
    const { amountDue, status } = processed;

    totalMonthlyRevenue += amountDue;

    // Sum all payments for current month
    const monthPayments = (sub.payments || [])
      .filter(p => p.month === currentMonthName)
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    totalCollections += monthPayments;

    // Dynamic check for status
    const legacyPaidField = `isPaid${currentMonthName.replace(' ', '')}`;
    const isPaid = sub[legacyPaidField] || monthPayments >= amountDue || (amountDue === 0);

    if (!isPaid) {
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
