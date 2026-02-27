import time
import subprocess
import requests
import os

# Update this IP address to match the IP of the laptop running the FastAPI server.
# Ensure both the Pi and the Laptop are on the same WiFi network.
BACKEND_URL = "http://192.168.1.5:8001/upload"
IMAGE_PATH = "/tmp/frame.jpg"

print(f"Starting Microplastics Detector...")
print(f"Target Server: {BACKEND_URL}")

while True:
    try:
        # 1. Capture image using the Raspberry Pi camera
        print("Capturing frame...")
        subprocess.run([
            "rpicam-still",
            "-n",                  # no preview
            "--width", "2592",
            "--height", "1944",
            "-o", IMAGE_PATH,
            "-t", "500",           # half-second timeout for faster capture
            "--awb", "auto",       # White balance
            "--exposure", "normal" # Exposure profiling
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 2. Send image to backend
        with open(IMAGE_PATH, "rb") as img:
            files = {"image": img}
            print("Sending to server...", end=" ")
            
            # Send POST request. We use a short timeout because local networks are fast.
            # If the server is offline, this avoids the script hanging.
            r = requests.post(BACKEND_URL, files=files, timeout=5)
            
            if r.status_code == 200:
                # The api now returns the calculated percentage as JSON!
                response_data = r.json()
                pct = response_data.get('percentage', 0.0)
                print(f"Success! Detected: {pct:.4f}% Microplastics")
            else:
                print(f"Failed. Server returned status code: {r.status_code}")

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Is the FastAPI server running?")
    except requests.exceptions.Timeout:
        print("Error: Upload timed out. Network might be slow.")
    except subprocess.CalledProcessError as e:
        print(f"Error: Camera capture failed. {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

    # 3. Wait before capturing the next frame
    time.sleep(1)
