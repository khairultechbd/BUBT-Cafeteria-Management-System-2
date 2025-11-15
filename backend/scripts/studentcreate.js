// scripts/createStudents.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase, closeAllConnections } from "../config/dbManager.js";
import { getUserModel } from "../utils/modelFactory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Generate 15 student accounts with simple IDs
const students = Array.from({ length: 15 }, (_, i) => ({
  name: `Student ${i + 1}`,
  email: `student${i + 1}@gmail.com`,
  password: "student",
  role: "student",
  department: "CSE",
  status: "active",
  approved: true,
  studentId: `STU${String(i + 1).padStart(3, "0")}`, // e.g., STU001, STU002, ...
}));

async function createStudents() {
  try {
    console.log("🎓 Creating 15 student accounts with fragmentation...");

    // All students go to db1 (as per fragmentation rule)
    const dbKey = "db1";
    await connectToDatabase(dbKey);
    const User = await getUserModel(dbKey);

    let created = 0;
    let skipped = 0;

    for (const s of students) {
      const existing = await User.findOne({ email: s.email });
      if (existing) {
        console.log(`⏭️  Skipped: ${s.email} already exists`);
        skipped++;
        continue;
      }
      const newStudent = new User(s);
      await newStudent.save();
      console.log(`✅ Created: ${s.name} (${s.email}) → ${s.studentId} ${s.password}`);
      created++;
    }

    console.log("\n📊 Summary:");
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Error creating students:", error);
  } finally {
    await closeAllConnections();
  }
}

createStudents();
