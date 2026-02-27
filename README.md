# Microplastics UV Monitor System

This project is a full-stack hardware-software integration designed to capture, analyze, and visualize the presence of microplastics using ultraviolet (UV) fluorescence. 

By illuminating a sample with a 365nm UV LED on a Raspberry Pi, microplastics naturally fluoresce. An onboard camera captures this glow and transmits the image to this central server, which uses Computer Vision to calculate the exact percentage of microplastics present.

## 🏗️ Architecture Overview

The system architecture is divided into three main components:

### 1. Hardware (Edge Device)
*   **Raspberry Pi** equipped with a 5MP Camera Module.
*   **365nm UV LED** for sample illumination.
*   A Python script (`rpicam-still`) that captures high-resolution images continuously and POSTs them to the backend server.

### 2. Backend (Analysis & API)
*   **Framework:** Python with **FastAPI** for high-performance API routing.
*   **Computer Vision:** **OpenCV** processes the uploaded image. It converts the image to grayscale, applies a Gaussian blur to reduce camera noise, and uses binary thresholding to isolate the glowing microplastics from the dark background.
*   **Database:** A local **SQLite** database (`database.py` via SQLAlchemy) persistently stores every reading, including the timestamp, the original file path, the generated analytical overlay path, and the scientific percentage.

### 3. Frontend (Dashboard)
*   **Framework:** **React.js** bundled with **Vite** for rapid development.
*   **Styling:** **TailwindCSS** to create a highly professional, responsive, and dark-themed UI.
*   **Visualization:** **Recharts** is used to plot the historical concentration of microplastics over the last 100 frames.
*   **Live Integration:** The dashboard polls the FastAPI backend `/api/history` endpoint every 3 seconds to ensure real-time updates without requiring an explicit websocket setup.

---

## 📂 Project Structure

```text
server/
│
├── main.py               # Main FastAPI backend server and routes
├── analyze.py            # OpenCV python module for thresholding logic
├── database.py           # SQLAlchemy SQLite configuration and schema
├── microplastics.db      # (Auto-generated) SQLite database file
├── uploads/              # (Auto-generated) Local storage for all .jpg captures
│
├── frontend/             # React Application
│   ├── src/
│   │   ├── App.jsx       # Main dashboard layout and polling logic
│   │   ├── index.css     # Tailwind imports and base styles
│   │   └── main.jsx      # React mounting point
│   ├── package.json      # Node dependencies
│   ├── tailwind.config.js# Tailwind theme and paths
│   └── vite.config.js    # Vite bundler config
│
└── README.md             # This documentation
```

---

## 🚀 How to Live Deploy to Render.com (Free Tier)

If you don't want to use the Blueprint auto-deploy, you can easily deploy both services manually from the exact same GitHub repository.

### 1. Deploy the Python Backend (Web Service)
1. In the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings as follows:
   * **Name**: Microplastics-API (or similar)
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Select the **Free** instance type and click **Create Web Service**.
5. Once it Deploys, Render will give you a public URL (e.g., `https://microplastics-api.onrender.com`). Copy this!

### 2. Deploy the React Dashboard (Static Site)
1. Go back to the Render Dashboard, click **New +** and select **Static Site**.
2. Connect the exact same GitHub repository you used for the backend!
3. Configure the settings as follows:
   * **Name**: AquaSense-Dashboard (or similar)
   * **Root Directory**: `frontend`  *(<-- Very Important!)*
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Scroll down to **Advanced** -> **Environment Variables**. Add a new one:
   * **Key**: `VITE_API_URL`
   * **Value**: Paste the API URL you copied from Step 1! (e.g., `https://microplastics-api.onrender.com`)
5. Click **Create Static Site**.
6. When your site deploys, click on the **Redirects/Rewrites** tab on the left menu, and add a rule: 
   * **Source**: `/*` 
   * **Destination**: `/index.html` 
   * **Action**: `Rewrite`. (This ensures React Router works correctly).

---

## 🚨 Final Note: Update your Raspberry Pi

Because we upgraded the architecture to use a professional API, you must update your polling script on the Raspberry Pi to point to your new Live URL.

```python
# Change your existing constant in your pi script to the public backend:
BACKEND_URL = "https://microplastics-api.onrender.com/upload"
```