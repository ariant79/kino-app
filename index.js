import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";

const app = express();
app.use(express.json());
app.use(express.static("public"));

let lastDraws = [];
let userNumbers = [];

app.post("/set-user-numbers", (req, res) => {
  userNumbers = req.body.numbers.map(n => n.padStart(2, "0"));
  res.json({ ok: true });
});

// endpoint pentru frontend
app.get("/kino", (req, res) => {
  res.json({ lastDraws, userNumbers });
});

// funcție pentru actualizare extrageri
async function updateDraws() {
  try {
    const response = await fetch("https://xloto.ro/arhiva-loto-grecia.php");
    const html = await response.text();
    const $ = cheerio.load(html);

    const draws = [];
    $("table tr").each((i, el) => {
      const raw = $(el).find("td:nth-child(2)").text().trim();
      const time = $(el).find("td:nth-child(1)").text().trim();
      const nums = raw.match(/\d{2}/g) || [];
      if (nums.length === 20) {
        draws.push({ time, numbers: nums });
      }
    });

    // păstrăm ultimele 5 extrageri
    if (draws.length > 0) {
      lastDraws = draws.slice(0,5);
      console.log("🎉 NEW DRAW at", lastDraws[0].time, ":", lastDraws[0].numbers.join(", "));
    }
  } catch (err) {
    console.error("Error updating draws:", err);
  }
}

// rulăm update la fiecare 10 secunde
updateDraws();
setInterval(updateDraws, 10 * 1000);

// server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}/`));
