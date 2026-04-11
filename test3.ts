const MOBILE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Referer': 'https://www.flipkart.com/',
};

async function main() {
    const url = 'https://m.flipkart.com/urbx-men-women-cargos/p/itm354c3574e392e';
    const res = await fetch(url, { headers: MOBILE_HEADERS, redirect: 'follow' });
    const html = await res.text();
    console.log(html.substring(0, 500));
    console.log("...");
    console.log("length:", html.length);
    console.log("Status:", res.status);
}
main().catch(console.error);
