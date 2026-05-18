from PIL import Image

def create_favicon():
    img = Image.open('public/logo.png').convert('RGBA')
    
    width, height = img.size
    # Crop to just the circular icon part, skipping the text
    # The image is 1024x1024, icon is roughly in the center but offset up
    crop_size = int(width * 0.7)
    left = int((width - crop_size) / 2)
    top = int(height * 0.15)
    right = left + crop_size
    bottom = top + crop_size
    
    img = img.crop((left, top, right, bottom))
    
    # Remove background
    bg_color = img.getpixel((0, 0))
    
    data = img.getdata()
    new_data = []
    
    for item in data:
        # Calculate manhattan distance
        diff = sum(abs(item[i] - bg_color[i]) for i in range(3))
        
        # We'll use diff to create a smooth alpha mask
        # If diff is very small, it's background
        if diff < 30:
            new_data.append((item[0], item[1], item[2], 0))
        else:
            # Boost brightness significantly (e.g., multiply by 2.5) to make it visible on dark tabs
            r = min(255, int(item[0] * 2.5))
            g = min(255, int(item[1] * 2.5))
            b = min(255, int(item[2] * 2.5))
            
            if diff < 150:
                # Smooth transition for the glow
                alpha = int(((diff - 30) / 120) * 255)
                new_data.append((r, g, b, alpha))
            else:
                new_data.append((r, g, b, 255))
            
    img.putdata(new_data)
    
    # Resize to 128x128 for good resolution favicon
    img = img.resize((128, 128), Image.Resampling.LANCZOS)
    img.save('public/favicon.png', 'PNG')
    print("Favicon created successfully")

if __name__ == '__main__':
    create_favicon()
