import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDatabase, closeAllConnections } from "../config/dbManager.js";
import { getUserModel } from "../utils/modelFactory.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ===== CONFIGURATION =====
const DEFAULT_PASSWORD = "student"; // Change anytime if needed
const TOTAL_STUDENTS = 15;

// ===== SAMPLE STUDENT NAMES =====
const studentNames = [
  "Khairul Islam",
  "Aman Ullah",
  "Zehad Khan",
  "Shabbir",
  "Roky Khan",
  "Rafsan Chowdhury",
  "Jannat Ara",
  "Mehedi Hasan",
  "Sumaiya Akter",
  "Rubel Mia",
  "Asma Khatun",
  "Tariq Ahmed",
  "Shakib Ali",
  "Nasrin Akter",
  "Zahid Hasan"
];

// ===== FUNCTION TO CREATE STUDENT ID =====
function generateStudentID(index) {
  const year = new Date().getFullYear().toString().slice(-2);
  return `STU${year}${String(index + 1).padStart(3, "0")}`; // Example: STU25001
}

async function createStudents() {
  try {
    console.log("🎓 Seeding 15 Student accounts into DB1 (User_Frag1)...\n");

    const dbKey = "db1"; // Students → DB1
    await connectToDatabase(dbKey);
    const User = await getUserModel(dbKey);

    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
      const password = DEFAULT_PASSWORD;
      const role = "student";
      const studentId = generateStudentID(i);

      const existing = await User.findOne({ $or: [{ email }, { studentId }] });
      if (existing) {
        console.log(`⏭️ Skipped: ${name} (already exists)`);
        continue;
      }

      const student = new User({
        name,
        email,
        password,
        role,
        studentId,
        status: "active",
        department: "Students Department"
      });

      await student.save();
      console.log(`✅ Created: ${name} | Email: ${email} | Student ID: ${studentId} | Password: ${password}`);
    }

    console.log("\n🎉 All student accounts created successfully!");
  } catch (error) {
    console.error("❌ Error creating student accounts:", error);
  } finally {
    await closeAllConnections();
  }
}

createStudents();
