import os
import urllib.request
from PIL import Image

music_url = "https://freepd.com/music/Creepy%20Hollow.mp3"
music_path = "music.mp3"

print("Downloading music...")
try:
    urllib.request.urlretrieve(music_url, music_path)
    print("Music downloaded!")
except Exception as e:
    print(f"Failed to download music: {e}")
    # Create empty mp3 file to avoid crash if failed
    open(music_path, "wb").close()

def remove_white(img_path, out_path):
    if not os.path.exists(img_path):
        print(f"File {img_path} not found.")
        return
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    # Replace white-ish colors with transparent
    for item in data:
        r, g, b = item[0], item[1], item[2]
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(out_path, "PNG")
    print(f"Processed {out_path}")

print("Processing sprites...")
remove_white(r"C:\Users\dioni\.gemini\antigravity\brain\b62b2b4e-f15a-4320-bc70-c2c4b66880f4\zombie_sprite_1776056589043.png", "zombie.png")
remove_white(r"C:\Users\dioni\.gemini\antigravity\brain\b62b2b4e-f15a-4320-bc70-c2c4b66880f4\weapon_sprite_1776056601245.png", "weapon.png")

# Copy the wall as-is
import shutil
shutil.copy(r"C:\Users\dioni\.gemini\antigravity\brain\b62b2b4e-f15a-4320-bc70-c2c4b66880f4\zombie_wall_1776056573592.png", "wall.png")
print("Wall copied.")
