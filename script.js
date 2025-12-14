// 算24核心算法
class TwentyFourSolver {
    constructor() {
        this.operators = ['+', '-', '*', '/'];
        this.solutions = new Set();
    }

    // 生成4个随机数字（1~13）
    generateNumbers() {
        const numbers = [];
        for (let i = 0; i < 4; i++) {
            numbers.push(Math.floor(Math.random() * 13) + 1);
        }
        return numbers;
    }

    // 计算两个数的结果，考虑除法必须为整数
    calculate(a, b, operator) {
        switch (operator) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '*':
                return a * b;
            case '/':
                if (b === 0 || a % b !== 0) {
                    return null; // 除法结果不是整数，返回null
                }
                return a / b;
            default:
                return null;
        }
    }

    // 生成所有排列组合
    generatePermutations(arr) {
        const result = [];
        
        const permute = (arr, m = []) => {
            if (arr.length === 0) {
                result.push(m);
            } else {
                for (let i = 0; i < arr.length; i++) {
                    const curr = arr.slice();
                    const next = curr.splice(i, 1);
                    permute(curr.slice(), m.concat(next));
                }
            }
        };
        
        permute(arr);
        return result;
    }

    // 生成所有运算符组合
    generateOperators() {
        const result = [];
        
        const generate = (ops = []) => {
            if (ops.length === 3) {
                result.push(ops);
                return;
            }
            for (const op of this.operators) {
                generate(ops.concat(op));
            }
        };
        
        generate();
        return result;
    }

    // 计算表达式并格式化
    evaluateAndFormat(nums, ops) {
        // 情况1: ((a op1 b) op2 c) op3 d
        let res1 = this.calculate(nums[0], nums[1], ops[0]);
        if (res1 !== null) {
            let res2 = this.calculate(res1, nums[2], ops[1]);
            if (res2 !== null) {
                let res3 = this.calculate(res2, nums[3], ops[2]);
                if (res3 === 24) {
                    this.solutions.add(`(((${nums[0]} ${ops[0]} ${nums[1]}) ${ops[1]} ${nums[2]}) ${ops[2]} ${nums[3]})`);
                }
            }
        }

        // 情况2: (a op1 (b op2 c)) op3 d
        let res1_2 = this.calculate(nums[1], nums[2], ops[1]);
        if (res1_2 !== null) {
            let res2_2 = this.calculate(nums[0], res1_2, ops[0]);
            if (res2_2 !== null) {
                let res3_2 = this.calculate(res2_2, nums[3], ops[2]);
                if (res3_2 === 24) {
                    this.solutions.add(`((${nums[0]} ${ops[0]} (${nums[1]} ${ops[1]} ${nums[2]})) ${ops[2]} ${nums[3]})`);
                }
            }
        }

        // 情况3: (a op1 b) op2 (c op3 d)
        let res1_3 = this.calculate(nums[0], nums[1], ops[0]);
        if (res1_3 !== null) {
            let res2_3 = this.calculate(nums[2], nums[3], ops[2]);
            if (res2_3 !== null) {
                let res3_3 = this.calculate(res1_3, res2_3, ops[1]);
                if (res3_3 === 24) {
                    this.solutions.add(`((${nums[0]} ${ops[0]} ${nums[1]}) ${ops[1]} (${nums[2]} ${ops[2]} ${nums[3]}))`);
                }
            }
        }

        // 情况4: a op1 ((b op2 c) op3 d)
        let res1_4 = this.calculate(nums[1], nums[2], ops[1]);
        if (res1_4 !== null) {
            let res2_4 = this.calculate(res1_4, nums[3], ops[2]);
            if (res2_4 !== null) {
                let res3_4 = this.calculate(nums[0], res2_4, ops[0]);
                if (res3_4 === 24) {
                    this.solutions.add(`(${nums[0]} ${ops[0]} ((((${nums[1]} ${ops[1]} ${nums[2]}) ${ops[2]} ${nums[3]})))`);
                }
            }
        }

        // 情况5: a op1 (b op2 (c op3 d))
        let res1_5 = this.calculate(nums[2], nums[3], ops[2]);
        if (res1_5 !== null) {
            let res2_5 = this.calculate(nums[1], res1_5, ops[1]);
            if (res2_5 !== null) {
                let res3_5 = this.calculate(nums[0], res2_5, ops[0]);
                if (res3_5 === 24) {
                    this.solutions.add(`(${nums[0]} ${ops[0]} (${nums[1]} ${ops[1]} (${nums[2]} ${ops[2]} ${nums[3]})))`);
                }
            }
        }
    }

    // 求解算24
    solve(numbers) {
        this.solutions.clear();
        
        const permutations = this.generatePermutations(numbers);
        const operatorsList = this.generateOperators();
        
        for (const nums of permutations) {
            for (const ops of operatorsList) {
                this.evaluateAndFormat(nums, ops);
            }
        }
        
        return Array.from(this.solutions);
    }
}

// 页面交互
class TwentyFourGame {
    constructor() {
        this.solver = new TwentyFourSolver();
        this.currentNumbers = [];
        this.init();
    }

    init() {
        this.generateBtn = document.getElementById('generateBtn');
        this.solutionsList = document.getElementById('solutionsList');
        this.numElements = [
            document.getElementById('num1'),
            document.getElementById('num2'),
            document.getElementById('num3'),
            document.getElementById('num4')
        ];
        
        this.generateBtn.addEventListener('click', () => this.generateNewGame());
        
        // 初始生成一局游戏
        this.generateNewGame();
    }

    generateNewGame() {
        this.currentNumbers = this.solver.generateNumbers();
        this.updateNumbersDisplay();
        this.solveAndDisplay();
    }

    updateNumbersDisplay() {
        for (let i = 0; i < 4; i++) {
            this.numElements[i].textContent = this.currentNumbers[i];
        }
    }

    solveAndDisplay() {
        const solutions = this.solver.solve(this.currentNumbers);
        this.displaySolutions(solutions);
    }

    displaySolutions(solutions) {
        this.solutionsList.innerHTML = '';
        
        if (solutions.length === 0) {
            const noSolution = document.createElement('div');
            noSolution.className = 'solution';
            noSolution.textContent = '无解';
            this.solutionsList.appendChild(noSolution);
            return;
        }
        
        for (const solution of solutions) {
            const solutionElement = document.createElement('div');
            solutionElement.className = 'solution';
            solutionElement.textContent = `${solution} = 24`;
            this.solutionsList.appendChild(solutionElement);
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new TwentyFourGame();
});