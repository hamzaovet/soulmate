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
    font_top_pill = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 26)
    font_table_big = ImageFont.truetype("C:/Windows/Fonts/tahomabd.ttf", 48)
    font_table_sub = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 24)

    # 1. Exact Top Pill (covers y=112..172)
    pill_box = (258, 112, 822, 172)
    # Fill with same dark espresso color of original card
    draw.rounded_rectangle(pill_box, radius=30, fill=(38, 25, 9, 255), outline=(217, 119, 6, 255), width=2)
    top_text = f"منظومة سول ميت الذكية • طاولة رقم ({table_num})"
    render_arabic(top_text, font_top_pill, draw, (540, 140), fill=(255, 214, 102), anchor="mm")

    # 2. Main Luxury Table Banner (covers y=412..538)
    banner_box = (150, 412, 930, 538)
    # Outer glow
    draw.rounded_rectangle((banner_box[0]-3, banner_box[1]-3, banner_box[2]+3, banner_box[3]+3), radius=28, fill=(217, 119, 6, 80))
    # Main banner
    draw.rounded_rectangle(banner_box, radius=26, fill=(22, 16, 11, 255), outline=(245, 158, 11, 255), width=3)
    # Inner gold border
    draw.rounded_rectangle((banner_box[0]+4, banner_box[1]+4, banner_box[2]-4, banner_box[3]-4), radius=22, outline=(251, 191, 36, 130), width=1)

    # Text inside banner:
    # Line 1: Big Table Number
    table_main_text = f"طاولة {table_num}  •  TABLE {table_num}"
    render_arabic(table_main_text, font_table_big, draw, (540, 456), fill=(254, 243, 199), anchor="mm")

    # Line 2: Action prompt
    table_sub_text = "امسح الكود واطلب من مكانك مباشرة"
    render_arabic(table_sub_text, font_table_sub, draw, (540, 506), fill=(251, 191, 36), anchor="mm")

    # Composite
    final_img = Image.alpha_composite(base_img, overlay).convert("RGB")
    final_img.save(output_path, "PNG", quality=95)
    print(f"Generated Table {table_num} -> {output_path}")

create_table_card(1, "C:/Users/Dr Princa/.gemini/antigravity/brain/dabec748-18c4-4b79-b3ba-14fe0ba0608c/soulmate-table-1.png")
