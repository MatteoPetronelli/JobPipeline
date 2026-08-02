import { dbRun, closeDb } from "../db/database.js";

const run = async () => {
  try {
    const mockCompanies = [
      "BigBank",
      "StartupX",
      "AgencyY",
      "DistantCorp",
      "TechCorp",
    ];

    const placeholders = mockCompanies.map(() => "?").join(",");
    const query = `DELETE FROM jobs WHERE companyName IN (${placeholders}) OR jobTitle = ?`;

    await dbRun(query, [
      ...mockCompanies,
      "Développeur Fullstack React Node.js",
    ]);
  } finally {
    await closeDb();
  }
};

run();
