import express from "express";
import cors from "cors";
import { load } from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

// Pentru __dirname în ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let lastDraws = [];
let userNumbers = [];

// Funcție de scraping
async function updateDraws() {
  try {
    const res = await fetch("https://xloto.ro/arhiva-loto-grecia.php");
    const html = await res.text();
    const $ = load(html);

    const rows = $("table tbody tr");
    const extracted = [];

    rows.each((i, el) => {
      const t = $(el).find("td").eq(0).text().trim();
      const raw = $(el).find("td").eq(1).text().trim();
      const nums = raw.match(/\d{2}/g) || [];

      if (nums.length === 20) {
        extracted.push({ time: t, numbers: nums });
      }
    });

    if (extracted.length) {
      // păstrează ultimele 5 extrageri
      lastDraws = extracted.slice(0, 5);
      console.log("✔️ Updated draws:", lastDraws[0].time, lastDraws[0].numbers.join(", "));
    }

  } catch (err) {
    console.error("❌ Error scraping kino:", err);
  }
}

// Endpoint pentru frontend
app.get("/kino", (req, res) => {
    res.json({ 
        numbers: latestDrawNumbers, 
        time: latestDrawTime 
    });
});

// Orice altă rută redirectează la index.html
app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/index.html"));
});

// Endpoint pentru salvarea numerelor jucate
app.post("/set-user-numbers", (req, res) => {
  userNumbers = req.body.numbers || [];
  console.log("Numere jucate actualizate:", userNumbers);
  res.json({ success: true });
});

// rulează update imediat
updateDraws();
// și periodic
setInterval(updateDraws, 10 * 1000); // verifică la 30s

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
