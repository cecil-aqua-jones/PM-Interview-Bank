import { Company, Question } from "./types";

export const mockCompanies: Company[] = [
  { id: "google", name: "Google", slug: "google", questionCount: 3 },
  { id: "meta", name: "Meta", slug: "meta", questionCount: 2 },
  { id: "amazon", name: "Amazon", slug: "amazon", questionCount: 2 },
  { id: "apple", name: "Apple", slug: "apple", questionCount: 2 },
  { id: "netflix", name: "Netflix", slug: "netflix", questionCount: 1 },
  { id: "microsoft", name: "Microsoft", slug: "microsoft", questionCount: 2 }
];

export const mockQuestions: Question[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    prompt: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    tags: ["Arrays", "Hash Table"],
    difficultyLabel: "Easy",
    companySlug: "google",
    companyName: "Google",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]"
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]"
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    hints: [
      "A brute force approach would be O(n²). Can you do better?",
      "Think about using a hash map to store values you've seen."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(n)"
    },
    starterCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Your code here
    pass`
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    prompt: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    tags: ["Stack", "String"],
    difficultyLabel: "Easy",
    companySlug: "meta",
    companyName: "Meta",
    examples: [
      {
        input: 's = "()"',
        output: "true"
      },
      {
        input: 's = "()[]{}"',
        output: "true"
      },
      {
        input: 's = "(]"',
        output: "false"
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'"
    ],
    hints: [
      "Use a stack to keep track of opening brackets.",
      "When you see a closing bracket, check if it matches the top of the stack."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(n)"
    },
    starterCode: `def isValid(s: str) -> bool:
    # Your code here
    pass`
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    prompt: `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    tags: ["Arrays", "Sorting"],
    difficultyLabel: "Medium",
    companySlug: "google",
    companyName: "Google",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]."
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Intervals [1,4] and [4,5] are considered overlapping."
      }
    ],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= starti <= endi <= 10^4"
    ],
    hints: [
      "Sort the intervals by their start time first.",
      "Then iterate and merge when the current interval overlaps with the previous one."
    ],
    expectedComplexity: {
      time: "O(n log n)",
      space: "O(n)"
    },
    starterCode: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    # Your code here
    pass`
  },
  {
    id: "lru-cache",
    title: "LRU Cache",
    prompt: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.`,
    tags: ["Hash Table", "Linked List", "Design"],
    difficultyLabel: "Medium",
    companySlug: "amazon",
    companyName: "Amazon",
    examples: [
      {
        input: `["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]`,
        output: "[null, null, null, 1, null, -1, null, -1, 3, 4]",
        explanation: "Cache operations demonstrate LRU eviction policy."
      }
    ],
    constraints: [
      "1 <= capacity <= 3000",
      "0 <= key <= 10^4",
      "0 <= value <= 10^5",
      "At most 2 * 10^5 calls will be made to get and put."
    ],
    hints: [
      "Use a combination of a hash map and a doubly linked list.",
      "The hash map gives O(1) access, the linked list maintains order."
    ],
    expectedComplexity: {
      time: "O(1) for both get and put",
      space: "O(capacity)"
    },
    starterCode: `class LRUCache:
    def __init__(self, capacity: int):
        # Your code here
        pass
    
    def get(self, key: int) -> int:
        # Your code here
        pass
    
    def put(self, key: int, value: int) -> None:
        # Your code here
        pass`
  },
  {
    id: "binary-tree-level-order",
    title: "Binary Tree Level Order Traversal",
    prompt: `Given the root of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).`,
    tags: ["Trees", "BFS", "Queue"],
    difficultyLabel: "Medium",
    companySlug: "meta",
    companyName: "Meta",
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "[[3],[9,20],[15,7]]"
      },
      {
        input: "root = [1]",
        output: "[[1]]"
      },
      {
        input: "root = []",
        output: "[]"
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
      "-1000 <= Node.val <= 1000"
    ],
    hints: [
      "Use BFS with a queue.",
      "Process nodes level by level, tracking the size of each level."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(n)"
    },
    starterCode: `def levelOrder(root: Optional[TreeNode]) -> list[list[int]]:
    # Your code here
    pass`
  },
  {
    id: "word-search",
    title: "Word Search",
    prompt: `Given an m x n grid of characters board and a string word, return true if word exists in the grid.

The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.`,
    tags: ["Backtracking", "Matrix", "DFS"],
    difficultyLabel: "Medium",
    companySlug: "amazon",
    companyName: "Amazon",
    examples: [
      {
        input: `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"`,
        output: "true"
      },
      {
        input: `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"`,
        output: "true"
      },
      {
        input: `board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"`,
        output: "false"
      }
    ],
    constraints: [
      "m == board.length",
      "n = board[i].length",
      "1 <= m, n <= 6",
      "1 <= word.length <= 15",
      "board and word consists of only lowercase and uppercase English letters."
    ],
    hints: [
      "Use DFS with backtracking.",
      "Mark cells as visited during exploration, then unmark when backtracking."
    ],
    expectedComplexity: {
      time: "O(m * n * 4^L) where L is word length",
      space: "O(L) for recursion stack"
    },
    starterCode: `def exist(board: list[list[str]], word: str) -> bool:
    # Your code here
    pass`
  },
  {
    id: "median-two-sorted",
    title: "Median of Two Sorted Arrays",
    prompt: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).`,
    tags: ["Binary Search", "Arrays", "Divide and Conquer"],
    difficultyLabel: "Hard",
    companySlug: "google",
    companyName: "Google",
    examples: [
      {
        input: "nums1 = [1,3], nums2 = [2]",
        output: "2.00000",
        explanation: "merged array = [1,2,3] and median is 2."
      },
      {
        input: "nums1 = [1,2], nums2 = [3,4]",
        output: "2.50000",
        explanation: "merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5."
      }
    ],
    constraints: [
      "nums1.length == m",
      "nums2.length == n",
      "0 <= m <= 1000",
      "0 <= n <= 1000",
      "1 <= m + n <= 2000",
      "-10^6 <= nums1[i], nums2[i] <= 10^6"
    ],
    hints: [
      "Binary search on the smaller array.",
      "Find a partition where left elements are all smaller than right elements."
    ],
    expectedComplexity: {
      time: "O(log(min(m,n)))",
      space: "O(1)"
    },
    starterCode: `def findMedianSortedArrays(nums1: list[int], nums2: list[int]) -> float:
    # Your code here
    pass`
  },
  {
    id: "serialize-deserialize-tree",
    title: "Serialize and Deserialize Binary Tree",
    prompt: `Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.

Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.`,
    tags: ["Trees", "DFS", "BFS", "Design"],
    difficultyLabel: "Hard",
    companySlug: "apple",
    companyName: "Apple",
    examples: [
      {
        input: "root = [1,2,3,null,null,4,5]",
        output: "[1,2,3,null,null,4,5]",
        explanation: "The tree should be serializable and deserializable."
      },
      {
        input: "root = []",
        output: "[]"
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 10^4].",
      "-1000 <= Node.val <= 1000"
    ],
    hints: [
      "Use preorder traversal for serialization.",
      "Use a delimiter to separate values and mark null nodes."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(n)"
    },
    starterCode: `class Codec:
    def serialize(self, root: Optional[TreeNode]) -> str:
        # Your code here
        pass
    
    def deserialize(self, data: str) -> Optional[TreeNode]:
        # Your code here
        pass`
  },
  {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    prompt: `Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    tags: ["Arrays", "Two Pointers", "Dynamic Programming", "Stack"],
    difficultyLabel: "Hard",
    companySlug: "apple",
    companyName: "Apple",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The elevation map can trap 6 units of rain water."
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9"
      }
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5"
    ],
    hints: [
      "For each position, water trapped = min(maxLeft, maxRight) - height[i]",
      "Can be solved with two pointers in O(1) space."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(1) with two pointers"
    },
    starterCode: `def trap(height: list[int]) -> int:
    # Your code here
    pass`
  },
  {
    id: "top-k-frequent",
    title: "Top K Frequent Elements",
    prompt: `Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.`,
    tags: ["Arrays", "Hash Table", "Heap", "Bucket Sort"],
    difficultyLabel: "Medium",
    companySlug: "netflix",
    companyName: "Netflix",
    examples: [
      {
        input: "nums = [1,1,1,2,2,3], k = 2",
        output: "[1,2]"
      },
      {
        input: "nums = [1], k = 1",
        output: "[1]"
      }
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
      "k is in the range [1, the number of unique elements in the array].",
      "It is guaranteed that the answer is unique."
    ],
    hints: [
      "Use a hash map to count frequencies.",
      "Use a min-heap of size k, or bucket sort for O(n) time."
    ],
    expectedComplexity: {
      time: "O(n log k) with heap, O(n) with bucket sort",
      space: "O(n)"
    },
    starterCode: `def topKFrequent(nums: list[int], k: int) -> list[int]:
    # Your code here
    pass`
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    prompt: `Given a string s, find the length of the longest substring without repeating characters.`,
    tags: ["Hash Table", "String", "Sliding Window"],
    difficultyLabel: "Medium",
    companySlug: "microsoft",
    companyName: "Microsoft",
    examples: [
      {
        input: 's = "abcabcbb"',
        output: "3",
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: "1",
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: "3",
        explanation: 'The answer is "wke", with the length of 3.'
      }
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    hints: [
      "Use a sliding window approach.",
      "Use a set or map to track characters in the current window."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(min(m, n)) where m is charset size"
    },
    starterCode: `def lengthOfLongestSubstring(s: str) -> int:
    # Your code here
    pass`
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    prompt: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    tags: ["Linked List", "Recursion"],
    difficultyLabel: "Easy",
    companySlug: "microsoft",
    companyName: "Microsoft",
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]"
      },
      {
        input: "head = [1,2]",
        output: "[2,1]"
      },
      {
        input: "head = []",
        output: "[]"
      }
    ],
    constraints: [
      "The number of nodes in the list is in the range [0, 5000].",
      "-5000 <= Node.val <= 5000"
    ],
    hints: [
      "Use three pointers: prev, current, next.",
      "Can also be done recursively."
    ],
    expectedComplexity: {
      time: "O(n)",
      space: "O(1) iterative, O(n) recursive"
    },
    starterCode: `def reverseList(head: Optional[ListNode]) -> Optional[ListNode]:
    # Your code here
    pass`
  }
];
