import { ComplaintCategory } from '../types';

export interface DetectionResult {
  category: ComplaintCategory;
  department: string;
  matchedKeywords: string[];
  confidence: number;
}

export function detectCategory(text: string): [ComplaintCategory, string] {
  const lower = text.toLowerCase();

  if (
    lower.includes('fan') ||
    lower.includes('light') ||
    lower.includes('electric') ||
    lower.includes('switch') ||
    lower.includes('power') ||
    lower.includes('wire')
  ) {
    return ['Electrical', 'Maintenance Department'];
  }

  if (
    lower.includes('water') ||
    lower.includes('tap') ||
    lower.includes('pipe') ||
    lower.includes('leak') ||
    lower.includes('bathroom')
  ) {
    return ['Water & Plumbing', 'Maintenance Department'];
  }

  if (
    lower.includes('wifi') ||
    lower.includes('internet') ||
    lower.includes('network') ||
    lower.includes('router')
  ) {
    return ['Internet & Network', 'IT Department'];
  }

  if (
    lower.includes('hostel') ||
    lower.includes('room') ||
    lower.includes('bed')
  ) {
    return ['Hostel Maintenance', 'Hostel Department'];
  }

  if (
    lower.includes('garbage') ||
    lower.includes('clean') ||
    lower.includes('dirty') ||
    lower.includes('toilet')
  ) {
    return ['Cleaning', 'Administration'];
  }

  if (
    lower.includes('bus') ||
    lower.includes('transport') ||
    lower.includes('driver')
  ) {
    return ['Transport', 'Transport Department'];
  }

  if (
    lower.includes('fee') ||
    lower.includes('fees') ||
    lower.includes('payment') ||
    lower.includes('scholarship')
  ) {
    return ['Fees & Finance', 'Accounts Department'];
  }

  if (
    lower.includes('exam') ||
    lower.includes('mark') ||
    lower.includes('result') ||
    lower.includes('hall ticket')
  ) {
    return ['Examination', 'Exam Cell'];
  }

  if (
    lower.includes('ragging') ||
    lower.includes('harass') ||
    lower.includes('bully') ||
    lower.includes('threat')
  ) {
    return ['Safety', 'Student Affairs'];
  }

  return ['General', 'Administration'];
}

export function analyzeComplaintText(text: string): DetectionResult {
  const lower = text.toLowerCase();
  const matchedKeywords: string[] = [];

  const electricalKeys = ['fan', 'light', 'electric', 'switch', 'power', 'wire'];
  const waterKeys = ['water', 'tap', 'pipe', 'leak', 'bathroom'];
  const netKeys = ['wifi', 'internet', 'network', 'router'];
  const hostelKeys = ['hostel', 'room', 'bed'];
  const cleanKeys = ['garbage', 'clean', 'dirty', 'toilet'];
  const transportKeys = ['bus', 'transport', 'driver'];
  const financeKeys = ['fee', 'fees', 'payment', 'scholarship'];
  const examKeys = ['exam', 'mark', 'result', 'hall ticket'];
  const safetyKeys = ['ragging', 'harass', 'bully', 'threat'];

  const check = (keys: string[]) => keys.filter((k) => lower.includes(k));

  const el = check(electricalKeys);
  if (el.length > 0) {
    return {
      category: 'Electrical',
      department: 'Maintenance Department',
      matchedKeywords: el,
      confidence: Math.min(98, 70 + el.length * 10),
    };
  }

  const wt = check(waterKeys);
  if (wt.length > 0) {
    return {
      category: 'Water & Plumbing',
      department: 'Maintenance Department',
      matchedKeywords: wt,
      confidence: Math.min(98, 70 + wt.length * 10),
    };
  }

  const nt = check(netKeys);
  if (nt.length > 0) {
    return {
      category: 'Internet & Network',
      department: 'IT Department',
      matchedKeywords: nt,
      confidence: Math.min(98, 70 + nt.length * 10),
    };
  }

  const ht = check(hostelKeys);
  if (ht.length > 0) {
    return {
      category: 'Hostel Maintenance',
      department: 'Hostel Department',
      matchedKeywords: ht,
      confidence: Math.min(98, 70 + ht.length * 10),
    };
  }

  const cl = check(cleanKeys);
  if (cl.length > 0) {
    return {
      category: 'Cleaning',
      department: 'Administration',
      matchedKeywords: cl,
      confidence: Math.min(98, 70 + cl.length * 10),
    };
  }

  const tr = check(transportKeys);
  if (tr.length > 0) {
    return {
      category: 'Transport',
      department: 'Transport Department',
      matchedKeywords: tr,
      confidence: Math.min(98, 70 + tr.length * 10),
    };
  }

  const fn = check(financeKeys);
  if (fn.length > 0) {
    return {
      category: 'Fees & Finance',
      department: 'Accounts Department',
      matchedKeywords: fn,
      confidence: Math.min(98, 70 + fn.length * 10),
    };
  }

  const ex = check(examKeys);
  if (ex.length > 0) {
    return {
      category: 'Examination',
      department: 'Exam Cell',
      matchedKeywords: ex,
      confidence: Math.min(98, 70 + ex.length * 10),
    };
  }

  const sf = check(safetyKeys);
  if (sf.length > 0) {
    return {
      category: 'Safety',
      department: 'Student Affairs',
      matchedKeywords: sf,
      confidence: Math.min(98, 70 + sf.length * 10),
    };
  }

  return {
    category: 'General',
    department: 'Administration',
    matchedKeywords: [],
    confidence: text.trim().length > 0 ? 50 : 0,
  };
}

export const CATEGORY_OPTIONS: { label: ComplaintCategory; department: string }[] = [
  { label: 'Electrical', department: 'Maintenance Department' },
  { label: 'Water & Plumbing', department: 'Maintenance Department' },
  { label: 'Internet & Network', department: 'IT Department' },
  { label: 'Hostel Maintenance', department: 'Hostel Department' },
  { label: 'Cleaning', department: 'Administration' },
  { label: 'Transport', department: 'Transport Department' },
  { label: 'Fees & Finance', department: 'Accounts Department' },
  { label: 'Examination', department: 'Exam Cell' },
  { label: 'Safety', department: 'Student Affairs' },
  { label: 'General', department: 'Administration' },
];

export const SAMPLE_PROMPTS = [
  {
    title: 'Hostel Room Fan',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.edu',
    text: 'Hostel room 302 ceiling fan is making loud buzzing noises and sparks when switched on. Please inspect wiring.',
    expected: 'Electrical',
  },
  {
    title: 'Washroom Tap Leak',
    name: 'Priya Sharma',
    email: 'priya.s@student.edu',
    text: 'Water tap leaking continuously in B-block 2nd floor washroom, leading to water wastage and slippery tiles.',
    expected: 'Water & Plumbing',
  },
  {
    title: 'Library Wi-Fi Disconnect',
    name: 'Rohan Mehra',
    email: 'rohan.m@student.edu',
    text: 'The wifi router on the 3rd floor central library is constantly dropping connections during study hours.',
    expected: 'Internet & Network',
  },
  {
    title: 'Exam Hall Ticket Issue',
    name: 'Ananya Roy',
    email: 'ananya.roy@student.edu',
    text: 'My semester exam hall ticket has an incorrect elective course code printed on it. Need urgent correction.',
    expected: 'Examination',
  },
  {
    title: 'Campus Bus Delay',
    name: 'Devansh Verma',
    email: 'd.verma@student.edu',
    text: 'Campus bus route 5 driver did not stop at North Gate bus stop this morning causing students to miss lectures.',
    expected: 'Transport',
  },
];
