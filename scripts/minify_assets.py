import os
import re
import subprocess

def minify_css(css: str) -> str:
    # Remove comments
    css = re.sub(r'/\*[\s\S]*?\*/', '', css)
    # Remove whitespace around delimiters
    css = re.sub(r'\s*([\{\};:,\>])\s*', r'\1', css)
    # Remove spaces after opening brackets, before closing brackets
    css = re.sub(r'\(\s+', '(', css)
    css = re.sub(r'\s+\)', ')', css)
    # Remove trailing semicolons before closing brace
    css = re.sub(r';+}', '}', css)
    # Collapse remaining whitespace
    css = re.sub(r'\s+', ' ', css)
    return css.strip()

def minify_js(src: str) -> str:
    """A safe tokenizer-based JS minifier that preserves strings and regexes."""
    out = []
    i = 0
    n = len(src)
    in_string = False
    quote_char = None
    in_regex = False
    in_block_comment = False
    in_line_comment = False

    while i < n:
        c = src[i]
        nxt = src[i+1] if i + 1 < n else ''

        if in_block_comment:
            if c == '*' and nxt == '/':
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if in_line_comment:
            if c == '\n' or c == '\r':
                in_line_comment = False
                out.append(c)
            i += 1
            continue

        if in_string:
            out.append(c)
            if c == '\\':
                out.append(nxt)
                i += 2
                continue
            if c == quote_char:
                in_string = False
                quote_char = None
            i += 1
            continue

        # Check for comments
        if c == '/' and nxt == '*':
            in_block_comment = True
            i += 2
            continue
        if c == '/' and nxt == '/':
            in_line_comment = True
            i += 2
            continue

        # Check for strings
        if c in ('"', "'", '`'):
            in_string = True
            quote_char = c
            out.append(c)
            i += 1
            continue

        out.append(c)
        i += 1

    code = ''.join(out)
    # Clean up blank lines and trailing spaces
    lines = [line.strip() for line in code.splitlines() if line.strip()]
    return '\n'.join(lines)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    css_dir = os.path.join(root, 'css')
    js_dir = os.path.join(root, 'js')

    # Read subset icons
    icons_path = os.path.join(css_dir, 'icons.min.css')
    icons_css = ''
    if os.path.exists(icons_path):
        with open(icons_path, 'r', encoding='utf-8') as f:
            icons_css = f.read()

    # Minify individual CSS files
    minified_map = {}
    for cf in ['style.css', 'components.css', 'clinic.css']:
        path = os.path.join(css_dir, cf)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            min_content = minify_css(content)
            out_path = os.path.join(css_dir, cf.replace('.css', '.min.css'))
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(min_content)
            minified_map[cf] = min_content
            print(f"CSS: {cf} ({len(content)} bytes) -> {os.path.basename(out_path)} ({len(min_content)} bytes)")

    # Build consolidated site.min.css containing icons + style + clinic
    # components.min.css remains standalone for appointment & success-stories
    site_parts = []
    if icons_css:
        site_parts.append(icons_css)
    if 'style.css' in minified_map:
        site_parts.append(minified_map['style.css'])
    if 'clinic.css' in minified_map:
        site_parts.append(minified_map['clinic.css'])

    site_bundle = '\n'.join(site_parts)
    bundle_path = os.path.join(css_dir, 'site.min.css')
    with open(bundle_path, 'w', encoding='utf-8') as f:
        f.write(site_bundle)
    print(f"Consolidated Bundle: site.min.css ({len(site_bundle)} bytes, includes icons + style + clinic)")

    # Minify JS files
    js_files = ['script.js', 'animations.js', 'data.js', 'forms.js', 'clinic-gallery.js', 'emailjs-config.js']
    for jf in js_files:
        path = os.path.join(js_dir, jf)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            min_js = minify_js(content)
            out_path = os.path.join(js_dir, jf.replace('.js', '.min.js'))
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(min_js)
            # Verify with node syntax check
            res = subprocess.run(['node', '-c', out_path], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"ERROR verifying {out_path}: {res.stderr}")
            else:
                print(f"JS: {jf} ({len(content)} bytes) -> {os.path.basename(out_path)} ({len(min_js)} bytes) [Valid syntax]")

if __name__ == '__main__':
    main()
