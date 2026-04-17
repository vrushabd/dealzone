
import { NextRequest } from "next/server";
import { POST } from "./src/app/api/price-track/route";

async function test() {
    const req = new NextRequest("http://localhost:3000/api/price-track", {
        method: "POST",
        body: JSON.stringify({ url: "https://www.flipkart.com/bruton-trendy-sports-running-shoes-men/p/itm5de16ed79acc7" })
    });
    
    const res = await POST(req);
    const json = await res.json();
    console.log(res.status, json);
}

test().catch(console.error);

