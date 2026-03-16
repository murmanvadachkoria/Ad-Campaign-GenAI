import { generateImageGenAI } from "./generateImageGenAI.js";
import { writeImageToDir } from "./helpers.js";
import sharp from "sharp";

function buildImagePrompt(product, brief, localizedMessage) {
    return [
        `Professional advertising campaign image for a product called "${product.name}".`,
        `Product category: ${product.category}.`,
        `Description: ${product.description}`,
        `Target region: ${brief.targetRegion}. Target audience: ${brief.targetAudience}.`,
        `Add ${localizedMessage} to the image, in a way that it displays professional advertising`,
        `Mood/style: vibrant, commercial, high-end lifestyle photography aesthetic.`,
        `No logos in the image — clean product-focused composition.`,
        `Photorealistic, studio-quality lighting, suitable for social media advertising.`,
    ];
}

// Aspect ratio configurations: name → [width, height]
export const ASPECT_RATIOS = {
    '1:1':  { width: 1024, height: 1024, label: 'Square',   size: '1024x1024' },
    '9:16': { width: 576,  height: 1024, label: 'Portrait', size: '1024x1536' },
    '16:9': { width: 1024, height: 576,  label: 'Landscape',size: '1536x1024' },
};

export async function generateOutputImage(openai, product, productSlug, brief, outputDir, inputAsset, sessionId, localizedMessage) {
    const prompt = buildImagePrompt(product, brief, localizedMessage);
    let responseData = [];

    const response = await generateImageGenAI(openai, prompt.join(' '), inputAsset);

    const image = response.data[0].b64_json;
    const imageBuffer = Buffer.from(image, 'base64');

    for (const [ratio, config] of Object.entries(ASPECT_RATIOS)) {
        const { width, height, label } = config;

        // Resize/crop the hero image to the target aspect ratio
        let resizedBuffer = await sharp(imageBuffer)
            .resize(width, height, { fit: process.env.SHARP_RESIZE_FIT, position: 'centre' })
            .png()
            .toBuffer();

        const filename = await writeImageToDir(ratio, productSlug, outputDir, resizedBuffer);

        console.log(`  ✅ Saved [${ratio}] → ${outputDir}`);

        responseData.push({
            product: product.name,
            ratio: ratio,
            label,
            width,
            height,
            filename,
            path: outputDir,
            url: `/output/${sessionId}/${productSlug}/${filename}`,
            localizedMessage,
            locale: brief.locale,
            reusedAsset: !!inputAsset
        });
    }

    return responseData;
}