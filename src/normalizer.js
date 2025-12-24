/**
 * Normalizes a math expression string to a canonical form.
 * 
 * Logic:
 * 1. Toneize and Parse the expression into an AST (Abstract Syntax Tree).
 * 2. Normalize the AST:
 *    - Flatten associative operations: (A + B) + C -> +[A, B, C]
 *    - Sort commutative operations: A + B -> B + A (if B < A lexographically)
 *    - Distribute subtractions: A - (B - C) -> A - B + C -> +[A, -B, C]
 *      (Actually simpler: treat a - b as a + (-b). 
 *       We need to be careful with integer division. 
 *       For multiplication: A * B * C.
 *       For division: A / B. We can't easily commute division unless we treat it as * (1/B), but 1/B isn't an integer.
 *       So, Division is NOT commutative and NOT associative in the same way.
 *       (A / B) / C = A / (B * C). 
 *       A / (B / C) = A * C / B.
 *       
 *       Given the scope of "24 Game" (integers), let's stick to a robust structural normalization:
 *       - Standardize format: fully parenthesized or standard precedence.
 *       - Commutative operators (+, *): sort operands.
 *       - Associative operators (+, *): flatten.
 *       - +/- handling: A - B is A + (-1)*B. But we want to keep it simple integers. 
 *         Maybe just handle standard structural equivalence.
 *         
 *         User example: 11 + 9 + 6 - 2 vs 11 - (2 - 6 - 9)
 *         11 + 9 + 6 - 2 = 24
 *         11 - (2 - 6 - 9) = 11 - 2 + 6 + 9 = 24.
 *         These are algebraically identical.
 *         
 *         Strategy:
 *         Convert everything to a Sum of Terms or Product of Factors.
 *         Expr -> Sum(Term[])
 *         Term -> Product(Factor[])
 *         Factor -> Number or (Expr)
 *         
 *         Wait, division breaks this simple polynomial model because of integer constraint. 
 *         But for "equivalence checking", we can treat them as rational expressions.
 *         If two expressions expand to the same rational number structure, they are the same.
 *         
 *         Actually, simpler approach:
 *         1. Parse into a tree.
 *         2. Rotate tree to a canonical form for Commutative/Associative operators.
 *            - For (+, *): Flatten children, sort them.
 *            - For (-): Convert to + with negated right child? 
 *              Or just keep binary tree but allow re-association?
 *              e.g. A - (B - C) -> A - B + C.
 *              
 *         Let's try a "Polynomial-ish" normalizer for + and -.
 *         An expression is a set of positive terms and negative terms.
 *         (A + B - C) -> { positive: [A, B], negative: [C] }
 *         Then sort A, B, C recursively.
 *         
 *         Multiplication/Division is trickier.
 *         (A * B) / C -> { num: [A, B], den: [C] }
 *         A / (B / C) -> { num: [A, C], den: [B] }
 *         
 *         So:
 *         Node = { type: 'op' | 'num', val: ..., children: [] }
 *         
 *         We can transform the tree into a "Rational Form":
 *         numerator: [ list of nodes being multiplied ]
 *         denominator: [ list of nodes dividing ]
 *         sign: +1 or -1
 *         
 *         But "Terms" are added. So the top level is a Sum.
 *         Sum = [ list of Rationals being added ]
 *         
 *         This handles:
 *         11 - (2 - 6 - 9) 
 *         -> 11 - (2 - 6 - 9)
 *         -> Sum [ +11, -(Sum[+2, -6, -9]) ]
 *         -> Sum [ +11, -2, +6, +9 ]
 *         
 *         11 + 9 + 6 - 2
 *         -> Sum [ +11, +9, +6, -2 ]
 *         
 *         These two sets match exactly!
 *         
 *         What about (1+2)*3 vs 1*3 + 2*3?
 *         Usually in 24 game, those are considered different "solutions" because the steps are different.
 *         BUT the user said "substantially repetitive answers... is essentially one algorithm".
 *         Algebraic expansion (distribution) makes them identical.
 *         However, (1+2)*3 is "Add then Multiply". 1*3+2*3 is "Multiply, Multiply, Add".
 *         The user's example was purely about reordering addition/subtraction terms.
 *         
 *         "11 + 9 + 6 - 2" vs "11 - (2 - 6 - 9)".
 *         This suggests we should handle Associativity and Commutativity of + and -.
 *         Do we want to automatically distribute * over +? 
 *         (4-2)*6 vs 4*6 - 2*6.
 *         Maybe not. That feels like a different solution strategy.
 *         
 *         Decision: Only normalize + and - sequences, and * and / sequences. Do NOT distribute.
 *         
 *         Algorithm:
 *         1. Parse string to standard binary tree changes.
 *         2. Flatten + and - into a single "Sum" node with signed children.
 *            - Handle A - (B - C) -> A + (-1)*B + (-1)*(-1)*C -> A - B + C
 *         3. Flatten * and / into a single "Product" node with inverse children.
 *            - Handle A / (B / C) -> A * (1/B) * (C) -> A * C / B
 *         4. Recursively normalize children.
 *         5. Sort operands in Sum and Product nodes.
 *         6. Serialize back to string.
 */

export class Normalizer {
    normalize(expression) {
        // 1. Tokenize
        const tokens = this.tokenize(expression);
        // 2. Parse (Shunting-yard or recursive descent)
        // Simple recursive descent
        const ast = this.parse(tokens);
        // 3. Transform
        const canonical = this.canonicalize(ast);
        // 4. Stringify
        return this.serialize(canonical);
    }

    tokenize(expr) {
        // Split by operators and parens, keep them
        // Remove spaces
        return expr.match(/(\d+|\(|\)|\+|\-|\*|\/)/g) || [];
    }

    parse(tokens) {
        let cursor = 0;

        const parseExpression = () => {
            let left = parseTerm();
            while (cursor < tokens.length && (tokens[cursor] === '+' || tokens[cursor] === '-')) {
                const op = tokens[cursor++];
                const right = parseTerm();
                left = { type: 'binary', op, left, right };
            }
            return left;
        };

        const parseTerm = () => {
            let left = parseFactor();
            while (cursor < tokens.length && (tokens[cursor] === '*' || tokens[cursor] === '/')) {
                const op = tokens[cursor++];
                const right = parseFactor();
                left = { type: 'binary', op, left, right };
            }
            return left;
        };

        const parseFactor = () => {
            const token = tokens[cursor++];
            if (token === '(') {
                const expr = parseExpression();
                cursor++; // Skip )
                return expr;
            }
            return { type: 'number', value: parseInt(token, 10) };
        };

        return parseExpression();
    }

    // Canonicalize: Convert tree to Sums and Products
    // Node structure: 
    //   Sum: { type: 'sum', terms: [{ node: ..., sign: 1/-1 }] }
    //   Product: { type: 'product', factors: [{ node: ..., inverse: false/true, sign: 1/-1 }] } 
    //   Number: { type: 'number', value: ... }
    canonicalize(node) {
        if (node.type === 'number') return node;

        // Post-order traversal: normalize children first? 
        // Actually no, we need to flatten structure first, then normalize children.
        // Wait, children need to be normalized to be sortable.
        // Algorithm:
        // 1. Flatten current node into a list of terms/factors.
        // 2. Recursively canonicalize each sub-component.
        // 3. Sort the sub-components.
        // 4. For product, handle sign equivalence: (a - b) * (c - d) = (b - a) * (d - c)

        if (node.op === '+' || node.op === '-') {
            const terms = this.flattenSum(node, 1);
            // Recursively canonicalize terms
            const normTerms = terms.map(t => ({
                ...t,
                node: this.canonicalize(t.node)
            }));
            // Sort - put positive terms first
            normTerms.sort((a, b) => {
                // First by sign (positive first)
                if (a.sign !== b.sign) {
                    return b.sign - a.sign;
                }
                // Then by structure
                return this.compareTerms(a, b);
            });
            return { type: 'sum', terms: normTerms };
        }

        if (node.op === '*' || node.op === '/') {
            const factors = this.flattenProduct(node, false);
            
            // Convert each factor to its canonical form
            const normFactors = factors.map(f => {
                // Canonicalize the node first
                const canonNode = this.canonicalize(f.node);
                
                // If it's a sum (A - B), convert it to a normalized difference
                let normalizedNode = canonNode;
                let factorSign = 1;
                
                if (canonNode.type === 'sum' && canonNode.terms.length === 2) {
                    // Check if it's a simple difference: A - B
                    const t1 = canonNode.terms[0];
                    const t2 = canonNode.terms[1];
                    
                    if ((t1.sign === 1 && t2.sign === -1) || (t1.sign === -1 && t2.sign === 1)) {
                        // Create both possible forms: A - B and B - A
                        const form1 = {
                            type: 'sum',
                            terms: [{ sign: 1, node: t1.node }, { sign: -1, node: t2.node }]
                        };
                        const form2 = {
                            type: 'sum',
                            terms: [{ sign: 1, node: t2.node }, { sign: -1, node: t1.node }]
                        };
                        
                        // Serialize both forms to compare
                        const s1 = Normalizer.serializeNode(form1);
                        const s2 = Normalizer.serializeNode(form2);
                        
                        if (s1 < s2) {
                            // form1 is canonical
                            normalizedNode = form1;
                            factorSign = 1;
                        } else {
                            // form2 is canonical, but we need to track the sign change
                            normalizedNode = form1;
                            factorSign = 1;
                        }
                    }
                }
                
                return {
                    ...f,
                    node: normalizedNode,
                    factorSign: factorSign
                };
            });
            
            // For each factor, generate both possible forms (original and flipped)
            // and create a key that represents both forms
            const keyFactors = normFactors.map(f => {
                // Generate the original form key
                const origKey = Normalizer.serializeNode(f.node);
                
                // Generate the flipped form if it's a difference
                let flippedKey = origKey;
                if (f.node.type === 'sum' && f.node.terms.length === 2) {
                    const t1 = f.node.terms[0];
                    const t2 = f.node.terms[1];
                    const flippedSum = {
                        type: 'sum',
                        terms: [{ sign: 1, node: t2.node }, { sign: -1, node: t1.node }]
                    };
                    flippedKey = Normalizer.serializeNode(flippedSum);
                }
                
                // Return both keys, sorted
                return [origKey, flippedKey].sort().join('|');
            });
            
            // Sort the key factors to get a canonical order
            keyFactors.sort();
            
            // Create a unique key for the product
            const productKey = keyFactors.join('*');
            
            // Now, create a canonical form by ensuring all differences are in A - B form
            // and sorted consistently
            const finalFactors = normFactors.map(f => {
                let finalNode = f.node;
                
                if (f.node.type === 'sum' && f.node.terms.length === 2) {
                    // Ensure it's in A - B form
                    const t1 = f.node.terms[0];
                    const t2 = f.node.terms[1];
                    
                    // Create a normalized difference by sorting the terms
                    const term1Str = Normalizer.serializeNode(t1.node);
                    const term2Str = Normalizer.serializeNode(t2.node);
                    
                    if (term1Str < term2Str) {
                        // Swap terms to get B - A -> A - B
                        finalNode = {
                            type: 'sum',
                            terms: [
                                { sign: 1, node: t2.node },
                                { sign: -1, node: t1.node }
                            ]
                        };
                    }
                }
                
                return {
                    ...f,
                    node: finalNode
                };
            });
            
            // Sort the final factors to ensure consistent order
            finalFactors.sort((a, b) => {
                const sa = Normalizer.serializeNode(a.node);
                const sb = Normalizer.serializeNode(b.node);
                return sa.localeCompare(sb);
            });
            
            return { type: 'product', factors: finalFactors };
        }

        return node;
    }

    flattenSum(node, currentSign) {
        // currentSign: 1 or -1
        if (node.type === 'number') {
            return [{ node: node, sign: currentSign }];
        }
        if (node.type === 'binary') {
            if (node.op === '+') {
                return [
                    ...this.flattenSum(node.left, currentSign),
                    ...this.flattenSum(node.right, currentSign)
                ];
            } else if (node.op === '-') {
                return [
                    ...this.flattenSum(node.left, currentSign),
                    ...this.flattenSum(node.right, -currentSign)
                ];
            } else {
                // It's a product/div term, treat as a single block for the Sum
                return [{ node: node, sign: currentSign }];
            }
        }
        // Fallback
        return [{ node: node, sign: currentSign }];
    }

    flattenProduct(node, currentInverse) {
        // currentInverse: boolean (false = numerator, true = denominator)
        if (node.type === 'number') {
            return [{ node: node, inverse: currentInverse, sign: 1 }];
        }
        if (node.type === 'binary') {
            if (node.op === '*') {
                return [
                    ...this.flattenProduct(node.left, currentInverse),
                    ...this.flattenProduct(node.right, currentInverse)
                ];
            } else if (node.op === '/') {
                // A / B -> A * (1/B). 
                // If currentInverse is true (we are in denominator): 1/(A/B) = 1/A * B
                // left is inverse matches current. Right is opposite?
                // (1/A) / B = 1 / (A*B).
                // Logic:
                // Left child inherits current state.
                // Right child flips state.
                return [
                    ...this.flattenProduct(node.left, currentInverse),
                    ...this.flattenProduct(node.right, !currentInverse)
                ];
            } else {
                // Sum/Sub inside product (parens)
                return [{ node: node, inverse: currentInverse, sign: 1 }];
            }
        }
        return [{ node: node, inverse: currentInverse, sign: 1 }];
    }

    compareTerms(a, b) {
        // Sort by structure string
        const sA = Normalizer.serializeNode(a.node);
        const sB = Normalizer.serializeNode(b.node);
        if (sA < sB) return -1;
        if (sA > sB) return 1;
        // If strings same, check sign (pos first)
        return b.sign - a.sign;
    }

    compareFactors(a, b) {
        const sA = Normalizer.serializeNode(a.node);
        const sB = Normalizer.serializeNode(b.node);
        if (sA < sB) return -1;
        if (sA > sB) return 1;
        // Inverse last
        return (a.inverse ? 1 : 0) - (b.inverse ? 1 : 0);
    }

    serialize(node) {
        return Normalizer.serializeNode(node);
    }

    static serializeNode(node) {
        if (node.type === 'number') return node.value.toString();

        if (node.type === 'sum') {
            // Reconstruct string: +A +B -C
            // Optimization: Put positives first
            const terms = node.terms;
            // We can just join them with appropriate signs.
            // But strict signature: Sum(Term1, Term2...)
            // Let's use a functional signature to be unique.

            const parts = terms.map(t => (t.sign > 0 ? '+' : '-') + Normalizer.serializeNode(t.node));
            return `Sum(${parts.join(',')})`;
        }

        if (node.type === 'product') {
            const factors = node.factors;
            const parts = factors.map(f => {
                let prefix = f.inverse ? '/' : '*';
                return prefix + Normalizer.serializeNode(f.node);
            });
            return `Prod(${parts.join(',')})`;
        }

        return "";
    }
}
