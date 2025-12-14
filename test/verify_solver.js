import { Solver } from '../src/solver.js';

const solver = new Solver();

const testCases = [
    { input: [4, 6, 1, 1], expected: true, desc: "Simple checks (e.g. 4*6*1*1)" },
    { input: [1, 1, 1, 1], expected: false, desc: "Impossible case" },
    { input: [3, 3, 8, 8], expected: false, desc: "Fraction case (8/(3-8/3)) - Should fail under integer-only rule" },
    { input: [1, 2, 3, 4], expected: true, desc: "1*2*3*4 = 24" },
    { input: [10, 10, 4, 4], expected: true, desc: "User example (10*10-4)/4" }
];

console.log("Running Solver Tests...\n");

let passed = 0;
testCases.forEach(({ input, expected, desc }) => {
    const solutions = solver.solve(input);
    const hasSolution = solutions.length > 0;

    const result = hasSolution === expected;
    if (result) passed++;

    console.log(`[${result ? 'PASS' : 'FAIL'}] ${desc}`);
    console.log(`Input: ${input}`);
    console.log(`Expected: ${expected}, Got: ${hasSolution} (Count: ${solutions.length})`);
    if (solutions.length > 0) {
        console.log(`Sample: ${solutions[0]}`);
    }
    console.log('---');
});

console.log(`\nResult: ${passed}/${testCases.length} Passed`);

if (passed === testCases.length) {
    process.exit(0);
} else {
    process.exit(1);
}
