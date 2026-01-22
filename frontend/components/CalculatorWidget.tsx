import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface CalculatorInput {
  label: string;
  varName: string;
  type: 'number';
  defaultValue: number;
}

export interface CalculatorConfig {
  inputs: CalculatorInput[];
  formula: string;
  resultLabel: string;
}

interface Props {
  config: CalculatorConfig;
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'lparen' }
  | { type: 'rparen' };

const MAX_FORMULA_LENGTH = 500;

function tokenizeExpression(expr: string, allowedIdentifiers: Set<string>): Token[] {
  if (expr.length > MAX_FORMULA_LENGTH) {
    throw new Error('Formula too long');
  }

  const tokens: Token[] = [];
  let i = 0;

  const isWhitespace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isIdentStart = (c: string) => (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_';
  const isIdentPart = (c: string) => isIdentStart(c) || isDigit(c);

  while (i < expr.length) {
    const c = expr[i];

    if (isWhitespace(c)) {
      i += 1;
      continue;
    }

    if (c === '(') {
      tokens.push({ type: 'lparen' });
      i += 1;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'rparen' });
      i += 1;
      continue;
    }

    if (c === '+' || c === '-' || c === '*' || c === '/' || c === '^') {
      tokens.push({ type: 'op', value: c });
      i += 1;
      continue;
    }

    // number: 12, 12.34, .5
    if (isDigit(c) || c === '.') {
      let start = i;
      let sawDot = c === '.';
      i += 1;
      while (i < expr.length) {
        const cc = expr[i];
        if (isDigit(cc)) {
          i += 1;
          continue;
        }
        if (cc === '.' && !sawDot) {
          sawDot = true;
          i += 1;
          continue;
        }
        break;
      }
      const raw = expr.slice(start, i);
      // Reject '.' alone
      if (raw === '.') throw new Error('Invalid number');
      const num = Number(raw);
      if (!Number.isFinite(num)) throw new Error('Invalid number');
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // identifier (variable name)
    if (isIdentStart(c)) {
      const start = i;
      i += 1;
      while (i < expr.length && isIdentPart(expr[i])) i += 1;
      const ident = expr.slice(start, i);
      if (!allowedIdentifiers.has(ident)) {
        throw new Error(`Unknown variable: ${ident}`);
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }

    // Any other character is disallowed.
    throw new Error(`Invalid character: ${c}`);
  }

  return tokens;
}

function precedence(op: Token & { type: 'op' }): number {
  switch (op.value) {
    case '^':
      return 4;
    case '*':
    case '/':
      return 3;
    case '+':
    case '-':
      return 2;
  }
}

function isRightAssociative(op: Token & { type: 'op' }): boolean {
  return op.value === '^';
}

function toRpn(tokens: Token[]): Token[] {
  const out: Token[] = [];
  const stack: Token[] = [];

  // Handle unary +/- by rewriting to (0 +/- x)
  let prev: Token | null = null;

  for (const t of tokens) {
    if (t.type === 'number' || t.type === 'ident') {
      out.push(t);
      prev = t;
      continue;
    }

    if (t.type === 'op') {
      const isUnary =
        (t.value === '+' || t.value === '-') &&
        (prev === null || prev.type === 'op' || prev.type === 'lparen');

      if (isUnary) {
        out.push({ type: 'number', value: 0 });
      }

      while (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type !== 'op') break;
        const pTop = precedence(top);
        const pThis = precedence(t);
        const shouldPop = isRightAssociative(t) ? pThis < pTop : pThis <= pTop;
        if (!shouldPop) break;
        out.push(stack.pop() as Token);
      }

      stack.push(t);
      prev = t;
      continue;
    }

    if (t.type === 'lparen') {
      stack.push(t);
      prev = t;
      continue;
    }

    if (t.type === 'rparen') {
      let found = false;
      while (stack.length > 0) {
        const top = stack.pop() as Token;
        if (top.type === 'lparen') {
          found = true;
          break;
        }
        out.push(top);
      }
      if (!found) throw new Error('Mismatched parentheses');
      prev = t;
      continue;
    }
  }

  while (stack.length > 0) {
    const top = stack.pop() as Token;
    if (top.type === 'lparen' || top.type === 'rparen') throw new Error('Mismatched parentheses');
    out.push(top);
  }

  return out;
}

function evalRpn(rpn: Token[], vars: Record<string, number>): number {
  const stack: number[] = [];
  for (const t of rpn) {
    if (t.type === 'number') {
      stack.push(t.value);
      continue;
    }
    if (t.type === 'ident') {
      const v = vars[t.value];
      if (!Number.isFinite(v)) throw new Error(`Invalid value for ${t.value}`);
      stack.push(v);
      continue;
    }
    if (t.type === 'op') {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error('Invalid expression');
      let res: number;
      switch (t.value) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          res = a / b;
          break;
        case '^':
          res = Math.pow(a, b);
          break;
      }
      if (!Number.isFinite(res)) throw new Error('Non-finite result');
      stack.push(res);
      continue;
    }
    throw new Error('Invalid expression');
  }

  if (stack.length !== 1) throw new Error('Invalid expression');
  return stack[0];
}

const CalculatorWidget: React.FC<Props> = ({ config }) => {
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    // Initialize default values
    const defaults: Record<string, number> = {};
    config.inputs.forEach(input => {
      defaults[input.varName] = input.defaultValue || 0;
    });
    setValues(defaults);
  }, [config]);

  useEffect(() => {
    // Calculate whenever values change
    try {
      if (Object.keys(values).length === 0) return;

      // SECURITY: safe expression evaluation (no eval/new Function)
      const allowedVars = new Set(config.inputs.map(i => i.varName));
      const tokens = tokenizeExpression(config.formula, allowedVars);
      const rpn = toRpn(tokens);
      const res = evalRpn(rpn, values);

      setResult(Number(res.toFixed(2))); // Round to 2 decimals
    } catch (err) {
      console.warn("Calculation error", err);
      
    }
  }, [values, config.formula]);

  const handleChange = (varName: string, val: string) => {
    setValues(prev => ({
      ...prev,
      [varName]: parseFloat(val) || 0
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-md mx-auto my-6">
      <div className="flex items-center gap-2 mb-6 text-blue-600">
        <Calculator size={24} />
        <h3 className="text-xl font-bold text-gray-900">Interactive Calculator</h3>
      </div>

      <div className="space-y-4">
        {config.inputs.map((input) => (
          <div key={input.varName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{input.label}</label>
            <input 
              type="number"
              value={values[input.varName] ?? ''}
              onChange={(e) => handleChange(input.varName, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 bg-gray-50 rounded-lg p-4 text-center">
         <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-semibold">{config.resultLabel}</p>
         <div className="text-4xl font-extrabold text-blue-600">
            {result !== null ? result.toLocaleString() : '-'}
         </div>
      </div>
    </div>
  );
};

export default CalculatorWidget;
