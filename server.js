require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");

const health = require("./routes/health");
const pastes = require("./routes/pastes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Serve static frontend safely
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Homepage route
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// API routes
app.use("/api/healthz", health);
app.use("/api/pastes", pastes);

// Paste view page
app.get("/p/:id", (req, res) => {
  req.url = `/view/${req.params.id}`;
  return require("./routes/pastes")(req, res);
});

// Error fallback (helps debugging)
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port", PORT));
