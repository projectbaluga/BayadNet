const CURRENT_MONTH = "2026-02";

const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const createDueDate = (currentDate, cycleDay) => {
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const maxDay = daysInMonth(year, monthIndex);
  const safeDay = Math.min(cycleDay, maxDay);
  return new Date(Date.UTC(year, monthIndex, safeDay));
};

const applyCreditAdjustment = (subscriber, baseDueDate, currentMonth = CURRENT_MONTH) => {
  if (subscriber.creditType !== "two_weeks" || subscriber.creditAppliedMonth !== currentMonth) {
    return {
      adjustedDueDate: baseDueDate,
      adjustedAmount: subscriber.rate,
      adjustment: "none"
    };
  }

  const dueDay = baseDueDate.getUTCDate();
  if (dueDay <= 14) {
    const adjustedDueDate = new Date(baseDueDate);
    adjustedDueDate.setUTCDate(adjustedDueDate.getUTCDate() + 14);
    return {
      adjustedDueDate,
      adjustedAmount: subscriber.rate,
      adjustment: "extended_due_date"
    };
  }

  return {
    adjustedDueDate: baseDueDate,
    adjustedAmount: subscriber.rate * 0.5,
    adjustment: "half_off"
  };
};

const resolveStatus = (subscriber, adjustedDueDate, currentDate, currentMonth = CURRENT_MONTH) => {
  if (subscriber.creditType === "one_month" && subscriber.creditAppliedMonth === currentMonth) {
    return "Paid/Skipped";
  }

  const payment = subscriber.payments.find((entry) => entry.month === currentMonth);
  if (payment) {
    return "Paid";
  }

  const normalizedCurrentDate = new Date(Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  ));
  const dueDate = new Date(Date.UTC(
    adjustedDueDate.getUTCFullYear(),
    adjustedDueDate.getUTCMonth(),
    adjustedDueDate.getUTCDate()
  ));

  if (normalizedCurrentDate.getTime() === dueDate.getTime()) {
    return "Due Today";
  }

  if (normalizedCurrentDate > dueDate) {
    return "Overdue";
  }

  return "Due";
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const mapSubscriber = (subscriber, currentDate, currentMonth = CURRENT_MONTH) => {
  const baseDueDate = createDueDate(currentDate, subscriber.cycleDay);
  const credit = applyCreditAdjustment(subscriber, baseDueDate, currentMonth);
  const status = resolveStatus(subscriber, credit.adjustedDueDate, currentDate, currentMonth);

  const amount = status === "Paid/Skipped" ? 0 : credit.adjustedAmount;

  return {
    id: subscriber._id,
    name: subscriber.name,
    rate: subscriber.rate,
    cycleDay: subscriber.cycleDay,
    status,
    dueDate: formatDate(credit.adjustedDueDate),
    amount,
    adjustment: credit.adjustment,
    creditType: subscriber.creditType
  };
};

module.exports = {
  applyCreditAdjustment,
  createDueDate,
  formatDate,
  mapSubscriber,
  resolveStatus
};
