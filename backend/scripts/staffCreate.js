// backend/scripts/createStaffs.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase, closeAllConnections } from "../config/dbManager.js";
import { getUserModel } from "../utils/modelFactory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 🧑‍🍳 Sample staff names
const sampleStaffNames = [
  "Hasan Ali",
  "Nusrat Jahan",
  "Rafiq Chowdhury",
  "Sadia Alam",
  "Tanvir Rahman",
  "Taslima Akter",
  "Mahmud Hasan",
  "Sharmin Akhter",
  "Asif Mahmud",
  "Rumana Begum",
  "Kamal Uddin",
  "Mitu Rahman",
  "Farhana Islam",
  "Shafiqul Haque",
  "Abdul Malek"
];

// ✏️ Default password (you can change here any time)
const DEFAULT_PASSWORD = "staff";

async function createStaffs() {
  try {
    console.log("👷‍♂️ Seeding 15 staff accounts into db3 (Staff Fragment)...\n");

    const dbKey = "db3"; // Staff → DB3
    await connectToDatabase(dbKey);
    const User = await getUserModel(dbKey);

    for (let i = 0; i < sampleStaffNames.length; i++) {
      const name = sampleStaffNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
      const password = DEFAULT_PASSWORD;
      const role = "staff";

      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`⏭️ Skipped: ${name} (already exists)`);
        continue;
      }

      const staff = new User({
        name,
        email,
        password,
        role,
        status: "active",
        department: "Cafeteria Staff"
      });

      await staff.save();
      console.log(`✅ Created: ${name} | Email: ${email} | Password: ${password}`);
    }

    console.log("\n🎉 All staff accounts created successfully!");
  } catch (error) {
    console.error("❌ Error creating staff accounts:", error);
  } finally {
    await closeAllConnections();
  }
}

createStaffs();
