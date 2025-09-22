#!/usr/bin/env python3
"""
Generate PWA icons from SVG source
Creates multiple PNG sizes and copies them to the correct locations
"""

import os
from PIL import Image, ImageDraw

def create_icon(size, output_path):
    """Create an icon of the specified size"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factors based on 192x192 base
    scale = size / 192
    
    # Draw background circle
    margin = int(16 * scale)
    draw.ellipse([margin, margin, size - margin, size - margin], 
                 fill=(0, 116, 217, 255), outline=(0, 95, 163, 255), width=int(6 * scale))
    
    # Draw book shape
    book_x = int(48 * scale)
    book_y = int(48 * scale)
    book_w = int(96 * scale)
    book_h = int(128 * scale)
    draw.rectangle([book_x, book_y, book_x + book_w, book_y + book_h], 
                   fill=(255, 255, 255, 255), outline=(51, 51, 51, 255), width=int(2 * scale))
    
    # Draw book spine
    draw.rectangle([book_x, book_y, book_x + int(20 * scale), book_y + book_h], 
                   fill=(0, 95, 163, 255))
    
    # Draw text lines
    for i, y in enumerate([68, 78, 88, 108, 118, 128]):
        line_w = int((60 - i * 5) * scale)
        line_y = int((book_y + y) * scale)
        draw.rectangle([book_x + int(20 * scale), line_y, 
                       book_x + int(20 * scale) + line_w, line_y + int(3 * scale)], 
                       fill=(51, 51, 51, 255))
    
    # Draw catalog grid
    grid_x = int((book_x + 60) * scale)
    grid_y = int((book_y + 100) * scale)
    for i in range(3):
        for j in range(2):
            x = grid_x + i * int(12 * scale)
            y = grid_y + j * int(12 * scale)
            draw.rectangle([x, y, x + int(8 * scale), y + int(8 * scale)], 
                           fill=(0, 116, 217, 255))
    
    img.save(output_path)
    print(f'Created {output_path}')

def create_maskable_icon(size, output_path):
    """Create a maskable icon with safe area padding"""
    # Create larger canvas to account for safe area
    canvas_size = int(size * 1.2)  # 20% extra padding
    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate safe area (center 80% of canvas)
    safe_margin = int(canvas_size * 0.1)
    safe_size = canvas_size - (safe_margin * 2)
    
    # Draw background circle in safe area
    draw.ellipse([safe_margin, safe_margin, safe_margin + safe_size, safe_margin + safe_size], 
                 fill=(0, 116, 217, 255), outline=(0, 95, 163, 255), width=int(6 * size / 192))
    
    # Draw book shape in safe area
    book_x = safe_margin + int(safe_size * 0.25)
    book_y = safe_margin + int(safe_size * 0.25)
    book_w = int(safe_size * 0.5)
    book_h = int(safe_size * 0.67)
    
    draw.rectangle([book_x, book_y, book_x + book_w, book_y + book_h], 
                   fill=(255, 255, 255, 255), outline=(51, 51, 51, 255), width=int(2 * size / 192))
    
    # Draw book spine
    draw.rectangle([book_x, book_y, book_x + int(book_w * 0.17), book_y + book_h], 
                   fill=(0, 95, 163, 255))
    
    # Draw text lines
    for i, y in enumerate([0.25, 0.31, 0.37, 0.49, 0.55, 0.61]):
        line_w = int(book_w * (0.5 - i * 0.05))
        line_y = book_y + int(book_h * y)
        draw.rectangle([book_x + int(book_w * 0.17), line_y, 
                       book_x + int(book_w * 0.17) + line_w, line_y + int(3 * size / 192)], 
                       fill=(51, 51, 51, 255))
    
    # Draw catalog grid
    grid_x = book_x + int(book_w * 0.5)
    grid_y = book_y + int(book_h * 0.62)
    for i in range(3):
        for j in range(2):
            x = grid_x + i * int(book_w * 0.1)
            y = grid_y + j * int(book_h * 0.1)
            draw.rectangle([x, y, x + int(book_w * 0.08), y + int(book_h * 0.08)], 
                           fill=(0, 116, 217, 255))
    
    # Resize back to original size
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    img.save(output_path)
    print(f'Created {output_path}')

def main():
    """Generate all PWA icons"""
    print("Generating PWA icons...")
    
    # Create directories
    os.makedirs('icons', exist_ok=True)
    os.makedirs('public/icons', exist_ok=True)
    
    # Standard icon sizes
    sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
    
    # Generate standard icons
    for size in sizes:
        create_icon(size, f'icons/icon-{size}x{size}.png')
        create_icon(size, f'public/icons/icon-{size}x{size}.png')
    
    # Generate maskable icons (most important sizes)
    maskable_sizes = [192, 512]
    for size in maskable_sizes:
        create_maskable_icon(size, f'icons/icon-{size}x{size}-maskable.png')
        create_maskable_icon(size, f'public/icons/icon-{size}x{size}-maskable.png')
    
    print("All icons generated successfully!")

if __name__ == '__main__':
    main()
