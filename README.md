# 🗺️ ScaleOrange Maps

**ScaleOrange Maps** is an offline-capable web and Android mapping application (via Capacitor) designed to explore rich **geospatial data of India**.

It allows users to view **states, districts, sub-districts, railways, waterways, assembly and parliamentary constituencies**, and more. Built with web technologies, it leverages **Capacitor Filesystem** for caching large GeoJSON files and supports **current location tracking**.

> 📍 Instantly locate yourself.  
> 🗺️ View India's detailed administrative & infrastructural maps.  
> ⚡ Works offline once data is cached.

---

## 🌟 Key Features

- 📍 **User Location Detection**
- 🗺️ Access GeoJSON layers for:
  - Indian States
  - Districts per State
  - Sub-Districts
  - Parliamentary & Assembly Constituencies
  - Railways & Waterways
- 📂 **GeoJSON Caching** with Capacitor FileSystem
- 🧠 In-memory + persistent cache for performance & offline use
- 📊 Multi-map selector and toggle UI
- 📤 Easily updatable data via GitHub
- 🌐 Web App + Android App (via Capacitor)


---

## 📦 Folder Structure

```bash
src/
├── components/
│   ├── geojsonMap.js             # Main map rendering logic
│   ├── geojsonfileCache.js       # Handles cache status icons, fetching
│   └── multimapselector.js       # UI for selecting multiple maps
│
├── utils/
│   └── Geojsoncachemanager.js    # Central logic for caching and reading files

public/
├── geojsonlinks.json             # 🔗 Master list of GeoJSON files with versions

capacitor.config.json               # Capacitor configuration


🌐 How GeoJSON Management Works:
   GeoJSON data is hosted on GitHub under:https://github.com/Scaleorange-Technologies/INDIAN_SHAPEFILES

Developers can:

  🔼 Upload new .geojson to GitHub
  🔗 Get the raw file URL
  📝 Update geojsonlinks.json with new link + version

⚙️ Caching Logic
    Uses Capacitor Filesystem API to download and store data on device.
    
	import { Filesystem, Directory } from '@capacitor/filesystem';
	await Filesystem.writeFile({
	  path: `${layerKey}.geojson`,
	  data: JSON.stringify(geojsonData),
	  directory: Directory.Data
	});
	const result = await Filesystem.readFile({
	  path: `${layerKey}.geojson`,
	  directory: Directory.Data
	});
	const geojson = JSON.parse(result.data);
	
🔁 Status Display
    Each layer shows:
     ⬇️ Downloading
     ⏳ Loading
     🗂️ Cached (Offline Available)
     ⚪ Not Downloaded

🧪 Running Locally
1. Install dependencies - npm install
2. Start Web App - npm start
3. Run on Android - 
      In the web folder run this command - npm run build
      then come to the android folder run these commands - npx cap copy
      							   npx cap sync
							   npx cap run android
							   
📱 Google Play
📲 Download ScaleOrange Maps on Play Store

🧑‍💻 Developer Guide
     To add or update data:
     Upload .geojson to GitHub folder:INDIAN_SHAPEFILES
     Copy the Raw GitHub Link
     Open public/geojsonlinks.json
     Add the new entry with the updated version

							 
 
