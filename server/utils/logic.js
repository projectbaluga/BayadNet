const processSubscriber = (sub, now) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Rebate Calculation
  const dailyRate = sub.rate / 30;
  const rebate = dailyRate * (sub.daysDown || 0);
  let amountDue = Math.round((sub.rate - rebate) * 100) / 100;
  if (amountDue === 0) amountDue = 0; // Fix -0 issue

  let effectiveCycle = sub.cycle;
  let status = sub.isPaidFeb2026 ? 'Paid' : 'Unpaid';

  // Handle Date Overflow (e.g. Feb 29 -> March 1)
  const dueDateObj = new Date(currentYear, currentMonth, effectiveCycle);
  const dueDateAtMidnight = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());

  // Calculate Status based on full date comparison
  if (status === 'Unpaid') {
    if (dueDateAtMidnight < todayAtMidnight) status = 'Overdue';
    else if (dueDateAtMidnight.getTime() === todayAtMidnight.getTime()) status = 'Due Today';
    else status = 'Upcoming';
  }

  const formattedDueDate = `${dueDateObj.getFullYear()}-${(dueDateObj.getMonth() + 1).toString().padStart(2, '0')}-${dueDateObj.getDate().toString().padStart(2, '0')}`;

  return {
    amountDue,
    rebate: Math.round(rebate * 100) / 100,
    dailyRate: Math.round(dailyRate * 100) / 100,
    status,
    effectiveCycle,
    dueDate: formattedDueDate,
    dueDateAtMidnight
  };
};

const calculateStats = (subscribers, now) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dueToday = 0, overdue = 0, totalCollections = 0;
  let totalMonthlyRevenue = 0;

  subscribers.forEach(sub => {
    const { amountDue, status } = processSubscriber(sub, now);

    totalMonthlyRevenue += amountDue;

    if (sub.isPaidFeb2026) {
      totalCollections += amountDue;
    } else {
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
