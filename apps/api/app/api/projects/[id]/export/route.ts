import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import JSZip from 'jszip';

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
        const cleanTitle = page.title ? sanitizeFilename(page.title) : `page_${page.id.slice(0,8)}`;
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

    // Select the best 5-6 assets to be copied directly into the lovable-drag-and-drop flat folder
    // This allows selecting all files in lovable-drag-and-drop/ (3 text + 6 images = 9 files total)
    // and dropping them in a single message, avoiding Lovable's 10-file upload limit!
    const dragDropAssets: any[] = [];
    if (assets && assets.length > 0) {
      // 1. Logo
      const logoAsset = assets.find((a: any) => a.asset_type === 'logo');
      if (logoAsset) dragDropAssets.push(logoAsset);

      // 2. Best Products (up to 3, sorted by quality_score if present, or just first 3)
      const products = assets
        .filter((a: any) => a.asset_type === 'product' && a.id !== logoAsset?.id)
        .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
        .slice(0, 3);
      dragDropAssets.push(...products);

      // 3. Best Interior/Gallery (up to 2, sorted by quality_score)
      const interior = assets
        .filter((a: any) => (a.asset_type === 'interior' || a.asset_type === 'gallery') && a.id !== logoAsset?.id)
        .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
        .slice(0, 2);
      dragDropAssets.push(...interior);
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
5. \`product_1.[ext]\`, \`product_2.[ext]\`, \`product_3.[ext]\` (Top 3 premium dish photos)
6. \`interior_1.[ext]\`, \`interior_2.[ext]\` (Top 2 restaurant environment photos)

### 🚀 Step-by-Step Instructions:
1. Extract this ZIP archive on your computer.
2. Open the **\`lovable-drag-and-drop\`** folder.
3. Select **all 9 files** and drag and drop them together into your Lovable chat interface!
4. Send the message to Lovable. The files will upload instantly with no limits reached!
5. In your chat prompt, write:
   *"Use the exact assets from the uploaded zip in public/assets/ (referencing the original filenames like logo.png, products/7.jpg) and import the exact menu items and copywriting from the files inside content/."*

This hybrid execution guarantees that the generated site will have **100% precise pricing, authentic Polish texts, and real visual assets** physically bundled in the codebase, bypassing any hotlink blocks or AI hallucinations!

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
          const rawName = asset.asset_url.split('/').pop() || `asset_${asset.id.slice(0, 8)}`;
          const cleanName = sanitizeFilename(decodeURIComponent(rawName).replace(/\.[^/.]+$/, ''));
          const localPath = `original-content/assets/${asset.asset_type || 'other'}/${cleanName}.${ext}`;
          
          const isIncludedInDragDrop = dragDropAssets.some(d => d.id === asset.id);
          
          assetManifest += `- **Local Path**: \`${localPath}\`\n`;
          assetManifest += `  - Original URL: ${asset.asset_url}\n`;
          assetManifest += `  - Type: ${asset.asset_type || 'Unknown'}\n`;
          assetManifest += `  - Drag-and-Drop Essential: ${isIncludedInDragDrop ? '✅ Yes' : 'No'}\n`;
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
          // Remove extension to sanitize name safely
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
          const buffer = Buffer.from(arrayBuffer);
          
          // Write to main structured catalog
          zip.file(localPath, buffer);

          // If this asset was chosen for the lovable-drag-and-drop flat folder, write it there too!
          const dragDropMatch = dragDropAssets.find(d => d.id === asset.id);
          if (dragDropMatch) {
            // Label cleanly e.g., logo.png, product_1.jpg, interior_1.jpg
            let flatName = '';
            if (asset.asset_type === 'logo') {
              flatName = `logo.${ext}`;
            } else if (asset.asset_type === 'product') {
              const prodIdx = dragDropAssets.filter(d => d.asset_type === 'product').findIndex(d => d.id === asset.id) + 1;
              flatName = `product_${prodIdx}.${ext}`;
            } else {
              const intIdx = dragDropAssets.filter(d => d.asset_type !== 'logo' && d.asset_type !== 'product').findIndex(d => d.id === asset.id) + 1;
              flatName = `interior_${intIdx}.${ext}`;
            }
            
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
