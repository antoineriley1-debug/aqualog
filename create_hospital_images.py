#!/usr/bin/env python3
"""Create placeholder hospital images for FacilityH2O."""

from PIL import Image, ImageDraw, ImageFont
import os

# Hospital list with IDs and names
hospitals = [
    ('whc', 'Washington Hospital Center'),
    ('somd', 'Southern Maryland Hospital'),
    ('harbor', 'Harbor Hospital'),
    ('mont', 'Montgomery Medical Center'),
    ('geo', 'Georgetown University Hospital'),
    ('frank', 'Franklin Square Medical'),
    ('gs', 'Good Samaritan Hospital'),
    ('union', 'Union Memorial Hospital'),
    ('stm', "St. Mary's Hospital"),
    ('nrh', 'National Rehabilitation Hospital'),
]

output_dir = "public/hospitals"
os.makedirs(output_dir, exist_ok=True)

# Create a simple placeholder for each hospital
for hospital_id, hospital_name in hospitals:
    # Create image (400x300 pixels)
    img = Image.new('RGB', (400, 300), color=(25, 55, 109))  # MedStar blue
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fall back if not available
    try:
        font_large = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 24)
        font_small = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw hospital name centered
    text = hospital_name
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_x = (400 - text_width) // 2
    draw.text((text_x, 130), text, fill=(255, 255, 255), font=font_large)
    
    # Draw ID below
    draw.text((150, 190), f"ID: {hospital_id}", fill=(200, 200, 200), font=font_small)
    
    # Save
    img_path = os.path.join(output_dir, f"{hospital_id}.jpg")
    img.save(img_path, "JPEG", quality=85)
    print(f"✓ Created {img_path}")

print(f"\n✅ Created {len(hospitals)} hospital images in {output_dir}/")
