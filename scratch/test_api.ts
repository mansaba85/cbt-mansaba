async function test() {
    try {
        const res = await fetch('http://localhost:3001/api/results');
        const data = await res.json();
        const ahmad = data.find(r => r.fullName.includes('AHMAD'));
        const alikas = data.filter(r => r.fullName.includes('ALIKA'));
        console.log("AHMAD_DATA:", JSON.stringify(ahmad, null, 2));
        console.log("ALIKA_DATA:", JSON.stringify(alikas, null, 2));
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
