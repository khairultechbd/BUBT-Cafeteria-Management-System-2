import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase, closeAllConnections } from "../config/dbManager.js";
import { getUserModel } from "../utils/modelFactory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sampleNames = [
  "Sweety Lima",
  "Farhana Islam",
  "Tanvir Rahman",
  "Nusrat Jahan",
  "Mahmud Hasan",
  "Sadia Alam",
  "Shafiqul Haque",
  "Taslima Akter",
  "Rafiq Chowdhury",
  "Sharmin Akhter",
  "Asif Mahmud",
  "Rumana Begum",
  "Kamal Uddin",
  "Mitu Rahman",
  "Hasan Ali"
];

async function createTeachers() {
  try {
    console.log("👩‍🏫 Seeding 15 teacher accounts into db2 (Teacher Fragment)...\n");

    const dbKey = "db2"; // Teachers → DB2
    await connectToDatabase(dbKey);
    const User = await getUserModel(dbKey);

    for (let i = 0; i < sampleNames.length; i++) {
      const name = sampleNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
      const password = `teacher`;
      const role = "teacher";

      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`⏭️ Skipped: ${name} (already exists)`);
        continue;
      }

      const teacher = new User({
        name,
        email,
        password,
        role,
        status: "active", // teachers need admin approval
        department: "Teaching Department"
      });

      await teacher.save();
      console.log(`✅ Created: ${name} | Email: ${email} | Password: ${password}`);
    }

    console.log("\n🎉 All teacher accounts created successfully!");
  } catch (error) {
    console.error("❌ Error creating teacher accounts:", error);
  } finally {
    await closeAllConnections();
  }
}

createTeachers();
