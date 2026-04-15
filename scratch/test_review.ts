import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/results/1/review');
        const data = await res.json();
        console.log("RESPONSE FROM SERVER:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
}

test();
