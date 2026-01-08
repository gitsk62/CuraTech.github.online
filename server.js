const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/upload", upload.single("prescription"), (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!req.file) return res.status(400).json({ success: false });

    fs.appendFileSync(
      "records.txt",
      `Name: ${name}, Phone: ${phone}, File: ${req.file.filename}\n`
    );

    res.json({
      success: true,
      message: "Prescription submitted successfully. Our pharmacist will contact you shortly."
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "MEDTECH_SECURE_KEY";
let users = [];
if (fs.existsSync("users.json")) {
  const data = fs.readFileSync("users.json", "utf8");
  users = data ? JSON.parse(data) : [];
}


function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, message: "Missing fields" });

  if (users.find(u => u.email === email))
    return res.json({ success: false, message: "User already exists" });

  const hash = await bcrypt.hash(password, 10);
  users.push({ email, password: hash });
  saveUsers();

  res.json({ success: true });
});
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ success: false, message: "Wrong password" });

  const token = jwt.sign({ email }, SECRET, { expiresIn: "2h" });
  res.json({ success: true, token });
});