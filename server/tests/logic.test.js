const { processSubscriber, calculateStats } = require('../utils/logic');

describe('Subscriber Rebate Logic', () => {
  const mockNow = new Date('2026-02-15T12:00:00Z');

  test('Regular subscriber - No outage', () => {
    const sub = { rate: 600, cycle: 20, daysDown: 0, isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Upcoming');
    expect(processed.amountDue).toBe(600);
    expect(processed.rebate).toBe(0);
    expect(processed.currentMonthLabel).toBe('February 2026');
  });

  test('Subscriber with 2 days outage', () => {
    // 600 / 30 = 20 daily rate. 2 days = 40 rebate.
    const sub = { rate: 600, cycle: 15, daysDown: 2, isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Due Today');
    expect(processed.amountDue).toBe(560);
    expect(processed.rebate).toBe(40);
  });

  test('Subscriber with 30 days outage (Free)', () => {
    const sub = { rate: 500, cycle: 7, daysDown: 30, isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.amountDue).toBe(0);
    expect(processed.rebate).toBe(500);
  });

  test('Rounding check', () => {
    // 400 / 30 = 13.333... 1 day down = 13.33 rebate. 400 - 13.33 = 386.67
    const sub = { rate: 400, cycle: 10, daysDown: 1, isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.rebate).toBe(13.33);
    expect(processed.amountDue).toBe(386.67);
  });

  test('Stats calculation with rebates', () => {
    const subscribers = [
      {
        rate: 600, cycle: 10, daysDown: 2, isPaidFeb2026: false,
        payments: [{ amountPaid: 100, month: 'February 2026' }]
      }, // 560 due, 100 paid -> Partial/Overdue
      {
        rate: 600, cycle: 15, daysDown: 0, isPaidFeb2026: true,
        payments: [{ amountPaid: 600, month: 'February 2026' }]
      }   // 600 due, 600 paid -> Paid
    ];

    const stats = calculateStats(subscribers, mockNow);
    expect(stats.overdue).toBe(1);
    expect(stats.totalMonthlyRevenue).toBe(1160); // 560 + 600
    expect(stats.totalCollections).toBe(700); // 100 + 600
    expect(stats.currentMonthLabel).toBe('February 2026');
  });

  test('Partial payment status', () => {
    const sub = {
      rate: 600, cycle: 25, daysDown: 0, isPaidFeb2026: false,
      remainingBalance: 300
    };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Partial');
    expect(processed.remainingBalance).toBe(300);
  });
});
