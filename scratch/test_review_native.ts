async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/results/1/review');
        if (!res.ok) {
            console.log("SERVER RETURNED STATUS:", res.status);
            const text = await res.text();
            console.log("BODY:", text);
            return;
        }
        const data = await res.json();
        console.log("RESPONSE FROM SERVER:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
}

test();
