import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Change width from 280px to 180px
content = content.replace("banner.style.width = '280px';", "banner.style.width = '180px';")

# Change object-fit from cover to contain and add background color to match the image
content = content.replace("object-fit: cover;", "object-fit: contain;")
content = content.replace("display: flex; transition: all 0.3s ease;", "display: flex; transition: all 0.3s ease; background-color: #ffffff;")

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
