import sys
import os
from PIL import Image, ImageFilter, ImageEnhance

def sharpen_and_upscale(input_path, output_path, scale_factor=3):
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input file {input_path} does not exist.")
            sys.exit(1)

        img = Image.open(input_path)
        
        # Keep original format or save as JPEG
        orig_mode = img.mode
        if orig_mode in ['RGBA', 'LA'] or (orig_mode == 'P' and 'transparency' in img.info):
            # If transparent, keep RGBA and save as PNG
            img = img.convert('RGBA')
            save_format = 'PNG'
        else:
            img = img.convert('RGB')
            save_format = 'JPEG'
            
        w, h = img.size
        
        # Don't upscale if the image is already large (e.g. >1200px)
        if w >= 1200 or h >= 1200:
            img.save(output_path, save_format, quality=95)
            print(f"Success: Image already large ({w}x{h}), preserved as-is.")
            return

        # Calculate new dimensions
        new_w = int(w * scale_factor)
        new_h = int(h * scale_factor)
        
        # 1. Advanced Lanczos Resampling to upscale smoothly
        img_upscaled = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 2. Apply Unsharp Mask to recover sharp edges and details
        # radius=1.5, percent=120, threshold=2 is the sweet spot for food textures
        sharpened = img_upscaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=2))
        
        # 3. Boost contrast and color vibrance slightly to make dish photos look modern & appetizing
        contrast = ImageEnhance.Contrast(sharpened)
        enhanced = contrast.enhance(1.06) # 6% contrast boost
        
        color = ImageEnhance.Color(enhanced)
        final_img = color.enhance(1.05) # 5% saturation boost
        
        # Save output
        if save_format == 'PNG':
            final_img.save(output_path, 'PNG')
        else:
            final_img.save(output_path, 'JPEG', quality=95, optimize=True)
            
        print(f"Success: Upscaled from {w}x{h} to {new_w}x{new_h} using Lanczos + Unsharp Mask.")
        
    except Exception as e:
        print(f"Failed to process image: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 sharpen.py <input_path> <output_path> [scale_factor]")
        sys.exit(1)
        
    scale = 3.0
    if len(sys.argv) >= 4:
        try:
            scale = float(sys.argv[3])
        except ValueError:
            pass
            
    sharpen_and_upscale(sys.argv[1], sys.argv[2], scale)
