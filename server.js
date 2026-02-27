const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `frame_${timestamp}.jpg`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB safety limit
});

// Health check route
app.get("/", (req, res) => {
    res.send("Camera backend running.");
});

// Upload endpoint (Pi sends here)
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file received.");
    }

    console.log("Image saved:", req.file.filename);
    
    // Call Python script to analyze the image
    const scriptPath = path.join(__dirname, "analyze.py");
    const imagePath = req.file.path;
    
    exec(`python "${scriptPath}" "${imagePath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Analysis error: ${error.message}`);
            // Fallback response so Pi won't keep waiting or break
            return res.status(200).send("OK - Analysis failed");
        }
        
        const percentage = parseFloat(stdout.trim());
        console.log(`Microplastics Percentage: ${percentage.toFixed(4)}%`);
        
        // Log to a simple results.txt file
        const resultLine = `${new Date().toISOString()}, ${req.file.filename}, ${percentage.toFixed(4)}%\n`;
        fs.appendFileSync(path.join(__dirname, "results.txt"), resultLine);
        
        res.status(200).send(`OK`);
    });
});

// Serve images statically
app.use("/images", express.static(UPLOAD_DIR));

// Simple auto-refresh gallery
app.get("/gallery", (req, res) => {
    const files = fs
        .readdirSync(UPLOAD_DIR)
        .filter(f => f.endsWith(".jpg") && !f.endsWith("_detected.jpg"))
        .sort()
        .slice(-20); // last 20 original frames

    const imagesHtml = files
        .map(f => {
            const detectedName = f.replace('.jpg', '_detected.jpg');
            const detectedPath = path.join(UPLOAD_DIR, detectedName);
            const detectedHtml = fs.existsSync(detectedPath) ? `<img src="/images/${detectedName}" width="320" style="margin:5px;" />` : '';
            return `
            <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                <p><strong>${f}</strong></p>
                <div style="display: flex;">
                    <img src="/images/${f}" width="320" style="margin:5px;" />
                    ${detectedHtml}
                </div>
            </div>`;
        })
        .join("");

    res.send(`
        <html>
        <head>
            <title>Microplastics Detection Gallery</title>
            <style> body { font-family: sans-serif; background: #f0f0f0; padding: 20px; } </style>
        </head>
        <body>
            <h2>Latest Frames & Model Detection</h2>
            <p><a href="/results.txt" target="_blank">View All Results (CSV)</a></p>
            <div>
                ${imagesHtml}
            </div>
            <script>
                setTimeout(() => location.reload(), 2000); // refresh every 2s
            </script>
        </body>
        </html>
    `);
});

// Serve the results.txt file
app.get("/results.txt", (req, res) => {
    const resultsPath = path.join(__dirname, "results.txt");
    if (!fs.existsSync(resultsPath)) return res.send("No results yet.");
    res.sendFile(resultsPath);
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});