const https = require('https');

const apiKey = "AIzaSyChUdUYRfRRG2TmBJ4a2cSwW0L3AZkX9AA";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.models) {
                console.log("Supported Text Generation Models for SDK:");
                parsedData.models.forEach(m => {
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                        // The SDK expects just 'gemini-xxx', not 'models/gemini-xxx'
                        console.log(`- ${m.name.replace('models/', '')}`);
                    }
                });
            } else {
                console.log("Error:", parsedData);
            }
        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
