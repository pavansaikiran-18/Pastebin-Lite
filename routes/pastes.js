const router = require("express").Router();
const db = require("../db");
const { getNow } = require("../utils/time");

// CREATE PASTE
router.post("/", async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Invalid content" });
  }

  if (ttl_seconds && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
    return res.status(400).json({ error: "Invalid ttl_seconds" });
  }

  if (max_views && (!Number.isInteger(max_views) || max_views < 1)) {
    return res.status(400).json({ error: "Invalid max_views" });
  }

  const paste = await db.paste.create({
    data: {
      content,
      ttlSeconds: ttl_seconds ?? null,
      maxViews: max_views ?? null
    }
  });

  res.json({
    id: paste.id,
    url: `${req.protocol}://${req.get("host")}/p/${paste.id}`
  });
});

// FETCH PASTE API (COUNTS VIEW)
router.get("/:id", async (req, res) => {
  const paste = await db.paste.findUnique({ where: { id: req.params.id } });

  if (!paste) return res.status(404).json({ error: "Not found" });

  const now = getNow(req);
  const expiresAt = paste.ttlSeconds
    ? new Date(paste.createdAt.getTime() + paste.ttlSeconds * 1000)
    : null;

  const expired = expiresAt && now > expiresAt;
  const viewLimitHit = paste.maxViews !== null && paste.viewCount >= paste.maxViews;

  if (expired || viewLimitHit) {
    return res.status(404).json({ error: "Unavailable" });
  }

  // Atomic increment
  await db.paste.update({
    where: { id: paste.id },
    data: { viewCount: { increment: 1 } }
  });

  res.json({
    content: paste.content,
    remaining_views:
      paste.maxViews !== null
        ? paste.maxViews - (paste.viewCount + 1)
        : null,
    expires_at: expiresAt
  });
});

// VIEW HTML PAGE (NOW COUNTS VIEW TOO)
router.get("/view/:id", async (req, res) => {
  const paste = await db.paste.findUnique({ where: { id: req.params.id } });

  if (!paste) return res.status(404).send("Not found");

  const now = getNow(req);
  const expiresAt = paste.ttlSeconds
    ? new Date(paste.createdAt.getTime() + paste.ttlSeconds * 1000)
    : null;

  const expired = expiresAt && now > expiresAt;
  const viewLimitHit = paste.maxViews !== null && paste.viewCount >= paste.maxViews;

  if (expired || viewLimitHit) {
    return res.status(404).send("Unavailable");
  }

  // COUNT VIEW FOR HTML ACCESS
  await db.paste.update({
    where: { id: paste.id },
    data: { viewCount: { increment: 1 } }
  });

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Type", "text/html");
res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>View Paste</title>
  <style>
    body {
      margin: 0;
      font-family: Inter, system-ui, Arial, sans-serif;
      background: radial-gradient(circle at top right, #4f46e5, #020617 70%);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }

    .card {
      max-width: 900px;
      width: 100%;
      background: rgba(15, 23, 42, 0.9);
      border-radius: 18px;
      padding: 22px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.3), 0 20px 60px rgba(0,0,0,0.6);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .title {
      font-weight: 800;
      font-size: 18px;
      background: linear-gradient(135deg, #38bdf8, #a78bfa, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    button {
      background: linear-gradient(135deg, #38bdf8, #6366f1, #ec4899);
      border: none;
      padding: 10px 16px;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    pre {
      margin: 0;
      padding: 18px;
      border-radius: 12px;
      background: rgba(2, 6, 23, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.2);
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 15px;
      line-height: 1.6;
      box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.15);
    }

    .footer {
      margin-top: 12px;
      text-align: right;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">📄 Shared Paste</div>
      <button onclick="navigator.clipboard.writeText(window.location.href)">📋 Copy Link</button>
    </div>
    <pre>${escapeHtml(paste.content)}</pre>
    <div class="footer">Secure • Read-only • Pastebin Lite</div>
  </div>
</body>
</html>
`);

});

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[c]));
}

module.exports = router;
