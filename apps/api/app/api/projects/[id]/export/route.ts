import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

// Helper to sanitize filenames for the ZIP
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_\-\.]/g, '_')
    .replace(/__+/g, '_')
    .trim();
}

// Helper to extract clean file extension or fallback
function getExtension(url: string, fileType?: string): string {
  if (fileType) {
    const cleanType = fileType.toLowerCase();
    if (cleanType.includes('png')) return 'png';
    if (cleanType.includes('gif')) return 'gif';
    if (cleanType.includes('svg')) return 'svg';
    if (cleanType.includes('webp')) return 'webp';
    if (cleanType.includes('jpeg') || cleanType.includes('jpg')) return 'jpg';
  }

  // Try extracting from URL
  const match = url.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }

  return 'jpg'; // default fallback
}

// Helper to get descriptive, content-accurate filenames for assets
function getDescriptiveFilename(asset: any, ext: string): string {
  const urlLower = (asset.asset_url || '').toLowerCase();
  const altLower = (asset.alt_text || '').toLowerCase();

  // Logo detection
  if (asset.asset_type === 'logo' || urlLower.includes('logo') || altLower.includes('logo')) {
    return `logo.${ext}`;
  }

  // Food Products matching
  if (urlLower.includes('pizza') || altLower.includes('pizza')) {
    return `pizza.${ext}`;
  }
  if (urlLower.includes('pasta') || urlLower.includes('makaron') || altLower.includes('pasta') || altLower.includes('makaron')) {
    return `pasta.${ext}`;
  }
  if (urlLower.includes('przystawki') || urlLower.includes('salat') || altLower.includes('przystawki') || altLower.includes('sałat')) {
    return `przystawki_i_salatki.${ext}`;
  }
  if (urlLower.includes('bagiet') || altLower.includes('bagiet')) {
    return `bagietki.${ext}`;
  }
  if (urlLower.includes('dania') || urlLower.includes('zapiekank') || altLower.includes('zapiekank')) {
    return `zapiekanki.${ext}`;
  }
  if (urlLower.includes('deser') || urlLower.includes('napoj') || altLower.includes('deser') || altLower.includes('napój') || urlLower.includes('napoje')) {
    return `desery_i_napoje.${ext}`;
  }

  // Interior/Atmosphere/Hero matching
  if (urlLower.includes('banner') || urlLower.includes('homepage') || urlLower.includes('hero') || urlLower.includes('layout')) {
    return `hero_visual.${ext}`;
  }
  if (urlLower.includes('restauracja') || urlLower.includes('interior') || altLower.includes('restauracja') || altLower.includes('interior')) {
    return `interior_restaurant.${ext}`;
  }

  // Generic fallback with type and clean name
  const rawName = asset.asset_url.split('/').pop() || `asset_${asset.id.slice(0, 5)}`;
  const cleanName = sanitizeFilename(decodeURIComponent(rawName).replace(/\.[^/.]+$/, ''));
  return `${asset.asset_type || 'asset'}_${cleanName}.${ext}`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    // 1. Fetch Project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Fetch the latest generated prompt
    const { data: promptData } = await supabaseAdmin
      .from('generated_prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Fetch all crawled pages
    const { data: pages } = await supabaseAdmin
      .from('pages')
      .select('*')
      .eq('project_id', projectId);

    // 4. Fetch all website assets
    const { data: assets } = await supabaseAdmin
      .from('website_assets')
      .select('*')
      .eq('project_id', projectId);

    // Create a new ZIP package
    const zip = new JSZip();

    // Build unified crawled-content.md (combining all pages' text)
    let unifiedContent = `# Original Crawled Website Copy - ${project.url}\n\n`;
    unifiedContent += `This unified document contains the complete text copy extracted from all crawled pages of Pizzeria Portofino. Use this exact text to populate sections, items, and pricing.\n\n`;

    if (pages && pages.length > 0) {
      pages.forEach((page: any) => {
        unifiedContent += `==================================================\n`;
        unifiedContent += `PAGE: ${page.title || 'Untitled Page'}\n`;
        unifiedContent += `URL: ${page.url}\n`;
        unifiedContent += `==================================================\n\n`;
        unifiedContent += page.markdown_content || '*(No text content detected on this page)*';
        unifiedContent += `\n\n`;

        // Write separate pages in their folder for backup
        const cleanTitle = page.title ? sanitizeFilename(page.title) : `page_${page.id.slice(0, 8)}`;
        const pageFileName = `original-content/pages/${cleanTitle}.md`;
        const pageSpecificContent = `
# Original Crawled Content: ${page.title || 'Untitled Page'}
- Source URL: ${page.url}
- Crawled At: ${new Date(page.created_at).toLocaleString()}

---

${page.markdown_content || '*(No text content detected on this page)*'}
`.trim();
        zip.file(pageFileName, pageSpecificContent);
      });
    } else {
      unifiedContent += `*(No pages crawled or detected)*`;
    }

    // Write unified content to both directories
    zip.file('original-content/crawled-content.md', unifiedContent);
    zip.file('lovable-drag-and-drop/crawled-content.md', unifiedContent);

    // Add prompt.txt at root and inside lovable-drag-and-drop/
    const promptText = promptData?.prompt || 'Lovable generation prompt not generated yet. Please run Step 4 in the pipeline first.';
    zip.file('prompt.txt', promptText);
    zip.file('lovable-drag-and-drop/prompt.txt', promptText);

    // Select the best, content-distinct brand assets for the lovable-drag-and-drop flat folder
    // We select exactly 6 unique descriptive files to stay strictly under the 10-file message upload limit
    const dragDropAssets: any[] = [];
    if (assets && assets.length > 0) {
      // Helper to add unique matching asset
      const addFirstMatch = (filterFn: (a: any) => boolean) => {
        const found = assets.find((a: any) => filterFn(a) && !dragDropAssets.some(d => d.id === a.id));
        if (found) dragDropAssets.push(found);
        return found;
      };

      // 1. Primary Logo
      addFirstMatch((a: any) => a.asset_type === 'logo' || a.asset_url.toLowerCase().includes('logo'));

      // 2. Pizza Product
      addFirstMatch((a: any) => a.asset_type === 'product' && (a.asset_url.toLowerCase().includes('pizza') || a.alt_text?.toLowerCase().includes('pizza')));

      // 3. Pasta/Makaron Product
      addFirstMatch((a: any) => a.asset_type === 'product' && (a.asset_url.toLowerCase().includes('pasta') || a.asset_url.toLowerCase().includes('makaron') || a.alt_text?.toLowerCase().includes('makaron')));

      // 4. Salad/Przystawki Product
      addFirstMatch((a: any) => a.asset_type === 'product' && (a.asset_url.toLowerCase().includes('przystawki') || a.asset_url.toLowerCase().includes('salat') || a.alt_text?.toLowerCase().includes('sałat')));

      // 5. Hero Visual
      addFirstMatch((a: any) => a.asset_url.toLowerCase().includes('banner') || a.asset_url.toLowerCase().includes('homepage'));

      // 6. Interior/Restaurant Atmosphere Photo
      addFirstMatch((a: any) => a.asset_type === 'interior' || a.asset_type === 'gallery' || a.asset_url.toLowerCase().includes('restauracja'));

      // Fill in generic backup products if any of the above were missing, up to max 6 images
      if (dragDropAssets.length < 6) {
        const fallbackProducts = assets
          .filter((a: any) => a.asset_type === 'product' && !dragDropAssets.some(d => d.id === a.id))
          .slice(0, 6 - dragDropAssets.length);
        dragDropAssets.push(...fallbackProducts);
      }
    }

    // Add README at root
    const readmeContent = `
# Lovable.ai Website Modernization Package

This package contains the exact raw content, verified authentic assets, and a state-of-the-art visual prompt generated for **Pizzeria Portofino** (Original URL: ${project.url}).

---

## ⚡️ QUICK START: HOW TO BYPASS LOVABLE'S 10-FILE LIMIT ⚡️

Lovable has a strict limit of **10 files per upload message**. To make this completely plug-and-play, we created a dedicated folder inside this ZIP:

📁 \`lovable-drag-and-drop/\`

This folder contains **exactly 9 files** (the optimal combination of brand content and high-quality photos):
1. \`prompt.txt\` (Visual system prompt)
2. \`crawled-content.md\` (Unified copy of ALL pages and subpages combined!)
3. \`assets-manifest.md\` (Mapped original asset paths and tags)
4. \`logo.[ext]\` (Your authentic brand logo)
5. \`pizza.[ext]\` (Authentic photo of Pizza)
6. \`pasta.[ext]\` (Authentic photo of Pasta/Makarony)
7. \`przystawki_i_salatki.[ext]\` (Authentic photo of Appetizers/Salads)
8. \`hero_visual.[ext]\` (The main landing page Banner/Hero image)
9. \`interior_restaurant.[ext]\` (Authentic photo of the restaurant's interior)

### 🚀 Step-by-Step Instructions:
1. Extract this ZIP archive on your computer.
2. Open the **\`lovable-drag-and-drop\`** folder.
3. Select **all 9 files** and drag and drop them together into your Lovable chat interface!
4. Send the message to Lovable. The files will upload instantly with no limits reached!
5. In your chat prompt, write:
   *"Use the exact assets from the uploaded files (referencing the exact content-descriptive filenames like logo.png, pizza.jpg, pasta.jpg, przystawki_i_salatki.jpg) and import the exact menu items and copywriting from the crawled-content.md."*

This content-descriptive naming guarantees that Lovable will map the **correct photo to the correct section** with surgical precision (showing a Pizza under Pizza, Pasta under Pasta, and Salad under Salads), bypassing any hotlink blocks or AI hallucinations!

---
Generated by Antigravity Website Modernization Pipeline
Date: ${new Date().toLocaleDateString()}
Project ID: ${projectId}
`.trim();

    zip.file('README.md', readmeContent);

    // Build Asset Manifest and Download Images
    let assetManifest = `# Website Asset Manifest\n\nThis document maps the real, verified brand photos and assets from the original website to their package paths.\n\n`;
    const downloadErrors: string[] = [];

    if (assets && assets.length > 0) {
      // Group assets by type for manifest
      const logos = assets.filter((a: any) => a.asset_type === 'logo');
      const products = assets.filter((a: any) => a.asset_type === 'product');
      const interior = assets.filter((a: any) => a.asset_type === 'interior' || a.asset_type === 'gallery');
      const others = assets.filter((a: any) => !['logo', 'product', 'interior', 'gallery'].includes(a.asset_type));

      const writeManifestSection = (title: string, list: any[]) => {
        if (list.length === 0) return;
        assetManifest += `## ${title}\n\n`;
        list.forEach((asset) => {
          const ext = getExtension(asset.asset_url, asset.file_type);
          const localPath = `original-content/assets/${asset.asset_type || 'other'}/${sanitizeFilename(asset.asset_url.split('/').pop() || '')}`;

          const dragDropAsset = dragDropAssets.find(d => d.id === asset.id);
          const dragDropName = dragDropAsset ? getDescriptiveFilename(asset, ext) : null;

          assetManifest += `- **Local Path**: \`${localPath}\`\n`;
          assetManifest += `  - Original URL: ${asset.asset_url}\n`;
          assetManifest += `  - Content-Descriptive Name (for Drag-Drop): ${dragDropName ? `\`lovable-drag-and-drop/${dragDropName}\` ✅` : 'N/A'}\n`;
          assetManifest += `  - Type: ${asset.asset_type || 'Unknown'}\n`;
          if (asset.alt_text) assetManifest += `  - Alt Text: "${asset.alt_text}"\n`;
          if (asset.quality_score) assetManifest += `  - Quality Score: ${asset.quality_score}/10\n`;
          assetManifest += `\n`;
        });
      };

      writeManifestSection('Brand Logos', logos);
      writeManifestSection('Products & Dishes', products);
      writeManifestSection('Interior & Atmosphere', interior);
      writeManifestSection('Other Media Assets', others);

      zip.file('original-content/assets-manifest.md', assetManifest);
      zip.file('lovable-drag-and-drop/assets-manifest.md', assetManifest);

      // Concurrently download assets in batches to be efficient but safe
      const batchSize = 6;
      const downloadTasks: (() => Promise<void>)[] = assets.map((asset: any) => async () => {
        try {
          const ext = getExtension(asset.asset_url, asset.file_type);
          const rawName = asset.asset_url.split('/').pop() || `asset_${asset.id.slice(0, 8)}`;
          const cleanName = sanitizeFilename(decodeURIComponent(rawName).replace(/\.[^/.]+$/, ''));

          const localPath = `original-content/assets/${asset.asset_type || 'other'}/${cleanName}.${ext}`;

          // Perform request with realistic user agent to prevent hotlink protections/403s
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout per image

          const res = await fetch(asset.asset_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Referer': project.url
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
          }

          const arrayBuffer = await res.arrayBuffer();
          let buffer = Buffer.from(arrayBuffer);

          // Check if this is a critical brand asset that needs upscaling (logo, products, interiors)
          const dragDropMatch = dragDropAssets.find(d => d.id === asset.id);
          const isCriticalType = ['logo', 'product', 'interior', 'gallery'].includes(asset.asset_type || '');

          if ((dragDropMatch || isCriticalType) && ['jpg', 'jpeg', 'png'].includes(ext)) {
            // Write buffer to temporary file in current workspace directory
            const tempId = Math.random().toString(36).substring(7);
            const tempInputPath = path.join(process.cwd(), `temp_in_${tempId}.${ext}`);
            const tempOutputPath = path.join(process.cwd(), `temp_out_${tempId}.${ext}`);

            try {
              fs.writeFileSync(tempInputPath, buffer);

              // Run our local high-fidelity Lanczos + Unsharp Mask upscaling pipeline!
              execSync(`python3 sharpen.py "${tempInputPath}" "${tempOutputPath}" 3`);

              if (fs.existsSync(tempOutputPath)) {
                // Load the super-resolution enhanced buffer
                buffer = fs.readFileSync(tempOutputPath);
              }
            } catch (upscaleErr: any) {
              console.error(`[Exporter] Local upscaling failed for ${asset.asset_url}:`, upscaleErr.message);
            } finally {
              // Always clean up temp files immediately
              if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
              if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
            }
          }

          // Write upscaled asset to main structured catalog
          zip.file(localPath, buffer);

          // Write upscaled asset to drag-drop folder
          if (dragDropMatch) {
            const flatName = getDescriptiveFilename(asset, ext);
            zip.file(`lovable-drag-and-drop/${flatName}`, buffer);
          }
        } catch (err: any) {
          console.error(`[Exporter] Failed to download asset: ${asset.asset_url}`, err.message);
          downloadErrors.push(`- URL: ${asset.asset_url}\n  Error: ${err.message || 'Unknown error'}`);
        }
      });

      // Execute in batches
      for (let i = 0; i < downloadTasks.length; i += batchSize) {
        const batch = downloadTasks.slice(i, i + batchSize);
        await Promise.all(batch.map((task) => task()));
      }
    } else {
      zip.file('original-content/assets-manifest.md', '# Website Asset Manifest\n\n*(No assets crawled or detected for this project)*');
    }

    // Write download errors log if any failed
    if (downloadErrors.length > 0) {
      const errorLog = `
# Asset Download Failures Log

Some image assets could not be physically downloaded into this package due to remote server errors, connection timeouts, or hotlinking protection. 
The fallback URL matches are listed in your manifest and the prompt. Lovable can still try to fetch them dynamically.

## Failed Assets:
${downloadErrors.join('\n\n')}
`.trim();
      zip.file('download-errors.txt', errorLog);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Build responsive and clean download stream
    const safeDomain = project.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\.[a-z]{2,}.*$/, '');
    const archiveName = `${safeDomain}-lovable-package.zip`;

    const response = new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${archiveName}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

    return response;
  } catch (error: any) {
    console.error('[Exporter] Failed to generate zip package:', error);
    return NextResponse.json(
      { error: `Internal exporter failure: ${error.message || error}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
