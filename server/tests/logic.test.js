const { processSubscriber, calculateStats } = require('../utils/logic');

describe('Subscriber Logic', () => {
  const mockNow = new Date('2026-02-15T12:00:00Z');

  test('Regular subscriber - Upcoming', () => {
    const sub = { rate: 400, cycle: 20, creditType: 'None', isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Upcoming');
    expect(processed.amountDue).toBe(400);
    expect(processed.dueDate).toBe('2026-02-20');
  });

  test('Regular subscriber - Due Today', () => {
    const sub = { rate: 400, cycle: 15, creditType: 'None', isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Due Today');
  });

  test('Regular subscriber - Overdue', () => {
    const sub = { rate: 400, cycle: 10, creditType: 'None', isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Overdue');
  });

  test('Bonete - 1 Month Credit', () => {
    const sub = { rate: 500, cycle: 7, creditType: '1 Month', isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.status).toBe('Paid');
    expect(processed.amountDue).toBe(0);
  });

  test('Storm Credit - 2 Weeks Discount', () => {
    const sub = { rate: 400, cycle: 15, creditType: '2 Weeks', creditPreference: 'Discount', isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.amountDue).toBe(200);
    expect(processed.dueDate).toBe('2026-02-15');
  });

  test('Storm Credit - 2 Weeks Extension', () => {
    const sub = { rate: 400, cycle: 5, creditType: '2 Weeks', creditPreference: 'Extension', isPaidFeb2026: false };
    const processed = processSubscriber(sub, mockNow);
    expect(processed.amountDue).toBe(400);
    // 5 + 14 = 19
    expect(processed.dueDate).toBe('2026-02-19');
    expect(processed.status).toBe('Upcoming');
  });

  test('Stats calculation', () => {
    const subscribers = [
      { rate: 400, cycle: 10, creditType: 'None', isPaidFeb2026: false }, // Overdue
      { rate: 400, cycle: 15, creditType: 'None', isPaidFeb2026: false }, // Due Today
      { rate: 400, cycle: 20, creditType: 'None', isPaidFeb2026: false }, // Upcoming
      { rate: 500, cycle: 7, creditType: '1 Month', isPaidFeb2026: false }, // Paid (0 cost)
      { rate: 400, cycle: 13, creditType: '2 Weeks', creditPreference: 'Discount', isPaidFeb2026: true } // Paid (200 cost)
    ];

    const stats = calculateStats(subscribers, mockNow);
    expect(stats.overdue).toBe(1);
    expect(stats.dueToday).toBe(1);
    expect(stats.totalSubscribers).toBe(5);
    // 400 (Overdue) + 400 (Due Today) + 400 (Upcoming) + 0 (Bonete) + 200 (Storm Discount) = 1400
    expect(stats.totalMonthlyRevenue).toBe(1400);
    // 0 (Bonete) + 200 (Storm Discount Paid) = 200
    expect(stats.totalCollections).toBe(200);
  });
});
