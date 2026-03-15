const express = require("express");
const app = express();
app.get("*all", (req, res) => res.send("matched *all"));
app.listen(3001, () => {
  fetch("http://localhost:3001/some-random-path").then(r => {
    console.log("Status for /some-random-path:", r.status);
    process.exit(0);
  });
});
