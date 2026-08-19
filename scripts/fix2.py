import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Split menuHtml and extract bannerHtml
pattern = r'(\s*<!-- Thinker Chess Banner -->.*?</div>\s*</div>\s*`;)'

match = re.search(r'\s*<!-- Thinker Chess Banner -->.*?</script>', content, re.DOTALL)
# Let's find exactly the banner injection part
old_injection = r'''      <!-- Thinker Chess Banner -->
      <div id="thinker-chess-banner" style="position: fixed; right: -9999px; top: 100px; z-index: 999999; display: flex; transition: all 0.3s ease;">
        <img src="data:image/jpeg;base64,'''

banner_html = r'''
    `;
    
    const bannerHtml = `
      <!-- Thinker Chess Banner -->
      <div id="thinker-chess-banner" style="position: absolute; right: -9999px; top: 100px; z-index: 999999; display: flex; transition: all 0.3s ease;">
        <img src="data:image/jpeg;base64,'''

content = content.replace(old_injection, banner_html)

# Add banner to body
content = content.replace('mainDiv.first().append(menuHtml);', 'mainDiv.first().append(menuHtml);\n        $("body").append(bannerHtml);')

# Update positioning logic
old_logic = r'''            banner.style.right = 'auto';
            banner.style.left = (rect.right + 15) + 'px';
            banner.style.top = rect.top + 'px';
            banner.style.height = rect.height + 'px';
            banner.style.width = '280px';
            banner.style.display = 'flex';'''

new_logic = r'''            banner.style.right = 'auto';
            banner.style.left = (rect.right + window.scrollX + 15) + 'px';
            banner.style.top = (rect.top + window.scrollY) + 'px';
            banner.style.height = rect.height + 'px';
            banner.style.width = '280px';
            banner.style.display = 'flex';
            
            if (rect.right + 300 > window.innerWidth) {
                document.body.style.overflowX = 'auto';
            }'''

content = content.replace(old_logic, new_logic)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
