const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.SITE_PORT || 5500;
const ROOT = "D:\\website dr.kalnarkar";

app.use(express.static(ROOT));

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT, "enhanced_website.html"));
});

app.listen(PORT, () => {
  console.log(`Site server running at http://localhost:${PORT}/enhanced_website.html`);
});
