import path from "path";
import fs from "fs/promises";

/**
 * Download image from URL and return as Buffer
 */
export async function fetchImageBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
}

/**
 * Resolve an input asset for a product if it exists in the assets folder.
 * Looks for files named like: <productName>.<ext> (case-insensitive, spaces→underscores)
 */
export async function resolveInputAsset(productName, assetDir) {
    const slug = productName.toLowerCase().replace(/\s+/g, '_');
    const exts = ['.png', '.jpg', '.jpeg', '.webp'];
    for (const ext of exts) {
        const candidate = path.join(assetDir, `${slug}${ext}`);
        try {
            await fs.access(candidate);
            console.log(`  ✅ Found existing asset: ${candidate}`);
            return candidate;
        } catch {
            // not found, try next
        }
    }
    return null;
}

/**
 * Saves image to dir
 *
 * @param ratio
 * @param productSlug
 * @param outputDir
 * @param imageBuffer
 * @returns {Promise<void>}
 */
export async function writeImageToDir(ratio, productSlug, outputDir, imageBuffer) {
    const ratioSlug = ratio.replace(':', 'x');
    const filename = `${productSlug}_${ratioSlug}.png`;
    const outputPath = path.join(outputDir, filename);

    await fs.writeFile(outputPath, imageBuffer);

    console.log(`  💾 Saved new output image to: ${outputPath}`);

    return filename;
}