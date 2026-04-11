async function main() {
    const url = "https://m.flipkart.com/sti-men-women-cargos/p/itm7ae3a4b0f62ca?pid=CRGHK2Z4EPGVTY";
    const res = await fetch(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    }});
    const html = await res.text();
    console.log("LENGTH:", html.length);
    
    // Attempt to extract title/price with regex just to see if it's there
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
    const titleMatch = html.match(titleRegex);
    console.log("TITLE:", titleMatch ? titleMatch[1] : "None");
    
    // Flipkart usually has "price": "1234" in schema.org JSON-LD
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
        if (match[1].includes('"@type":"Product"')) {
            console.log("FOUND PRODUCT JSON-LD!");
            try {
                const data = JSON.parse(match[1]);
                console.log("JSON-LD Price:", data.offers?.price);
                console.log("JSON-LD Image:", data.image);
            } catch (e) {
                console.log("Error parsing JSON-LD");
            }
        }
    }
}

main().catch(console.error);
