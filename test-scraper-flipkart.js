async function main() {
    const url = "https://www.flipkart.com/sti-men-women-cargos/p/itm7ae3a4b0f62ca?pid=CRGHK2Z4EPGVTY";
    const res = await fetch(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    }});
    const html = await res.text();
    console.log("LENGTH:", html.length);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    console.log("TITLE:", titleMatch ? titleMatch[1] : "None");
}
main().catch(console.error);
