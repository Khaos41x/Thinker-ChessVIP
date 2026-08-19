import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = r'''            banner.style.right = 'auto';
            banner.style.left = (rect.right + window.scrollX + 15) + 'px';
            banner.style.top = (rect.top + window.scrollY) + 'px';
            banner.style.height = rect.height + 'px';
            banner.style.width = '180px';
            banner.style.display = 'flex';
            
            if (rect.right + 300 > window.innerWidth) {
                document.body.style.overflowX = 'auto';
            }'''

new_logic = r'''            banner.style.right = 'auto';
            // Use position fixed behavior since we want it to fit in the screen without scrollbars
            banner.style.left = (rect.right + 15) + 'px';
            banner.style.top = rect.top + 'px';
            banner.style.height = rect.height + 'px';
            
            // Calc exact remaining width without creating a scrollbar
            let exactWidth = window.innerWidth - rect.right - 25; // 25px total margin to avoid triggering scrollbar
            if (exactWidth < 80) exactWidth = 80; // minimum width
            
            banner.style.width = exactWidth + 'px';
            banner.style.display = 'flex';
            
            // Remove the forced overflowX
            document.body.style.overflowX = '';'''

content = content.replace(old_logic, new_logic)

# Also let's change absolute back to fixed since we don't want scrollbars anymore
content = content.replace('style="position: absolute; right: -9999px; top: 100px;', 'style="position: fixed; right: -9999px; top: 100px;')

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
