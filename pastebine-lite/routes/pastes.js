const express = require("express");
const { nanoid } = require("nanoid");
const pool = require("../db");

const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;

  if (!content || typeof content !== "string")
    return res.status(400).json({ error: "Invalid content" });

  if (ttl_seconds && ttl_seconds < 1)
    return res.status(400).json({ error: "Invalid ttl_seconds" });

  if (max_views && max_views < 1)
    return res.status(400).json({ error: "Invalid max_views" });

  const id = nanoid();
  const now = Date.now();
  const expires_at = ttl_seconds ? now + ttl_seconds * 1000 : null;

  await pool.query(
    `INSERT INTO pastes (id, content, created_at, expires_at, max_views)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, content, now, expires_at, max_views || null]
  );

  res.status(201).json({
    id,
    url: `${process.env.APP_URL}/p/${id}`
  });
});

// FETCH API
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    "SELECT * FROM pastes WHERE id=$1",
    [id]
  );

  if (!result.rows.length)
    return res.status(404).json({ error: "Not found" });

  const paste = result.rows[0];

  const testMode = process.env.TEST_MODE === "1";
  const now = testMode && req.headers["x-test-now-ms"]
    ? parseInt(req.headers["x-test-now-ms"])
    : Date.now();

  if (paste.expires_at && now > paste.expires_at)
    return res.status(404).json({ error: "Expired" });

  if (paste.max_views !== null && paste.views >= paste.max_views)
    return res.status(404).json({ error: "View limit exceeded" });

  await pool.query(
    "UPDATE pastes SET views = views + 1 WHERE id=$1",
    [id]
  );

  res.json({
    content: paste.content,
    remaining_views:
      paste.max_views === null
        ? null
        : paste.max_views - (paste.views + 1),
    expires_at: paste.expires_at
      ? new Date(paste.expires_at).toISOString()
      : null
  });
});

module.exports = router;
