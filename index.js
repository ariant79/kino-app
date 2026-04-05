import express from "express";
import { load } from "cheerio";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static("public"));
app.use(express.json());

let lastDraws = []; // memorăm ultimele 5 extrageri
let userNumbers = []; // numerele jucate de tine

// ✨ Endpoint pentru a seta numerele jucate din frontend
app.post("/set-user-numbers", (req, res) => {
  const nums = req.body.numbers || [];
  userNumbers = nums.map(n => n.toString().padStart(2, "0"));
  console.log("Numere jucate actualizate:", userNumbers);
  res.json({ success: true });
});

// ✨ Endpoint pentru a da ultimele extrageri
app.get("/kino", (req, res) => {
  res.json({ lastDraws });
});

// 🔥 Funcție care face scraping și actualizează extragerile
async function updateDraws() {
  try {
    const res = await fetch("https://xloto.ro/arhiva-loto-grecia.php");
    const html = await res.text();
    const $ = load(html);

    const rows = $("table tbody tr");

    // găsim primul rând cu extragere reală (minim 10 cifre consecutive)
    let firstDraw;
    rows.each((i, el) => {
      const text = $(el).text();
      if (/\d{10,}/.test(text)) {
        firstDraw = $(el);
        return false; // break
      }
    });

    if (!firstDraw) {
      console.log("⚠️ Nu am găsit extragere validă");
      return;
    }

    const time = firstDraw.find("td").eq(0).text().trim();
    const raw = firstDraw.find("td").eq(1).text().trim();
    const numbers = raw.match(/\d{2}/g) || [];

    if (numbers.length !== 20) {
      console.log("⚠️ Numere invalide:", raw);
      return;
    }

    // verificăm dacă e extragere nouă
    if (!lastDraws.length || lastDraws[0].numbers.join() !== numbers.join()) {
      lastDraws.unshift({ time, numbers });

      if (lastDraws.length > 5) lastDraws.pop();

      console.log(`🎉 NEW DRAW at ${time}: ${numbers.join(", ")}`);
    }

  } catch (err) {
    console.error("❌ Error updating draws:", err);
  }
}

// 🔁 Update imediat și la fiecare 10 secunde
updateDraws();
setInterval(updateDraws, 10 * 1000);

// 🚀 Pornim serverul
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}/kino`);
});
