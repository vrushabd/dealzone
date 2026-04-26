import fs from 'fs';

async function main() {
    const url = "https://www.meesho.com/hoppup-xo3-gaming-earbuds-with-35/p/2u0w0g";
    const res = await fetch(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    }});
    const html = await res.text();
    fs.writeFileSync('meesho_dump.html', html);
    console.log("Meesho Dumped, length:", html.length);
}

main().catch(console.error);
