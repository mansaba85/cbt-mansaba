async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/results/4/regrade', { method: 'POST' });
        const data = await res.json();
        console.log("REGRADE_RESULT:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
