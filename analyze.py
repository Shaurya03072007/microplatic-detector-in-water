import cv2
import sys
import os
import numpy as np
import logging

def analyze_image(img_path) -> dict:
    img = cv2.imread(img_path)
    if img is None:
        logging.error(f"Failed to read image at {img_path}")
        return {"percentage": 0.0, "detected_path": None}

    # Convert image to grayscale for brightness analysis
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply slightly blurring to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Microplastics fluoresce under 365nm UV light, making them appear significantly
    # brighter than the dark background. We use a threshold to separate them.
    # IMPORTANT: You may need to tune this 'threshold_value' (try values between 100 and 240)
    # depending on your camera exposure and ambient darkness.
    threshold_value = 200
    _, thresh = cv2.threshold(blurred, threshold_value, 255, cv2.THRESH_BINARY)
    
    # Calculate percentage of microplastic area over total area
    microplastics_pixels = cv2.countNonZero(thresh)
    total_pixels = thresh.shape[0] * thresh.shape[1]
    percentage = (microplastics_pixels / total_pixels) * 100.0
    
    # Create a debug image to visualize what the algorithm is detecting
    # The detected microplastics will be highlighted in Red.
    debug_img_path = img_path.replace(".jpg", "_detected.jpg")
    result_img = img.copy()
    
    # Find contours (outlines) of the detected plastics to overlay on the original image
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(result_img, contours, -1, (0, 0, 255), 2) # Draw red contours
    
    # Add text with percentage
    cv2.putText(result_img, f"Microplastics: {percentage:.2f}%", (50, 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
                
    cv2.imwrite(debug_img_path, result_img)
    
    return {
        "percentage": percentage,
        "detected_path": debug_img_path
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = analyze_image(sys.argv[1])
        print(f"{res['percentage']:.4f}")
    else:
        print("0.0")
