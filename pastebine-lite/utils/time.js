function getNow(req) {
  if (process.env.TEST_MODE === "1") {
    const header = req.headers["x-test-now-ms"];
    if (header) return new Date(Number(header));
  }
  return new Date();
}

module.exports = { getNow };
