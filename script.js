class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
    }

    toggleSign() {
        if (this.currentOperand === '0') return;
        
        if (this.currentOperand.startsWith('-')) {
            this.currentOperand = this.currentOperand.slice(1);
        } else {
            this.currentOperand = '-' + this.currentOperand;
        }
    }

    percent() {
        const currentValue = parseFloat(this.currentOperand);
        if (currentValue === 0) return;
        
        this.currentOperand = String(currentValue / 100);
    }

    appendNumber(number) {
        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }

        // Prevent multiple decimals
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        // Prevent leading zeros (except for decimal numbers)
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
            return;
        }

        // Limit display to 10 digits
        if (this.currentOperand.replace(/[-.]/g, '').length >= 10) return;

        this.currentOperand = this.currentOperand + number;
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = this.currentOperand; // Keep current value visible
        this.shouldResetScreen = true;
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '−':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    this.currentOperand = 'Error';
                    this.previousOperand = '';
                    this.operation = undefined;
                    this.shouldResetScreen = true;
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Round to avoid floating point errors
        computation = Math.round(computation * 100000000) / 100000000;
        
        // Save to history before updating current operand
        const expression = `${this.previousOperand} ${this.operation} ${this.currentOperand}`;
        const result = String(computation);
        addToHistory(expression, result);
        
        this.currentOperand = String(computation);
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = true;
    }

    getDisplayNumber(number) {
        if (number === 'Error') return number;
        
        const stringNumber = String(number);
        const integerDigits = stringNumber.split('.')[0];
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        
        if (isNaN(parseFloat(integerDigits))) {
            integerDisplay = '';
        } else {
            integerDisplay = parseFloat(integerDigits).toLocaleString('en', {
                maximumFractionDigits: 0
            });
        }

        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        // Show previous operand with operation
        if (this.operation != null && this.previousOperand !== '') {
            this.previousOperandElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = '';
        }

        // Show current operand (always show current value)
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);
    }

    // Load from history item
    loadFromHistory(expression, result) {
        this.currentOperand = result;
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = true;
        this.updateDisplay();
    }
}

// History Management
const HISTORY_KEY = 'calculator_history';
let history = [];

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
        history = JSON.parse(saved);
        renderHistory();
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Add item to history
function addToHistory(expression, result) {
    const item = {
        expression: expression,
        result: result,
        timestamp: Date.now()
    };
    
    // Add to beginning of array
    history.unshift(item);
    
    // Limit to 50 items
    if (history.length > 50) {
        history = history.slice(0, 50);
    }
    
    saveHistory();
    renderHistory();
}

// Render history list
function renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">계산 기록이 없습니다</div>';
        return;
    }
    
    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item" data-index="${index}" data-expression="${item.expression}" data-result="${item.result}">
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">= ${formatResult(item.result)}</div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const expression = item.getAttribute('data-expression');
            const result = item.getAttribute('data-result');
            calculator.loadFromHistory(expression, result);
        });
    });
}

// Format result for display
function formatResult(result) {
    const num = parseFloat(result);
    if (isNaN(num)) return result;
    
    // Format with commas
    const parts = result.split('.');
    parts[0] = parseInt(parts[0]).toLocaleString('en');
    return parts.join('.');
}

// Clear history
function clearHistory() {
    history = [];
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
}

// DOM Elements
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');

// Initialize calculator
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// Initialize history
loadHistory();

// Button event handlers
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        const value = button.getAttribute('data-value');
        const action = button.getAttribute('data-action');

        if (value !== null) {
            // Number or decimal button
            calculator.appendNumber(value);
        } else if (action) {
            // Function or operator button
            switch (action) {
                case 'clear':
                    calculator.clear();
                    break;
                case 'toggle-sign':
                    calculator.toggleSign();
                    break;
                case 'percent':
                    calculator.percent();
                    break;
                case 'add':
                    calculator.chooseOperation('+');
                    break;
                case 'subtract':
                    calculator.chooseOperation('−');
                    break;
                case 'multiply':
                    calculator.chooseOperation('×');
                    break;
                case 'divide':
                    calculator.chooseOperation('÷');
                    break;
                case 'equals':
                    calculator.compute();
                    break;
            }
        }

        calculator.updateDisplay();
    });
});

// Clear history button
document.getElementById('clear-history').addEventListener('click', clearHistory);

// Keyboard support
document.addEventListener('keydown', (e) => {
    const key = e.key;

    if (key >= '0' && key <= '9' || key === '.') {
        calculator.appendNumber(key);
    } else if (key === '+') {
        calculator.chooseOperation('+');
    } else if (key === '-') {
        calculator.chooseOperation('−');
    } else if (key === '*') {
        calculator.chooseOperation('×');
    } else if (key === '/') {
        e.preventDefault();
        calculator.chooseOperation('÷');
    } else if (key === 'Enter' || key === '=') {
        calculator.compute();
    } else if (key === 'Escape') {
        calculator.clear();
    } else if (key === 'Backspace') {
        if (calculator.currentOperand.length > 1) {
            calculator.currentOperand = calculator.currentOperand.slice(0, -1);
        } else {
            calculator.currentOperand = '0';
        }
    } else if (key === '%') {
        calculator.percent();
    }

    calculator.updateDisplay();
});
