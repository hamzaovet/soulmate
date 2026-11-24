import os
import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

def render_arabic(text, font, draw, position, fill, anchor=None):
    reshaped = get_display(arabic_reshaper.reshape(text))
    draw.text(position, reshaped, font=font, fill=fill, anchor=anchor)

def create_table_card(table_num, output_path):
    # Load original card
    base_img = Image.open("D:/Work/soulmate/soulmate-hall-qr-card.png").convert("RGBA")
    w, h = base_img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Fonts
    font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
    font_table_big = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 46)
    font_table_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
    font_pill = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 28)

    # 1. Top Pill Replacement (y=70 to 125)
    # Draw dark rounded pill with gold border over the original top text
    pill_box = (250, 75, 830, 120)
    draw.rounded_rectangle(pill_box, radius=22, fill=(28, 20, 14, 255), outline=(217, 119, 6, 255), width=2)
    top_text = f"✨ منظومة سول ميت الذكية • طاولة رقم ({table_num}) ✨"
    render_arabic(top_text, font_pill, draw, (540, 96), fill=(254, 240, 138), anchor="mm")

    # 2. Prominent Table Number Banner above QR code (y=345 to 425)
    # The original text was "امسح الكود واختر خدمتك"
    # We create a luxurious gold & dark espresso gradient banner
    banner_box = (200, 342, 880, 426)
    # Draw outer glow / shadow
    draw.rounded_rectangle((banner_box[0]-4, banner_box[1]-4, banner_box[2]+4, banner_box[3]+4), radius=26, fill=(217, 119, 6, 60))
    # Draw banner background
    draw.rounded_rectangle(banner_box, radius=24, fill=(24, 18, 13, 255), outline=(245, 158, 11, 255), width=3)
    
    # Inner gold accent line
    draw.rounded_rectangle((banner_box[0]+4, banner_box[1]+4, banner_box[2]-4, banner_box[3]-4), radius=20, outline=(251, 191, 36, 120), width=1)

    # Table text inside banner
    # E.g. "☕ طاولة 1 • TABLE 1 ☕"
    table_text = f"☕ طاولة {table_num} • TABLE {table_num} ☕"
    render_arabic(table_text, font_table_big, draw, (540, 384), fill=(254, 243, 199), anchor="mm")

    # Combine
    final_img = Image.alpha_composite(base_img, overlay).convert("RGB")
    final_img.save(output_path, "PNG", quality=95)
    print(f"Generated Table {table_num} -> {output_path}")

os.makedirs("D:/Work/soulmate/public/stickers", exist_ok=True)
create_table_card(1, "D:/Work/soulmate/public/stickers/soulmate-table-1.png")
