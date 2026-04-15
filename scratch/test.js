const block = "Berikut ini yang merupakan tindakan... <br/> A. Menjauhkan <br/> B. Memastikan";
const optionSplitRegex = /(?:^|>|&nbsp;|\s+)([A-Z])[\.\:]\s*[\)\s]*/g;
let normalizedBlock = block.replace(optionSplitRegex, (m, char) => ` [[OPT_${char}]] `);
const parts = normalizedBlock.split(/\[\[OPT_[A-Z]\]\]/);
console.log("PARTS LENGTH:", parts.length);
console.log("FINAL TYPE:", parts.length > 1 ? "MCSA" : "ESSAY");
