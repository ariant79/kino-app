import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {load} from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Backend simulare extrageri Kino ---
let lastDraws = [];
let latestDrawNumbers = [];
let latestDrawTime = "";

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
      // ultimele 5 extrageri
      lastDraws = extracted.slice(0, 5);

      // 👉 AICI ERA BUGUL
      latestDrawNumbers = lastDraws[0].numbers;
      latestDrawTime = lastDraws[0].time;

      console.log("✔️ Updated:", latestDrawTime, latestDrawNumbers.join(", "));
    }

  } catch (err) {
    console.error("❌ Error scraping kino:", err);
  }
}


updateDraws();
setInterval(updateDraws, 15000);

// Endpoint API
app.get("/kino", (req, res) => {
  res.json({
    numbers: latestDrawNumbers,
    time: latestDrawTime,
    history: lastDraws
  });
});

// Catch-all pentru SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
