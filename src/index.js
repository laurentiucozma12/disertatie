require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("../src/config/config");

const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");

const server = express();
// convert data into json format
server.use(express.json());

// Static file
server.use(express.static("public"));

server.use(express.urlencoded({ extended: false }));
//use EJS as the view engine
server.set("view engine", "ejs");

server.get("/", (req, res) => {
  res.render("home");
});

server.get("/register", (req, res) => {
  res.render("register");
});

// Register User
server.post("/register", async (req, res) => {
  const data = {
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
  };

  // Check if the email already exists in the database
  const existingUser = await collection.findOne({ email: data.email });

  if (existingUser) {
    res.send("Email already exists. Please choose a different email.");
  } else {
    // Hash the password using bcrypt
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword; // Replace the original password with the hashed one

    const userdata = await collection.insertMany(data);
    console.log(userdata);

    // Redirect to login page after successful registration
    res.redirect("/login?message=User+registered+successfully!");
  }
});

server.get("/login", (req, res) => {
  const message = req.query.message || null; // Get the message if it exists in the URL
  res.render("login", { message }); // Pass it to the login page
});

// Login user
server.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ email: req.body.email });
    if (!check) {
      res.send("User name cannot be found with this email");
    }
    // Compare the hashed password from the database with the plaintext password
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    );
    if (!isPasswordMatch) {
      res.send("wrong Password");
    } else {
      res.redirect("dashboard");
    }
  } catch {
    res.send("wrong Details");
  }
});

server.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// OPEN AI
const upload = multer({ dest: "uploads/" });

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static("public"));

// 🔑 Verifică dacă cheia API este definită
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ EROARE: OPENAI_API_KEY nu este definit în .env");
  process.exit(1); // Oprește serverul dacă cheia lipsește
}

// ✅ Configurare OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Funcție pentru citirea și analiza facturilor PDF
async function processInvoices(files) {
  let allInvoiceText = "";

  for (let file of files) {
    const filePath = `uploads/${file.filename}`;
    const dataBuffer = fs.readFileSync(filePath);

    try {
      const pdfData = await pdfParse(dataBuffer);
      console.log(`📄 Factură analizată: ${file.originalname}`);
      allInvoiceText += `\n\n--- Conținutul facturii ${file.originalname} ---\n${pdfData.text}`;
    } catch (error) {
      console.error(`❌ Eroare citire PDF: ${file.originalname}`, error);
    }
  }

  // Dacă textul combinat depășește limita de caractere, îl scurtăm
  if (allInvoiceText.length > 3000) {
    allInvoiceText = allInvoiceText.substring(0, 3000);
  }

  return allInvoiceText;
}

// ✅ Endpoint pentru încărcarea facturilor și generarea răspunsului
server.post(
  "/dashboard/upload-invoice",
  upload.array("invoices", 10),
  async (req, res) => {
    console.log("📂 Uploaded Files:", req.files);
    console.log("❓ User Question:", req.body.question);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nu ai încărcat nicio factură." });
    }

    const invoiceText = await processInvoices(req.files);

    // 🔹 Construim prompt-ul pentru AI
    const prompt = `Următoarele sunt facturile încărcate:\n${invoiceText}\n\nÎntrebarea utilizatorului este: "${req.body.question}".\nRăspunde într-un mod clar și concis.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Ești un expert în analiza facturilor." },
          { role: "user", content: prompt },
        ],
      });

      res.json({ response: aiResponse.choices[0].message.content });
    } catch (error) {
      console.error("❌ Eroare OpenAI:", error);
      res
        .status(500)
        .json({ error: "A apărut o eroare la generarea răspunsului AI." });
    }
  }
);

// Define Port for Application
const port = 5000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
