import express from "express";
import cors from "cors";
import { load } from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("."));

let lastDraws = [];
let userNumbers = []; // numerele jucate de tine

// FUNCȚIE: update extrageri live
async function updateDraws() {
  try {
    const res = await fetch("https://xloto.ro/arhiva-loto-grecia.php"); // fetch nativ
    const html = await res.text();
    const $ = load(html);

    // selector pentru ultima extragere (ajustează după site)
    const latestDrawText = $(".draw-numbers").first().text(); // ex: "02, 04, 09, 10, 13, 17, ..."
    const numbers = latestDrawText
      .split(",")
      .map(n => n.trim())
      .filter(n => n.length > 0);

    // verificăm dacă e nouă
    if (!lastDraws.length || lastDraws[0].numbers.join() !== numbers.join()) {
      const time = new Date().toLocaleTimeString();
      lastDraws.unshift({ time, numbers });
      if (lastDraws.length > 5) lastDraws.pop();
      console.log(`🎉 NEW DRAW at ${time}: ${numbers.join(", ")}`);
    }
  } catch (err) {
    console.error("Error updating draws:", err);
  }
}

// la start
updateDraws();

// update periodic la fiecare 5 minute
setInterval(updateDraws, 5 * 60 * 1000);

// API: returnează ultimele extrageri
app.get("/kino", (req, res) => {
  res.json({ lastDraws, userNumbers });
});

// API: actualizare numere jucate
app.post("/user-numbers", express.json(), (req, res) => {
  const { numbers } = req.body;
  if (Array.isArray(numbers)) {
    userNumbers = numbers.map(n => String(n).trim());
    console.log("Numere jucate actualizate:", userNumbers);
    res.json({ success: true, userNumbers });
  } else {
    res.status(400).json({ success: false, message: "Array invalid" });
  }
});

// server static index.html
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}/kino`);
});
