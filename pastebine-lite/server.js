require("dotenv").config();
const express = require("express");
const cors = require("cors");

const healthRoute = require("./routes/health");
const pasteRoute = require("./routes/pastes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use("/api/healthz", healthRoute);
app.use("/api/pastes", pasteRoute);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
app.get("/p/:id", async (req, res) => {
  const pool = require("./db");
  const result = await pool.query(
    "SELECT * FROM pastes WHERE id=$1",
    [req.params.id]
  );

  if (!result.rows.length)
    return res.status(404).send("Not Found");

  const paste = result.rows[0];
  const now = Date.now();

  if (paste.expires_at && now > paste.expires_at)
    return res.status(404).send("Expired");

  if (paste.max_views !== null && paste.views >= paste.max_views)
    return res.status(404).send("Limit reached");

  res.render("paste", { content: paste.content });
});

app.listen(process.env.PORT || 3000);
