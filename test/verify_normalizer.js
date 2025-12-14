import { Normalizer } from '../src/normalizer.js';

const normalizer = new Normalizer();

const testPairs = [
    {
        a: "11 + 9 + 6 - 2",
        b: "11 - (2 - 6 - 9)",
        expectMatch: true,
        desc: "User Example: 11+9+6-2 vs 11-(2-6-9)"
    },
    {
        a: "(1 + 2) + 3",
        b: "1 + (2 + 3)",
        expectMatch: true,
        desc: "Associative Addition"
    },
    {
        a: "4 * 6",
        b: "6 * 4",
        expectMatch: true,
        desc: "Commutative Multiplication"
    },
    {
        a: "9 + 6 - 2 + 11",
        b: "11 + 9 + 6 - 2",
        expectMatch: true,
        desc: "Reordered addition/subtraction terms"
    },
    {
        a: "(4 + 8) * (13 - 11)",
        b: "(13 - 11) * (8 + 4)",
        expectMatch: true,
        desc: "Complex expression commutativity"
    },
    {
        a: "4 * (6 + 1)",
        b: "4 * 6 + 4 * 1",
        expectMatch: false,
        desc: "Distribution (Should be DIFFERENT algorithms)"
    }
];

console.log("Running Normalizer Tests...\n");

let passed = 0;
testPairs.forEach(({ a, b, expectMatch, desc }) => {
    let sigA, sigB;
    try {
        sigA = normalizer.normalize(a);
        sigB = normalizer.normalize(b);
    } catch (e) {
        console.error(`Error normalizing: ${e.message}`);
        console.log(`[FAIL] ${desc}`);
        return;
    }

    const matches = sigA === sigB;
    const result = matches === expectMatch;

    if (result) passed++;

    console.log(`[${result ? 'PASS' : 'FAIL'}] ${desc}`);
    console.log(`Expr A: ${a} -> ${sigA}`);
    console.log(`Expr B: ${b} -> ${sigB}`);
    if (!result) {
        console.log(`Expected match: ${expectMatch}, Got: ${matches}`);
    }
    console.log('---');
});

console.log(`\nResult: ${passed}/${testPairs.length} Passed`);

if (passed === testPairs.length) {
    process.exit(0);
} else {
    process.exit(1);
}
