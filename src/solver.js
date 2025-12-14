import { Normalizer } from './normalizer.js';

export class Solver {
    constructor() {
        this.target = 24;
        this.solutions = [];
    }

    solve(numbers) {
        this.solutions = [];
        if (numbers.length !== 4) return [];

        // Use a Set to avoid duplicate solution strings
        this.foundSolutions = new Set();

        // We work with objects { value: number, expr: string, op: precedence }
        // Precedence: 0 (atom), 1 (*, /), 2 (+, -)
        // Actually, simple string building with parentheses logic is easier if we just wrap everything, 
        // but cleaning it up is nicer. Let's just always wrap for simplicity, or manage precedence.
        // For a child, fully parenthesized might be clearer? Or maybe standard precedence.
        // Let's stick to standard precedence logic for display, but for now simple structure.

        const initialItems = numbers.map(n => ({
            value: n,
            expr: n.toString(),
            prec: 3
        }));

        this._search(initialItems);

        // Deduplicate using Normalizer
        const uniqueSolutions = [];
        const seenSignatures = new Set();
        const normalizer = new Normalizer(); // Assuming Normalizer is defined elsewhere or imported

        for (const sol of this.foundSolutions) {
            try {
                const sig = normalizer.normalize(sol);
                if (!seenSignatures.has(sig)) {
                    seenSignatures.add(sig);
                    uniqueSolutions.push(sol);
                }
            } catch (e) {
                console.warn("Failed to normalize:", sol, e);
                // Fallback: keep it if we can't normalize
                uniqueSolutions.push(sol);
            }
        }

        return uniqueSolutions;
    }

    _search(items) {
        if (items.length === 1) {
            if (Math.abs(items[0].value - this.target) < 1e-6) {
                this.foundSolutions.add(items[0].expr);
            }
            return;
        }

        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items.length; j++) {
                if (i === j) continue;

                const a = items[i];
                const b = items[j];

                // Remaining items excluding a and b
                const nextItemsBase = items.filter((_, idx) => idx !== i && idx !== j);

                // Try all 4 operations
                this._tryOp(a, b, '+', nextItemsBase);
                this._tryOp(a, b, '-', nextItemsBase); // a - b
                this._tryOp(a, b, '*', nextItemsBase);

                // Division: ONLY if exact integer division
                if (b.value !== 0 && a.value % b.value === 0) {
                    this._tryOp(a, b, '/', nextItemsBase);
                }
            }
        }
    }

    _tryOp(a, b, op, baseItems) {
        let val = 0;
        let prec = 0; // 0: atom/parens, 1: mul/div, 2: add/sub

        // Calculate value
        switch (op) {
            case '+': val = a.value + b.value; prec = 2; break;
            case '-': val = a.value - b.value; prec = 2; break;
            case '*': val = a.value * b.value; prec = 1; break;
            case '/': val = a.value / b.value; prec = 1; break;
        }

        // Format expression
        // If child expression has lower precedence (higher number in my scale), wrap it
        // Scale: 0 (high/atom), 1 (*, /), 2 (+, -)
        // Actually standard: 
        // 3: atom
        // 2: * /
        // 1: + -
        // Let's use standard for check.

        const PRECOF = { '+': 1, '-': 1, '*': 2, '/': 2 };
        const myPrec = PRECOF[op];

        const format = (item, isRight = false) => {
            let text = item.expr;
            // If child has lower precedence (e.g. + inside *), wrap
            // Or if same precedence and it matters (e.g. - or / on right), wrap
            // Simple heuristic: if item.prec < myPrec, no wrap. 
            // If item.prec > myPrec (meaning lower priority operation was done), wrap.
            // Wait, I stored prec as 1 or 2. 
            // Let's just track "priority". Higher is tighter binding.
            // If child priority < current priority, wrap.
            // Example: (1+2) * 3. Child +, 1. Current *, 2. 1 < 2, wrap.
            // Example: 1*2 + 3. Child *, 2. Current +, 1. 2 >= 1, no wrap.

            // Special case: Right side of - or /. 
            // 1 - (2 - 3) -> distinct from 1 - 2 - 3.
            // 1 / (2 / 3) -> distinct from 1 / 2 / 3.
            // If we have same precedence on right for non-commutative, wrap?
            // Actually, strictly: 
            // (a - b) - c = a - b - c (left assoc)
            // a - (b - c) (requires parens)

            let needsParens = false;
            if (item.prec < myPrec) {
                needsParens = true;
            } else if (item.prec === myPrec) {
                if (isRight && (op === '-' || op === '/')) {
                    needsParens = true;
                }
                // For + and *: commutative-ish visually, but (1+2)+3 vs 1+(2+3).
                // Usually we don't need parens for 1+(2+3).
            }

            return needsParens ? `(${text})` : text;
        };

        // For the recursion item, we store the precedence of the operation that created it.
        // Atoms have precedence 3 (highest).

        // Let's re-define prec passed in objs.
        // a.prec and b.prec are what they came with.
        // New item will have myPrec.

        const exprA = format(a, false);
        const exprB = format(b, true);

        const newExpr = `${exprA} ${op} ${exprB}`;

        const newItem = {
            value: val,
            expr: newExpr,
            prec: myPrec
        };

        this._search([...baseItems, newItem]);
    }
}
