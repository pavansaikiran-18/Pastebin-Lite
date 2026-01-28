const pool = require("./db");

pool.query("SELECT NOW()")
  .then(() => console.log("DB Connected"))
  .catch(err => console.log("DB Error:", err));
