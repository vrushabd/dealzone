import fetch from "node-fetch";

async function listModels() {
    const apiKey = "AIzaSyChUdUYRfRRG2TmBJ4a2cSwW0L3AZkX9AA";
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        
        console.log("Supported Text Generation Models:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}
listModels();
