require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const health = require("./routes/health");
const pastes = require("./routes/pastes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/healthz", health);
app.use("/api/pastes", pastes);

app.get("/p/:id", (req, res) => {
  req.url = `/view/${req.params.id}`;
  return require("./routes/pastes")(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
