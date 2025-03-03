require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");

const homeRoutes = require("./routes/homeRoutes");
const loginRoutes = require("./routes/loginRoutes");
const registerRoutes = require("./routes/registerRoutes");
const logoutRoutes = require("./routes/logoutRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

module.exports = router;

const server = express();

// Middleware
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(express.static("public"));

server.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

server.use(cors());

// Set view engine to EJS
server.set("view engine", "ejs");

// Set the path to views folder
server.set("views", path.join(__dirname, "..", "views"));

// Rute principale
server.use("/", homeRoutes);
server.use("/register", registerRoutes);
server.use("/login", loginRoutes);
server.use("/logout", logoutRoutes);
server.use("/dashboard", dashboardRoutes);

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
