async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/results');
        const data = await res.json();
        console.log("FIRST RESULT ITEM:", JSON.stringify(data[0], null, 2));
    } catch (e) {
        console.error("FETCH ERROR:", e);
    }
}

test();
