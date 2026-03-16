import path from "path";
import fs from "fs/promises";
import { generateImageGenAI } from "./generateImageGenAI.js";
import { toFile } from "openai";

function buildInputImagePrompt(product) {
    return [
        `Asset to use in social media advertising campaign image.`,
        `Product name: "${product.name}"`,
            `Product category: ${product.category}.`,
        `No text, no words, no logos in the image — clean product-focused composition.`,
        `Photorealistic, studio-quality lighting, suitable for social media advertising.`
    ].join(' ');
}

export async function generateInputAssetImage(openai, product, productSlug, assetDir) {
    const prompt = buildInputImagePrompt(product);

    const response = await generateImageGenAI(openai, prompt);

    const image = response.data[0].b64_json;
    const imageBuffer = Buffer.from(image, 'base64');

    const savePath = path.join(assetDir, `${productSlug}.png`);
    await fs.writeFile(savePath, imageBuffer);
    console.log(`  💾 Saved new input asset to: ${savePath}`);

    return await toFile(imageBuffer, `${productSlug}.png`, { type: 'image/png' });
}