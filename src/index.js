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
const salesRoutes = require("./routes/salesRoutes");
const marketingRoutes = require("./routes/marketingRoutes");
const accountingRoutes = require("./routes/accountingRoutes");
const humanResourcesRoutes = require("./routes/humanResourcesRoutes");
const legalAdvisoryRoutes = require("./routes/legalAdvisoryRoutes");
const { requireAuth } = require("./middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

router.get("/sales", requireAuth, (req, res) => {
  res.render("sales", { user: req.session.user });
});

router.get("/marketing", requireAuth, (req, res) => {
  res.render("marketing", { user: req.session.user });
});

router.get("/accounting", requireAuth, (req, res) => {
  res.render("accounting", { user: req.session.user });
});

router.get("/human-resources", requireAuth, (req, res) => {
  res.render("humanResources", { user: req.session.user });
});

router.get("/legal-advisory", requireAuth, (req, res) => {
  res.render("legalAdvisory", { user: req.session.user });
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

// Main routes
server.use("/", homeRoutes);
server.use("/register", registerRoutes);
server.use("/login", loginRoutes);
server.use("/logout", logoutRoutes);
server.use("/dashboard", dashboardRoutes);
server.use("/sales", salesRoutes);
server.use("/marketing", marketingRoutes);
server.use("/accounting", accountingRoutes);
server.use("/human-resources", humanResourcesRoutes);
server.use("/legal-advisory", legalAdvisoryRoutes);

// OPEN AI
const upload = multer({ dest: "uploads/" });

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static("public"));

// 🔑 Verify if the API key is defined in .env
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY is not defined in .env");
  process.exit(1); // Stop the server if the key is missing
}

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reading and analyzing method for PDF invoices
async function processInvoices(files) {
  let allInvoiceText = "";

  for (let file of files) {
    const filePath = `uploads/${file.filename}`;
    const dataBuffer = fs.readFileSync(filePath);

    try {
      const pdfData = await pdfParse(dataBuffer);
      console.log(`📄 Analized Invoice: ${file.originalname}`);
      allInvoiceText += `\n\n--- Content of the invoice ${file.originalname} ---\n${pdfData.text}`;
    } catch (error) {
      console.error(`❌ Error reading PDF: ${file.originalname}`, error);
    }
  }

  // If combined text if over the chars limit, we shorten it
  if (allInvoiceText.length > 3000) {
    allInvoiceText = allInvoiceText.substring(0, 3000);
  }

  return allInvoiceText;
}

// SALES - Endpoint for invoices loading and generating responses
server.post(
  "/sales/upload-invoice",
  upload.array("invoices", 10),
  async (req, res) => {
    console.log("📂 Uploaded Files:", req.files);
    console.log("❓ User Question:", req.body.question);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "You didn't upload any invoices." });
    }

    const invoiceText = await processInvoices(req.files);

    // Building the AI prompt
    const prompt = `The following are the uploaded invoices:\n${invoiceText}\n\nThe user's question is:"${req.body.question}".\nAnswer clearly and concisely.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert sales agent.", // in ce format sa returneze raspunsul, sa dau niste sabloane de raspunsuri, pot sa dau explicatii foarte precise; ex daca un utilizator cere calcule foarte complicate sa nu
          },
          { role: "user", content: prompt },
        ],
      });

      res.json({ response: aiResponse.choices[0].message.content });
    } catch (error) {
      console.error("❌ Error OpenAI:", error);
      res
        .status(500)
        .json({ error: "An error occurred when generating the AI response." });
    }
  }
);

// Marketing - Endpoint for invoices loading and generating responses
server.post(
  "/marketing/upload-invoice",
  upload.array("invoices", 10),
  async (req, res) => {
    console.log("📂 Uploaded Files:", req.files);
    console.log("❓ User Question:", req.body.question);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "You didn't upload any invoices." });
    }

    const invoiceText = await processInvoices(req.files);

    // Building the AI prompt
    const prompt = `The following are the uploaded invoices:\n${invoiceText}\n\nThe user's question is:"${req.body.question}".\nAnswer clearly and concisely.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing analyst",
          },
          { role: "user", content: prompt },
        ],
      });

      res.json({ response: aiResponse.choices[0].message.content });
    } catch (error) {
      console.error("❌ Error OpenAI:", error);
      res
        .status(500)
        .json({ error: "An error occurred when generating the AI response." });
    }
  }
);

// ACCOUNTING - Endpoint for invoices loading and generating responses
server.post(
  "/accounting/upload-invoice",
  upload.array("invoices", 10),
  async (req, res) => {
    console.log("📂 Uploaded Files:", req.files);
    console.log("❓ User Question:", req.body.question);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "You didn't upload any invoices." });
    }

    const invoiceText = await processInvoices(req.files);

    // Building the AI prompt
    const prompt = `The following are the uploaded invoices:\n${invoiceText}\n\nThe user's question is:"${req.body.question}".\nAnswer clearly and concisely.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert accountant",
          },
          { role: "user", content: prompt },
        ],
      });

      res.json({ response: aiResponse.choices[0].message.content });
    } catch (error) {
      console.error("❌ Error OpenAI:", error);
      res
        .status(500)
        .json({ error: "An error occurred when generating the AI response." });
    }
  }
);

// Legal Advisor - Endpoint for invoices loading and generating responses
server.post(
  "/legal-advisory/upload-invoice",
  upload.array("invoices", 10),
  async (req, res) => {
    console.log("📂 Uploaded Files:", req.files);
    console.log("❓ User Question:", req.body.question);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "You didn't upload any invoices." });
    }

    const invoiceText = await processInvoices(req.files);

    // Building the AI prompt
    const prompt = `The following are the uploaded invoices:\n${invoiceText}\n\nThe user's question is:"${req.body.question}".\nAnswer clearly and concisely.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert legal advisor",
          },
          { role: "user", content: prompt },
        ],
      });

      res.json({ response: aiResponse.choices[0].message.content });
    } catch (error) {
      console.error("❌ Error OpenAI:", error);
      res
        .status(500)
        .json({ error: "An error occurred when generating the AI response." });
    }
  }
);

// Human Resources - Endpoint for invoices loading and generating responses
server.post(
  "/human-resources/upload-invoice",
  upload.array("invoices", 10),
  async (req, res) => {
    console.log("📂 Uploaded Files:", req.files);
    console.log("❓ User Question:", req.body.question);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "You didn't upload any invoices." });
    }

    const invoiceText = await processInvoices(req.files);

    // Building the AI prompt
    const prompt = `The following are the uploaded invoices:\n${invoiceText}\n\nThe user's question is:"${req.body.question}".\nAnswer clearly and concisely.`;

    try {
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert human resources",
          },
          { role: "user", content: prompt },
        ],
      });

      res.json({ response: aiResponse.choices[0].message.content });
    } catch (error) {
      console.error("❌ Error OpenAI:", error);
      res
        .status(500)
        .json({ error: "An error occurred when generating the AI response." });
    }
  }
);

// Define Port for Application
const port = 5000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
