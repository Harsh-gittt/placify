const fallbackLinks = {
  leetcode: "",
  geeksforgeeks: "",
  codingninjas: "",
};

const createQuestion = (question, topic, difficulty = "medium", links = {}) => ({
  question,
  topic,
  difficulty,
  links: { ...fallbackLinks, ...links },
});

const DSA_QUESTION_BANK = {
  Infosys: [
    createQuestion("Two Sum Variation with sorted array", "Arrays", "easy", {
      leetcode: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
    }),
    createQuestion("Check if two strings are anagrams", "Strings", "easy", {
      leetcode: "https://leetcode.com/problems/valid-anagram/",
    }),
    createQuestion("Find intersection of two linked lists", "Linked List", "medium", {
      leetcode: "https://leetcode.com/problems/intersection-of-two-linked-lists/",
    }),
    createQuestion("Rotate matrix by 90 degrees", "Matrices", "medium", {
      leetcode: "https://leetcode.com/problems/rotate-image/",
    }),
    createQuestion("Longest common prefix of strings", "Strings", "easy", {
      leetcode: "https://leetcode.com/problems/longest-common-prefix/",
    }),
    createQuestion("Detect cycle in a directed graph", "Graphs", "medium", {
      geeksforgeeks: "https://www.geeksforgeeks.org/detect-cycle-in-a-graph/",
    }),
    createQuestion("Closest pair to a target sum", "Two Pointers", "medium"),
    createQuestion("Implement LRU cache operations", "Design", "hard", {
      leetcode: "https://leetcode.com/problems/lru-cache/",
    }),
    createQuestion("Find k closest elements to X", "Heaps", "medium"),
    createQuestion("Merge overlapping intervals", "Intervals", "medium", {
      leetcode: "https://leetcode.com/problems/merge-intervals/",
    }),
    createQuestion("Minimum number of platforms required", "Greedy", "medium", {
      geeksforgeeks: "https://www.geeksforgeeks.org/minimum-number-platforms-required-railwaybus-station/",
    }),
    createQuestion("Count set bits for all numbers up to N", "Bit Manipulation", "easy"),
  ],
  TCS: [
    createQuestion("FizzBuzz with custom rules", "Implementation", "easy"),
    createQuestion("Find missing number from 1..N", "Arrays", "easy"),
    createQuestion("Validate parentheses string", "Stacks", "easy", {
      leetcode: "https://leetcode.com/problems/valid-parentheses/",
    }),
    createQuestion("Print boundary of binary tree", "Trees", "medium"),
    createQuestion("Check if matrix is Toeplitz", "Matrices", "easy"),
    createQuestion("Find majority element in array", "Arrays", "medium", {
      leetcode: "https://leetcode.com/problems/majority-element/",
    }),
    createQuestion("Maximum profit from single stock trade", "Dynamic Programming", "easy"),
    createQuestion("Generate Pascal's triangle", "Math", "easy"),
    createQuestion("Find first non-repeating character in string", "Strings", "easy"),
    createQuestion("Serialize and deserialize binary tree", "Trees", "hard"),
    createQuestion("Shortest path in unweighted graph (BFS)", "Graphs", "medium"),
    createQuestion("Count number of islands in grid", "Graphs", "medium", {
      leetcode: "https://leetcode.com/problems/number-of-islands/",
    }),
  ],
  Accenture: [
    createQuestion("Given an array, move zeros to the end", "Arrays", "easy"),
    createQuestion("Determine if a linked list is palindrome", "Linked List", "medium"),
    createQuestion("Implement stack using queues", "Queues", "medium"),
    createQuestion("Find kth largest element using heap", "Heaps", "medium", {
      leetcode: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    }),
    createQuestion("Group anagrams together", "Strings", "medium", {
      leetcode: "https://leetcode.com/problems/group-anagrams/",
    }),
    createQuestion("Find diameter of binary tree", "Trees", "medium"),
    createQuestion("Print diagonal traversal of matrix", "Matrices", "easy"),
    createQuestion("Determine if graph is bipartite", "Graphs", "medium"),
    createQuestion("Implement trie insert and search", "Tries", "medium"),
    createQuestion("Longest substring without repeating characters", "Strings", "medium", {
      leetcode: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    }),
    createQuestion("Schedule jobs to maximize profit", "Greedy", "hard"),
    createQuestion("Partition equal subset sum", "Dynamic Programming", "medium"),
  ],
  Wipro: [
    createQuestion("Check if array is monotonic", "Arrays", "easy"),
    createQuestion("Binary search in rotated sorted array", "Binary Search", "medium", {
      leetcode: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    }),
    createQuestion("Reverse nodes in k-group in linked list", "Linked List", "hard"),
    createQuestion("Find minimum window substring", "Sliding Window", "hard"),
    createQuestion("Calculate power using fast exponentiation", "Math", "medium"),
    createQuestion("Find top k frequent words", "Heaps", "medium"),
    createQuestion("Remove duplicates from sorted array in-place", "Arrays", "easy"),
    createQuestion("Spiral order traversal of matrix", "Matrices", "easy"),
    createQuestion("Detect cycle in undirected graph", "Graphs", "medium"),
    createQuestion("Maximum subarray sum (Kadane)", "Dynamic Programming", "easy"),
    createQuestion("Find bridges in an undirected graph", "Graphs", "hard"),
    createQuestion("Implement min stack with O(1) getMin", "Stacks", "medium"),
  ],
  Capgemini: [
    createQuestion("Count pairs with given sum", "Hashing", "easy"),
    createQuestion("Flatten nested linked list", "Linked List", "medium"),
    createQuestion("Reconstruct itinerary using graph", "Graphs", "hard"),
    createQuestion("Find kth smallest element in BST", "Trees", "medium"),
    createQuestion("Set matrix zeroes in-place", "Matrices", "medium"),
    createQuestion("Coin change combinations", "Dynamic Programming", "medium"),
    createQuestion("Generate all subsets of a set", "Backtracking", "medium"),
    createQuestion("Word ladder shortest transformation", "Graphs", "hard"),
    createQuestion("Implement priority queue with heap", "Heaps", "medium"),
    createQuestion("Check if binary tree is height balanced", "Trees", "easy"),
    createQuestion("Minimum steps to reach target by knight", "Graphs", "medium"),
    createQuestion("Find longest palindromic substring", "Strings", "medium"),
  ],
  Cognizant: [
    createQuestion("Check valid sudoku configuration", "Matrices", "medium"),
    createQuestion("Add two numbers represented by linked lists", "Linked List", "medium"),
    createQuestion("Evaluate reverse polish notation", "Stacks", "medium"),
    createQuestion("Find peak element in array", "Binary Search", "medium"),
    createQuestion("Longest increasing subsequence length", "Dynamic Programming", "medium"),
    createQuestion("Minimum spanning tree using Kruskal", "Graphs", "hard"),
    createQuestion("Find maximum width of binary tree", "Trees", "medium"),
    createQuestion("Remove kth node from end of list", "Linked List", "medium"),
    createQuestion("Implement circular queue", "Queues", "easy"),
    createQuestion("Matrix path with maximum sum", "Dynamic Programming", "hard"),
    createQuestion("Rearrange string so no two adjacent same", "Greedy", "medium"),
    createQuestion("Find k closest points to origin", "Heaps", "medium"),
  ],
  HCLTech: [
    createQuestion("Check if number is power of two without loops", "Bit Manipulation", "easy"),
    createQuestion("Merge k sorted linked lists", "Linked List", "hard"),
    createQuestion("Find median of two sorted arrays", "Binary Search", "hard"),
    createQuestion("Maximum product subarray", "Dynamic Programming", "medium"),
    createQuestion("Implement graph using adjacency list", "Graphs", "easy"),
    createQuestion("Detect cycle using Floyd's algorithm", "Linked List", "medium"),
    createQuestion("Build segment tree for range sum", "Segment Trees", "hard"),
    createQuestion("Find kth permutation sequence", "Backtracking", "hard"),
    createQuestion("Check if string is rotation of another", "Strings", "easy"),
    createQuestion("Topological sort of DAG", "Graphs", "medium"),
    createQuestion("Minimum jumps to reach end of array", "Greedy", "medium"),
    createQuestion("LRU cache using doubly linked list", "Design", "hard"),
  ],
  "Tech Mahindra": [
    createQuestion("Reverse words in a sentence in place", "Strings", "easy"),
    createQuestion("Find equilibrium index in array", "Arrays", "medium"),
    createQuestion("Implement DFS iteratively", "Graphs", "easy"),
    createQuestion("Find next greater element for each element", "Stacks", "medium"),
    createQuestion("Construct binary tree from preorder & inorder", "Trees", "hard"),
    createQuestion("Maximum area histogram", "Stacks", "hard"),
    createQuestion("Binary tree level order traversal", "Trees", "easy"),
    createQuestion("Median in a data stream", "Heaps", "hard"),
    createQuestion("Check if graph has Eulerian path", "Graphs", "medium"),
    createQuestion("Generate balanced parentheses combinations", "Backtracking", "medium"),
    createQuestion("Design rate limiter", "Design", "medium"),
    createQuestion("Find minimum spanning tree using Prim", "Graphs", "medium"),
  ],
  IBM: [
    createQuestion("Count palindromic substrings", "Strings", "medium"),
    createQuestion("Serialize binary tree using preorder", "Trees", "medium"),
    createQuestion("Implement Dijkstra algorithm", "Graphs", "hard"),
    createQuestion("Check if two trees are isomorphic", "Trees", "hard"),
    createQuestion("Find median of running integers", "Heaps", "hard"),
    createQuestion("Binary indexed tree for range query", "Fenwick Tree", "hard"),
    createQuestion("Check if string is valid shuffle of two strings", "Strings", "medium"),
    createQuestion("Maximum length of pair chain", "Dynamic Programming", "medium"),
    createQuestion("Snake and ladder minimum dice throws", "Graphs", "medium"),
    createQuestion("Calculate determinant of matrix", "Math", "hard"),
    createQuestion("Implement Bloom filter basics", "Design", "hard"),
    createQuestion("Count inversions in array", "Divide and Conquer", "medium"),
  ],
  Microsoft: [
    createQuestion("LRU cache with get/put O(1)", "Design", "medium"),
    createQuestion("Word break problem", "Dynamic Programming", "medium"),
    createQuestion("Find critical connections (bridges)", "Graphs", "hard"),
    createQuestion("Design Twitter feed", "Design", "hard"),
    createQuestion("Repeated substring pattern detection", "Strings", "easy"),
    createQuestion("Serialize nested dictionary to string", "Design", "hard"),
    createQuestion("Binary tree right side view", "Trees", "medium"),
    createQuestion("Find kth smallest pair distance", "Binary Search", "hard"),
    createQuestion("Shortest path visiting all nodes", "Graphs", "hard"),
    createQuestion("Remove invalid parentheses", "Backtracking", "hard"),
    createQuestion("Paint house with minimum cost", "Dynamic Programming", "medium"),
    createQuestion("Find subarray with product less than K", "Sliding Window", "medium"),
  ],
};

export function getFallbackDSAQuestions(company) {
  const normalizedCompany = company || "";
  const data = DSA_QUESTION_BANK[normalizedCompany] || [];
  return data.map((item) => ({
    question: String(item.question || "").trim(),
    topic: String(item.topic || "General").trim() || "General",
    difficulty: ["easy", "medium", "hard"].includes(
      String(item.difficulty || "").toLowerCase()
    )
      ? String(item.difficulty || "").toLowerCase()
      : "medium",
    links: item.links || { ...fallbackLinks },
  }));
}

export const DSA_COMPANY_LIST = Object.keys(DSA_QUESTION_BANK);

export default DSA_QUESTION_BANK;


