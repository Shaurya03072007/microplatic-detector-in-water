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

## 🚀 How to Run

Because the application is split into a Python Backend and a Node Frontend, you need to start **both** servers to view the dashboard properly.

### Part 1: Start the Backend (FastAPI)

1. Open a terminal and navigate to the `server/` root folder.
2. Ensure you have the required Python libraries installed:
   ```bash
   pip install fastapi uvicorn python-multipart opencv-python numpy sqlalchemy
   ```
3. Boot up the Uvicorn server on **Port 8001** (to avoid conflicts with standard web ports):
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```
   *The backend should now be running, ready to accept uploads from the Pi!*

### Part 2: Start the Frontend (React Dashboard)

1. Open a **second** terminal and navigate specifically into the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install the necessary Node packages (if you haven't already):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. The terminal will provide a `http://localhost:5173` link (or similar, depending on availability). Open that link in your browser to view the Microplastics Dashboard!

---

## 🚨 Final Note: Update your Raspberry Pi

Because we upgraded the architecture to use a professional API, the routing port was changed. You must update your polling script on the Raspberry Pi to point to the new port **8001**.

```python
# Change your existing constant in your pi script to:
BACKEND_URL = "http://<YOUR_LAPTOP_IP_ADDRESS>:8001/upload"
```
