import fetch from "node-fetch";

function parseCoordsFromUrl(url) {
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), long: parseFloat(match[2]) };
}

function parseDMS(decimal) {
  const deg = Math.floor(Math.abs(decimal));
  const minTotal = (Math.abs(decimal) - deg) * 60;
  const min = Math.floor(minTotal);
  const sec = ((minTotal - min) * 60).toFixed(2);
  return { deg, min, sec };
}

export async function convert(url) {
  try {
    // 1. Follow redirect short URL
    const res = await fetch(url, { redirect: "follow" });
    const finalUrl = res.url;

    console.log("Final URL:", finalUrl);

    // 2. Parse koordinat dari URL final
    const coords = parseCoordsFromUrl(finalUrl);
    if (!coords) {
      console.error("❌ Gagal ambil koordinat dari URL");
      return;
    }

    const { lat, long } = coords;

    const latD = parseDMS(lat);
    const longD = parseDMS(long);

    const NS = lat >= 0 ? "LU" : "LS";
    const WE = long >= 0 ? "BT" : "BB";

    console.log("Garis Lintang");
    console.log(`${NS} : ${latD.deg}° ${latD.min}′ ${latD.sec}″`);
    console.log("Garis Bujur");
    console.log(`${WE} : ${longD.deg}° ${longD.min}′ ${longD.sec}″`);

    console.log("\nInformasi lain");
    console.log(`decimal_lat: ${lat}`);
    console.log(`decimal_long: ${long}`);
  } catch (err) {
    console.error("⚠️ Error:", err.message);
  }
}

// convert("https://maps.app.goo.gl/uEBHVZ91HSZaJHgA6");
