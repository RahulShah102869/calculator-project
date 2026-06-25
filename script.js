(function () {
    'use strict';

    // DOM elements
    const resultDisplay = document.getElementById('result');
    const expressionDisplay = document.getElementById('expression');

    // state
    let currentInput = '0';         // what's shown on screen (result area)
    let expression = '';           // expression string (shown small)
    let operator = null;           // pending operator
    let previousValue = null;      // previous operand
    let shouldResetInput = false;  // flag to reset input after operator or equal
    let justEvaluated = false;     // flag to handle chaining

    // Helper: update display
    function updateDisplay() {
        // format the current input (limit length for big numbers)
        let displayValue = currentInput;
        if (displayValue.length > 14) {
            // if it's a decimal number, try to keep it readable
            if (displayValue.includes('.')) {
                const parts = displayValue.split('.');
                if (parts[0].length > 10) {
                    displayValue = parseFloat(displayValue).toExponential(6);
                } else {
                    displayValue = displayValue.slice(0, 14);
                }
            } else {
                displayValue = parseFloat(displayValue).toExponential(6);
            }
        }
        resultDisplay.textContent = displayValue;
        // shrink font if too long
        if (displayValue.length > 12) {
            resultDisplay.classList.add('shrink');
        } else {
            resultDisplay.classList.remove('shrink');
        }
        // expression display
        expressionDisplay.textContent = expression;
    }

    // reset calculator to initial state
    function resetCalculator() {
        currentInput = '0';
        expression = '';
        operator = null;
        previousValue = null;
        shouldResetInput = false;
        justEvaluated = false;
        updateDisplay();
    }

    // handle number input (0-9, .)
    function inputDigit(digit) {
        if (justEvaluated) {
            // start fresh after evaluation
            resetCalculator();
            // then set the digit
            if (digit === '.') {
                currentInput = '0.';
            } else {
                currentInput = digit;
            }
            updateDisplay();
            justEvaluated = false;
            return;
        }

        if (shouldResetInput) {
            currentInput = '0';
            shouldResetInput = false;
        }

        if (digit === '.') {
            // if already has a decimal point, ignore
            if (currentInput.includes('.')) return;
            currentInput += '.';
        } else {
            // prevent leading zeros (allow "0.x" but not "00")
            if (currentInput === '0' && digit !== '.') {
                currentInput = digit;
            } else {
                // limit length
                if (currentInput.replace('-', '').replace('.', '').length >= 15) return;
                currentInput += digit;
            }
        }
        updateDisplay();
    }

    // handle operator (+, -, *, /)
    function handleOperator(op) {
        const currentNumber = parseFloat(currentInput);

        if (operator && !shouldResetInput) {
            // chain calculation: evaluate previous before setting new operator
            const result = evaluate(previousValue, currentNumber, operator);
            if (result === 'Error') {
                resetCalculator();
                resultDisplay.textContent = 'Error';
                expression = '';
                return;
            }
            currentInput = String(result);
            previousValue = result;
            // update expression to show chaining
            expression = `${result} ${op} `;
            updateDisplay();
            operator = op;
            shouldResetInput = true;
            justEvaluated = false;
            return;
        }

        // first operator or after reset
        if (previousValue === null || shouldResetInput) {
            previousValue = currentNumber;
            operator = op;
            expression = `${currentInput} ${op} `;
            shouldResetInput = true;
            justEvaluated = false;
            updateDisplay();
            return;
        }

        // fallback
        previousValue = currentNumber;
        operator = op;
        expression = `${currentInput} ${op} `;
        shouldResetInput = true;
        justEvaluated = false;
        updateDisplay();
    }

    // evaluation helper
    function evaluate(a, b, op) {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (isNaN(numA) || isNaN(numB)) return 'Error';

        let result;
        switch (op) {
            case '+': result = numA + numB; break;
            case '-': result = numA - numB; break;
            case '*': result = numA * numB; break;
            case '/':
                if (numB === 0) return 'Error';
                result = numA / numB;
                break;
            default: return 'Error';
        }

        // round to avoid floating point noise, but keep precision
        if (Number.isFinite(result)) {
            // if result is very long, keep it as number
            if (Number.isInteger(result) && Math.abs(result) < 1e15) {
                return result;
            } else {
                // limit decimal places to 12
                return parseFloat(result.toPrecision(12));
            }
        }
        return 'Error';
    }

    // equals / evaluate
    function handleEquals() {
        if (operator === null || previousValue === null) {
            // if there's no operator, do nothing, but show expression as current
            expression = `${currentInput} =`;
            updateDisplay();
            justEvaluated = true;
            return;
        }

        const currentNumber = parseFloat(currentInput);
        const result = evaluate(previousValue, currentNumber, operator);

        if (result === 'Error') {
            resetCalculator();
            resultDisplay.textContent = 'Error';
            expression = '';
            return;
        }

        // build expression for display
        expression = `${previousValue} ${operator} ${currentInput} =`;
        currentInput = String(result);
        updateDisplay();

        // reset state after evaluation
        operator = null;
        previousValue = null;
        shouldResetInput = true;
        justEvaluated = true;
    }

    // percent: divide current by 100
    function handlePercent() {
        const num = parseFloat(currentInput);
        if (isNaN(num)) return;
        currentInput = String(num / 100);
        // if we have an operator, we treat as part of expression
        if (operator && previousValue !== null) {
            // just update current, keep expression as is?
            // better to update expression to reflect percent?
            // we keep it simple: only modify current
        }
        updateDisplay();
    }

    // backspace
    function handleBackspace() {
        if (justEvaluated) {
            resetCalculator();
            return;
        }
        if (shouldResetInput) {
            currentInput = '0';
            shouldResetInput = false;
            updateDisplay();
            return;
        }
        if (currentInput.length > 1) {
            currentInput = currentInput.slice(0, -1);
        } else {
            currentInput = '0';
        }
        updateDisplay();
    }

    // clear entry (AC)
    function handleClear() {
        resetCalculator();
    }

    // keyboard support
    function handleKeyboard(e) {
        const key = e.key;
        if (key >= '0' && key <= '9') {
            e.preventDefault();
            inputDigit(key);
        } else if (key === '.') {
            e.preventDefault();
            inputDigit('.');
        } else if (key === '+') {
            e.preventDefault();
            handleOperator('+');
        } else if (key === '-') {
            e.preventDefault();
            handleOperator('-');
        } else if (key === '*') {
            e.preventDefault();
            handleOperator('*');
        } else if (key === '/') {
            e.preventDefault();
            handleOperator('/');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            handleEquals();
        } else if (key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
        } else if (key === 'Escape') {
            e.preventDefault();
            handleClear();
        } else if (key === '%') {
            e.preventDefault();
            handlePercent();
        }
    }

    // event delegation for buttons
    document.querySelector('.button-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        const value = btn.getAttribute('data-value');

        // avoid conflicts with icons inside
        if (value === null) return;

        switch (value) {
            case 'clear': handleClear(); break;
            case 'backspace': handleBackspace(); break;
            case '%': handlePercent(); break;
            case '/': handleOperator('/'); break;
            case '*': handleOperator('*'); break;
            case '-': handleOperator('-'); break;
            case '+': handleOperator('+'); break;
            case '=': handleEquals(); break;
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
                inputDigit(value);
                break;
            default: break;
        }
    });

    // keyboard listeners
    document.addEventListener('keydown', handleKeyboard);

    // initialize display
    resetCalculator();

    // extra: Prevent zoom on double tap (mobile)
    document.addEventListener('touchend', (e) => {
        if (e.target.closest('.btn')) {
            e.preventDefault();
            // but we keep the click event
        }
    }, { passive: false });

})();
