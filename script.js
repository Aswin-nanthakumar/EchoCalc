 const resultBox = document.getElementById("result");
    const historyContainer = document.getElementById("history");
    let calculationHistory = [];
  
    function toggleTheme() {
      document.body.classList.toggle('dark-mode');
    }
  
    function addToHistory(expression, result) {
      calculationHistory.unshift({ expression, result });
      if (calculationHistory.length > 10) calculationHistory.pop();
      updateHistoryDisplay();
    }
  
    function updateHistoryDisplay() {
      historyContainer.innerHTML = calculationHistory.map(item => 
        `<div class="history-item">${item.expression} = ${item.result}</div>`
      ).join('');
    }
  
    function startListening() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        resultBox.innerHTML = "Speech Recognition not supported in this browser.";
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.start();
      resultBox.innerHTML = "I'm Here to Listen You....";
      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        resultBox.innerHTML = "What You said: " + transcript;
        calculateFromVoice(transcript, true);
      };
      recognition.onerror = function (event) {
        resultBox.innerHTML = " Error: " + event.error;
      };
    }
  
    function calculateFromVoice(text, fromVoice = false) {
      if (!fromVoice) resultBox.innerHTML = "";
  
      text = text.toLowerCase().trim();
  
      // Scientific notation
      if (text.includes("e") || text.includes("×10^")) {
        text = text.replace(/×10\^/g, "e").replace(/\s+/g, "");
      }
  
      // Factorial vaklues:
      if (text.includes("factorial")) {
        const match = text.match(/(\d+)\s*factorial/);
        if (!match) return resultBox.innerHTML += "<br> Could not parse number for factorial.";
        const num = parseFloat(match[1]);
        if (num < 0) return resultBox.innerHTML += "<br> Factorial of negative number is not defined.";
        if (!Number.isInteger(num)) return resultBox.innerHTML += "<br> Factorial is only defined for integers.";
        const result = calculateFactorial(num);
        addToHistory(`${num} factorial`, result);
        return showResult(result);
      }
  
      // Modulus values:
      if (text.includes("modulo") || text.includes("mod")) {
        const parts = text.split(/\s*(?:modulo|modulus|mod)\s*/);
        const num1 = parseFloat(parts[0]);
        const num2 = parseFloat(parts[1]);
        if (num2 === 0) return resultBox.innerHTML += "<br> Modulo by zero is not allowed.";
        const result = num1 % num2;
        addToHistory(`${num1} % ${num2}`, result);
        return showResult(result);
      }
  
      // Replace words with numbers/operators
      text = text.replace(/\bpoint\b/g, ".")
        .replace(/\bzero\b/g, "0").replace(/\bone\b/g, "1")
        .replace(/\btwo\b/g, "2").replace(/\bthree\b/g, "3")
        .replace(/\bfour\b/g, "4").replace(/\bfive\b/g, "5")
        .replace(/\bsix\b/g, "6").replace(/\bseven\b/g, "7")
        .replace(/\beight\b/g, "8").replace(/\bnine\b/g, "9");
  
      text = text
        .replace(/\bplus\b/g, " + ")
        .replace(/\bminus\b/g, " - ")
        .replace(/\btimes\b|\bmultiplied by\b|\binto\b/g, " * ")
        .replace(/\bdivided by\b|\bby\b/g, " / ")
        .replace(/\bpower of\b|\bto the power of\b/g, " ^ ")
        .replace(/\bsqrt\b|\bsquare root of\b/g, " sqrt ")
        .replace(/\blog\b/g, " log ")
        .replace(/\bln\b/g, " ln ");
  
      // Large number upto trillions
      const scales = {
        "trillion": 1e12,
        "billion": 1e9,
        "million": 1e6,
        "lakh": 1e5,
        "thousand": 1e3
      };
      for (const [word, multiplier] of Object.entries(scales)) {
        text = text.replace(new RegExp(`(\\d+(\\.\\d+)?)\\s*${word}`, "gi"), (_, num) => parseFloat(num) * multiplier);
      }
  
      // Square root
      if (/sqrt\s*\d+/.test(text)) {
        const number = parseFloat(text.match(/sqrt\s*(\d+(\.\d+)?)/)[1]);
        if (number < 0) return resultBox.innerHTML += "<br> Square root of negative number is not defined.";
        const result = Math.sqrt(number);
        addToHistory(`sqrt(${number})`, result);
        return showResult(result);
      }
    
      // Power of values:
const powerPattern = /(\d+(?:\.\d+)?)\s*(?:\^|\*\*|\bpower of\b|\bto the power of\b)\s*(\d+(?:\.\d+)?)/i;
if (powerPattern.test(text)) {
  const matches = text.match(powerPattern);
  const base = parseFloat(matches[1]);
  const exponent = parseFloat(matches[2]);
  
  // Handle special cases
  if (base === 0 && exponent === 0) {
    return resultBox.innerHTML += "<br> 0 to the power of 0 is undefined.";
  }
  if (base < 0 && !Number.isInteger(exponent)) {
    return resultBox.innerHTML += "<br> Negative base with non-integer exponent is not defined.";
  }
  
  const result = Math.pow(base, exponent);
  addToHistory(`${base} ^ ${exponent}`, result);
  return showResult(result);
}



      // Percentage 
      const percentMatch = text.match(/(\d+(\.\d+)?)\s*(percent of|to the percentage  of|%)\s*(of)?\s*(\d+(\.\d+)?)/);
      if (percentMatch) {
        const percentValue = parseFloat(percentMatch[1]);
        const baseValue = parseFloat(percentMatch[5]);
        const result = (percentValue / 100) * baseValue;
        addToHistory(`${percentValue}% of ${baseValue}`, result.toFixed(4));
        return showResult(result.toFixed(4));
      }
      text = text.replace(/\bpercent of|to the percentage of\b/g, "%");
  
      // Logarithm expressions
      const logOperationPattern = /log\s*(?:of\s*)?(\d+(\.\d+)?)(?:\s*)?([\+\-\*\/])(?:\s*)?log\s*(?:of\s*)?(\d+(\.\d+)?)/i;
      if (logOperationPattern.test(text)) {
        const matches = text.match(logOperationPattern);
        const num1 = parseFloat(matches[1]);
        const operator = matches[3];
        const num2 = parseFloat(matches[4]);

        if (num1 <= 0 || num2 <= 0) {
          return resultBox.innerHTML += "<br> Logarithms must have positive arguments.";
        }

        const log1 = Math.log10(num1);
        const log2 = Math.log10(num2);
        let result;

        switch (operator) {
          case '+': result = log1 + log2; break;
          case '-': result = log1 - log2; break;
          case '*': result = log1 * log2; break;
          case '/': result = log1 / log2; break;
          default: return resultBox.innerHTML += "<br> Unsupported log operation.";
        }

        addToHistory(`log(${num1}) ${operator} log(${num2})`, result.toFixed(4));
        return showResult(result.toFixed(4));
      }

      // Handle individual log calculations
      const singleLogPattern = /log\s*(?:of\s*)?(\d+(\.\d+)?)/i;
      if (singleLogPattern.test(text)) {
        const matches = text.match(singleLogPattern);
        const number = parseFloat(matches[1]);
        
        if (number <= 0) {
          return resultBox.innerHTML += "<br> Logarithm input must be positive.";
        }
        
        const result = Math.log10(number).toFixed(4);
        addToHistory(`log(${number})`, result);
        return showResult(result);
      }

      // Handle natural log
      const lnPattern = /ln\s*(?:of\s*)?(\d+(\.\d+)?)/i;
      if (lnPattern.test(text)) {
        const matches = text.match(lnPattern);
        const number = parseFloat(matches[1]);
        
        if (number <= 0) {
          return resultBox.innerHTML += "<br> Natural logarithm input must be positive.";
        }
        
        const result = Math.log(number).toFixed(4);
        addToHistory(`ln(${number})`, result);
        return showResult(result);
      }

      // Remove log-related text to prevent double processing
      text = text.replace(/log\s*(?:of\s*)?\d+(\.\d+)?/gi, '')
                 .replace(/ln\s*(?:of\s*)?\d+(\.\d+)?/gi, '')
                 .replace(/\blogarithm\b/g, '')
                 .replace(/\blog base 10 of\b/g, '');

      try {
        let cleanText = text.replace(/[^0-9+\-*/.^()]/g, '').replace(/\^/g, '**');
        cleanText = cleanText.replace(/([+\-*/])/g, ' $1 ');
        const result = eval(cleanText);
        if (!isNaN(result)) {
          if (Math.abs(result - Math.round(result)) < 1e-10) {
            addToHistory(cleanText, Math.round(result));
            showResult(Math.round(result));
          } else {
            const formattedResult = Number(result.toFixed(4));
            addToHistory(cleanText, formattedResult);
            showResult(formattedResult);
          }
        } else {
          resultBox.innerHTML += "<br> Invalid calculation.";
        }
      } catch (err) {
        resultBox.innerHTML += "<br> Invalid expression.";
      }
    }
  
    function calculateFactorial(n) {
      if (n === 0 || n === 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }
      return result;
    }
  
    function showResult(result) {
      const formatted = formatNumber(result);
      resultBox.innerHTML += `<br> Result: <strong>${formatted}</strong>`;
      speakAnswer(result);
    }
  
    function formatNumber(num) {
      if (Number.isInteger(num)) {
        return num.toLocaleString("en-IN");
      }
      return Number(num).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
      });
    }
  
    function speakAnswer(answer) {
      const speech = new SpeechSynthesisUtterance(`The result is ${answer}`);
      window.speechSynthesis.speak(speech);
    }
  
    function clearInput() {
      document.getElementById("manualInput").value = "";
      resultBox.innerHTML = "Ask EchoCalc a Math Question";
    }