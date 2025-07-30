import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question, { IQuestion } from '../models/Question';

dotenv.config();

const SAMPLE_QUESTIONS: Omit<IQuestion, keyof mongoose.Document>[] = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'Easy',
    topic: 'Arrays',
    hints: ['Use a hash map', 'Single pass through the array'],
    solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
}`,
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' }
    ]
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string containing just the characters ()[]{}, determine if the input string is valid.',
    difficulty: 'Easy',
    topic: 'Stacks',
    hints: ['Use a stack', 'Pop when you see a closing bracket'],
    solution: `function isValid(s) {
  const stack = [];
  const map = { '(': ')', '{': '}', '[': ']' };
  for (const ch of s) {
    if (map[ch]) stack.push(map[ch]);
    else if (stack.pop() !== ch) return false;
  }
  return stack.length === 0;
}`,
    testCases: [
      { input: '"()[]{}"', expectedOutput: 'true' },
      { input: '"(]"', expectedOutput: 'false' }
    ]
  },
  {
    title: 'Merge Two Sorted Lists',
    description: 'Merge two sorted linked lists and return it as a new sorted list.',
    difficulty: 'Easy',
    topic: 'Linked Lists',
    hints: ['Iterative pointer technique', 'Dummy head node'],
    solution: `function merge(l1, l2) {
  const dummy = new ListNode();
  let cur = dummy;
  while (l1 && l2) {
    if (l1.val < l2.val) { cur.next = l1; l1 = l1.next; }
    else { cur.next = l2; l2 = l2.next; }
    cur = cur.next;
  }
  cur.next = l1 || l2;
  return dummy.next;
}`,
    testCases: [
      { input: 'l1 = [1,2,4], l2 = [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'Medium',
    topic: 'Strings',
    hints: ['Sliding window', 'Hash map of last seen indices'],
    solution: `function lengthOfLongestSubstring(s) {
  const map = {};
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (map[ch] >= left) left = map[ch] + 1;
    map[ch] = right;
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3' }
    ]
  },
  {
    title: 'Lowest Common Ancestor of a BST',
    description: 'Given a binary search tree, find the lowest common ancestor (LCA) of two given nodes in the BST.',
    difficulty: 'Medium',
    topic: 'Trees',
    hints: ['BST property', 'Iterative or recursive'],
    solution: `function lowestCommonAncestor(root, p, q) {
  while (root) {
    if (p.val < root.val && q.val < root.val) root = root.left;
    else if (p.val > root.val && q.val > root.val) root = root.right;
    else return root;
  }
}`,
    testCases: [
      { input: 'root = [6,2,8,0,4,7,9,3,5], p = 2, q = 8', expectedOutput: '6' }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected');

    const existing = await Question.countDocuments();
    if (existing > 0) {
      console.log('Questions already exist, skipping seeding.');
      process.exit(0);
    }

    await Question.insertMany(SAMPLE_QUESTIONS);
    console.log('Sample questions inserted');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
