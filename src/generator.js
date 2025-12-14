import { Solver } from './solver.js';

export class Generator {
    constructor() {
        this.solver = new Solver();
    }

    generate() {
        let numbers;
        let solutions;

        do {
            numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
            solutions = this.solver.solve(numbers);
        } while (solutions.length === 0);

        return {
            numbers,
            solutions
        };
    }
}
