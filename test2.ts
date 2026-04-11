const BASE_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': '"Google Chrome";v="124", "Not:A-Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
};

const FLIPKART_HEADERS = {
    ...BASE_HEADERS,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://www.flipkart.com/',
    'Origin': 'https://www.flipkart.com',
};

async function main() {
    const url = 'https://www.flipkart.com/urbx-men-women-cargos/p/itm354c3574e392e';
    const res = await fetch(url, { headers: FLIPKART_HEADERS, redirect: 'follow' });
    const html = await res.text();
    console.log(html.substring(0, 500));
    console.log("...");
    console.log("length:", html.length);
    console.log("Status:", res.status);
}
main().catch(console.error);
