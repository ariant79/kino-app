// index.js
import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

let latestDraw = [];
let lastDrawTime = ""; // ⬅️ adăugăm ora extragerii
let lastRaw = "";

// fetch KINO Grecia
async function fetchKino() {
  try {
    const { data } = await axios.get(
      "https://xloto.ro/arhiva-loto-grecia.php",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const $ = cheerio.load(data);

    const row = $("table tr").eq(1); // prima linie după header
    const rawNumbers = row.find("td").eq(1).text().trim();
    const drawTime = row.find("td").eq(0).text().trim(); // prima coloană = ora

    if (rawNumbers && rawNumbers !== lastRaw) {
      lastRaw = rawNumbers;

      let numbers = [];
      for (let i = 0; i < rawNumbers.length; i += 2) {
        numbers.push(rawNumbers.substring(i, i + 2));
      }

      latestDraw = numbers.slice(0, 20);
      lastDrawTime = drawTime; // ⬅️ setăm ora extragerii

      console.log(`🎉 NEW DRAW at ${drawTime}:`, latestDraw.join(", "));
    }
  } catch (err) {
    console.log("Error fetching KINO:", err.message);
  }
}

// Polling la fiecare 5 secunde
setInterval(fetchKino, 5000);

// API endpoint
app.get("/kino", (req, res) => {
  res.json({
    numbers: latestDraw,
    time: lastDrawTime, // trimitem și ora
  });
});

// Redirecționare / către index.html
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});
// Pornim serverul
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}/kino`);

  fetchKino(); // fetch inițial
});
