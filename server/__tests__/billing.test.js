const {
  applyCreditAdjustment,
  createDueDate,
  resolveStatus
} = require("../lib/billing");

describe("billing helpers", () => {
  const currentDate = new Date("2026-02-15T00:00:00.000Z");
  const baseSubscriber = {
    rate: 1000,
    creditType: "none",
    creditAppliedMonth: null,
    payments: []
  };

  it("creates due dates within the current month boundaries", () => {
    const dueDate = createDueDate(currentDate, 31);
    expect(dueDate.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("applies two-week credit by extending due date when early in month", () => {
    const baseDueDate = new Date("2026-02-10T00:00:00.000Z");
    const adjustment = applyCreditAdjustment(
      { ...baseSubscriber, creditType: "two_weeks", creditAppliedMonth: "2026-02" },
      baseDueDate
    );

    expect(adjustment.adjustment).toBe("extended_due_date");
    expect(adjustment.adjustedDueDate.toISOString().slice(0, 10)).toBe("2026-02-24");
  });

  it("marks overdue subscribers when current date is past due date", () => {
    const status = resolveStatus(
      baseSubscriber,
      new Date("2026-02-01T00:00:00.000Z"),
      currentDate,
      "2026-02"
    );

    expect(status).toBe("Overdue");
  });
});
