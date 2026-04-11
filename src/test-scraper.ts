import { parse } from 'node-html-parser';

async function main() {
    const url = "https://www.flipkart.com/sti-men-women-cargos/p/itm7ae3a4b0f62ca?pid=CRGHK2Z4EPGVTY";
    const res = await fetch(url, { headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    }});
    const html = await res.text();
    console.log("Desktop Length:", html.length);
    console.log("Desktop Title:", parse(html).querySelector('title')?.text);
    
    const mUrl = url.replace('www.flipkart.com', 'm.flipkart.com');
    const mRes = await fetch(mUrl, { headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    }});
    const mHtml = await mRes.text();
    console.log("Mobile Length:", mHtml.length);
    console.log("Mobile Title:", parse(mHtml).querySelector('title')?.text);
    
    const price = parse(mHtml).querySelector('._1vC4OE')?.text ||
                  parse(mHtml).querySelector('.Y1HWO0')?.text ||
                  parse(mHtml).querySelector('[class*="price"]')?.text || '0';
    console.log("Mobile Price:", price);
}

main().catch(console.error);
