const fs = require("fs");
const path = require("path");

const baseGitHubURL = "https://raw.githubusercontent.com/ChandrikaBotta1/INDIAN_SHAPEFILES/main";
const baseDir = ".";

let links = {};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith(".geojson")) {
      const relativePath = fullPath.replace(/^\.\//, "").replace(/\\/g, "/");
      const key = relativePath
        .replace(".geojson", "")
        .replace(/\//g, "_")
        .toLowerCase(); // example: STATES/Telangana/districts.geojson -> states_telangana_districts

      links[key] = `${baseGitHubURL}/${relativePath}`;
    }
  }
}

walk(baseDir);

// Save the output
fs.writeFileSync("geojsonLinks.json", JSON.stringify(links, null, 2));
console.log("✅ geojsonLinks.json generated successfully!");
