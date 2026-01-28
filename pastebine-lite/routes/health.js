const router = require("express").Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false });
  }
});

module.exports = router;
