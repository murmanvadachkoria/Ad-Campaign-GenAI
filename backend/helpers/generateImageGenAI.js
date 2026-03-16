export async function generateImageGenAI(openai, prompt, inputAsset = undefined, size = '1024x1024', quantity = 1) {
    try {
        if (!inputAsset) {
            return await openai.images.generate({
                model: process.env.GEN_AI_MODEL,
                prompt,
                n: 1,
                size
            });
        } else {
            return await openai.images.edit({
                model: process.env.GEN_AI_MODEL,
                prompt,
                image: inputAsset,
                n: quantity,
                size
            });
        }

    } catch (err) {
        console.error('❌ Error generating Image via GenAI', err.message);
        throw err;
    }
}