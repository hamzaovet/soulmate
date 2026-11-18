from PIL import Image, ImageDraw, ImageFont
import os

public_dir = r"D:\Work\abuadel-soulmate\public"

# Base VIP icon from icon-512.png
base_icon = Image.open(os.path.join(public_dir, "icons", "icon-512.png")).convert("RGBA")

# Generate standard multi-resolution ICO for the main app
base_icon.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
base_icon.save(os.path.join(public_dir, "app.ico"), format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])

# Create Abu Adel branded Icon:
size = (512, 512)
img_abuadel = Image.new("RGBA", size, (0, 0, 0, 0))
draw_abu = ImageDraw.Draw(img_abuadel)
draw_abu.ellipse([16, 16, 496, 496], fill="#1c0710", outline="#f43f5e", width=14)
draw_abu.ellipse([32, 32, 480, 480], outline="#fb7185", width=4)
try:
    font = ImageFont.truetype("arial.ttf", 200)
    draw_abu.text((256, 230), "عادل", fill="#fbbf24", font=font, anchor="mm")
    font_sub = ImageFont.truetype("arial.ttf", 46)
    draw_abu.text((256, 370), "حلواني أبو عادل", fill="#fecdd3", font=font_sub, anchor="mm")
except Exception as e:
    print("Font error abu:", e)
img_abuadel.save(os.path.join(public_dir, "abuadel.ico"), format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
img_abuadel.save(os.path.join(public_dir, "abuadel-icon.png"), format="PNG")

# Create Soul Mate branded Icon:
img_soul = Image.new("RGBA", size, (0, 0, 0, 0))
draw_soul = ImageDraw.Draw(img_soul)
draw_soul.ellipse([16, 16, 496, 496], fill="#140e06", outline="#d97706", width=14)
draw_soul.ellipse([32, 32, 480, 480], outline="#fbbf24", width=4)
try:
    font_s = ImageFont.truetype("arialbd.ttf", 220)
    draw_soul.text((256, 220), "S", fill="#f59e0b", font=font_s, anchor="mm")
    font_sub_s = ImageFont.truetype("arial.ttf", 44)
    draw_soul.text((256, 370), "Soulmate Cafe VIP", fill="#fde68a", font=font_sub_s, anchor="mm")
except Exception as e:
    print("Font error soul:", e)
img_soul.save(os.path.join(public_dir, "soulmate.ico"), format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
img_soul.save(os.path.join(public_dir, "soulmate-icon.png"), format="PNG")

print("Generated all ICO files successfully!")
