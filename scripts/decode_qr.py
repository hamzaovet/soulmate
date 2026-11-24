import json
import urllib.request

url = "http://api.qrserver.com/v1/read-qr-code/"
with open("C:/Users/Dr Princa/.gemini/antigravity/brain/dabec748-18c4-4b79-b3ba-14fe0ba0608c/qr_crop.png", "rb") as f:
    img_bytes = f.read()

boundary = "----Boundary123"
body = b"--" + boundary.encode() + b"\r\n"
body += b'Content-Disposition: form-data; name="file"; filename="qr.png"\r\n'
body += b"Content-Type: image/png\r\n\r\n"
body += img_bytes + b"\r\n--" + boundary.encode() + b"--\r\n"

req = urllib.request.Request(url, data=body)
req.add_header("Content-Type", "multipart/form-data; boundary=" + boundary)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        res = json.loads(resp.read().decode())
        print("Decoded QR data:", res[0]["symbol"][0]["data"])
except Exception as e:
    print("Error:", e)
