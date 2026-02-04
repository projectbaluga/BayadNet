const processSubscriber = (sub, now) => {
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let amountDue = sub.rate;
  let effectiveCycle = sub.cycle;
  let status = sub.isPaidFeb2026 ? 'Paid' : 'Unpaid';

  // Apply Credit Logic
  if (sub.creditType === '2 Weeks') {
    if (sub.creditPreference === 'Discount') {
      amountDue = sub.rate * 0.5;
    } else if (sub.creditPreference === 'Extension') {
      effectiveCycle = sub.cycle + 14;
    }
  } else if (sub.creditType === '1 Month') {
    amountDue = 0;
    status = 'Paid';
  }

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

    if (sub.isPaidFeb2026 || sub.creditType === '1 Month') {
      totalCollections += amountDue;
    } else {
      if (status === 'Overdue') overdue++;
      else if (status === 'Due Today') dueToday++;
    }
  });

  return {
    dueToday,
    overdue,
    totalCollections,
    totalSubscribers: subscribers.length,
    totalMonthlyRevenue
  };
};

module.exports = {
  processSubscriber,
  calculateStats
};
