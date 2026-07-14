const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        fontSrc: ["'self'", "https:", "data:"],
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
  })
);
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1d", etag: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

function sanitizeInput(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "").trim();
}

function isValidPhone(value) {
  return /^\d{10}$/.test(value);
}

app.post("/api/contact", (req, res) => {
  const name = sanitizeInput(req.body?.name);
  const phone = sanitizeInput(req.body?.phone);
  const documentType = sanitizeInput(req.body?.documentType);
  const message = sanitizeInput(req.body?.message);

  if (name.length < 2 || !isValidPhone(phone) || documentType.length < 2) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid name, 10-digit phone number, and document type.",
    });
  }

  console.log("New enquiry received:");
  console.log({ name, phone, documentType, message });

  res.json({ success: true, message: "Thank you. We will contact you shortly." });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
});
