require("dotenv").config();
const mongoose = require("mongoose");
const Subscriber = require("./models/Subscriber");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/bayadnet";

const seedData = [
  { name: "Bonete", rate: 500, cycleDay: 7, creditType: "one_month" },
  { name: "Villano Ceasar", rate: 400, cycleDay: 3, creditType: "two_weeks" },
  { name: "Villano Loriegen", rate: 400, cycleDay: 6, creditType: "two_weeks" },
  { name: "Kuya Glenn Store", rate: 300, cycleDay: 11, creditType: "two_weeks" },
  { name: "MCGI", rate: 400, cycleDay: 13, creditType: "two_weeks" },
  { name: "Collantes", rate: 400, cycleDay: 13, creditType: "two_weeks" },
  { name: "Viray Kim Ashley", rate: 400, cycleDay: 15, creditType: "two_weeks" },
  { name: "Villano Julie", rate: 400, cycleDay: 16, creditType: "two_weeks" },
  { name: "Gilbert Lombz", rate: 400, cycleDay: 16, creditType: "two_weeks" },
  { name: "Melgar", rate: 400, cycleDay: 17, creditType: "two_weeks" },
  { name: "Kuya Colin", rate: 400, cycleDay: 18, creditType: "two_weeks" },
  { name: "Ate Edna", rate: 400, cycleDay: 26, creditType: "two_weeks" },
  { name: "Imperial", rate: 400, cycleDay: 27, creditType: "two_weeks" }
];

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  const operations = seedData.map((subscriber) => {
    return Subscriber.updateOne(
      { name: subscriber.name },
      {
        $set: {
          rate: subscriber.rate,
          cycleDay: subscriber.cycleDay,
          creditType: subscriber.creditType,
          creditAppliedMonth: "2026-02"
        },
        $setOnInsert: { payments: [] }
      },
      { upsert: true }
    );
  });

  await Promise.all(operations);
  console.log("Seed complete");
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
