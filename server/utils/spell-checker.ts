/**
 * Simple spell checker using Levenshtein distance to find closest matching words
 */

// Common English words dictionary (most frequently used words)
const DICTIONARY = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having', 'may', 'should', 'could', 'would',
  'very', 'much', 'more', 'such', 'many', 'too', 'each', 'both', 'few', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'once', 'here', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very',
  'can', 'will', 'must', 'shall', 'might', 'ought',
  'am', 'is', 'are', 'was', 'were', 'being', 'been', 'be',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'yes', 'no', 'not', 'never', 'always', 'often', 'sometimes', 'usually',
  'hello', 'hi', 'hey', 'bye', 'goodbye', 'thanks', 'thank', 'please', 'sorry', 'welcome',
  'man', 'woman', 'child', 'boy', 'girl', 'person', 'people', 'family', 'friend', 'friends',
  'love', 'like', 'hate', 'want', 'need', 'feel', 'think', 'know', 'believe',
  'happy', 'sad', 'angry', 'excited', 'scared', 'worried', 'great', 'good', 'bad', 'best', 'worst',
  'big', 'small', 'large', 'little', 'long', 'short', 'high', 'low', 'wide', 'narrow',
  'hot', 'cold', 'warm', 'cool', 'wet', 'dry',
  'fast', 'slow', 'quick', 'easy', 'hard', 'difficult', 'simple',
  'home', 'house', 'room', 'door', 'window', 'floor', 'wall', 'roof',
  'car', 'bike', 'bus', 'train', 'plane', 'boat', 'ship',
  'food', 'eat', 'drink', 'water', 'coffee', 'tea', 'bread', 'meat', 'fruit', 'vegetable',
  'money', 'work', 'job', 'business', 'company', 'office',
  'school', 'teacher', 'student', 'learn', 'study', 'read', 'write', 'book',
  'phone', 'computer', 'internet', 'email', 'message', 'call', 'text',
  'game', 'play', 'watch', 'movie', 'music', 'song', 'video',
  'today', 'tomorrow', 'yesterday', 'now', 'later', 'soon', 'never', 'always',
  'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year',
  'place', 'city', 'town', 'country', 'world', 'street', 'road',
  'thing', 'something', 'anything', 'nothing', 'everything',
  'right', 'left', 'up', 'down', 'front', 'back', 'side', 'top', 'bottom',
  'start', 'stop', 'begin', 'end', 'finish', 'continue',
  'open', 'close', 'shut', 'turn', 'move', 'stay', 'go', 'come',
  'give', 'take', 'bring', 'send', 'receive', 'buy', 'sell', 'pay',
  'speak', 'talk', 'tell', 'ask', 'answer', 'call', 'shout', 'whisper',
  'show', 'see', 'look', 'watch', 'find', 'lose', 'search',
  'try', 'help', 'let', 'keep', 'hold', 'catch', 'throw',
  'understand', 'remember', 'forget', 'mean', 'explain',
  'best', 'friend', 'gave', 'this', 'you', 'imagine', 'if', 'your', 'video', 'press', 'for', 'displaying', 'favorite', 'memories', 'digital', 'photo', 'frame'
])

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * Find the closest matching word in dictionary
 */
function findClosestWord(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // If word is in dictionary, return as is
  if (DICTIONARY.has(lowerWord)) {
    return word
  }
  
  // Find closest match
  let minDistance = Infinity
  let closestWord: string | null = null
  
  for (const dictWord of DICTIONARY) {
    const distance = levenshteinDistance(lowerWord, dictWord)
    
    // Only consider if distance is within reasonable range
    // Allow up to 2 character differences for words longer than 3 characters
    const maxDistance = word.length > 3 ? 2 : 1
    
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance
      closestWord = dictWord
    }
  }
  
  // If we found a close match, preserve original casing pattern
  if (closestWord) {
    // Check if original was capitalized
    if (word[0] === word[0].toUpperCase()) {
      return closestWord[0].toUpperCase() + closestWord.slice(1)
    }
    return closestWord
  }
  
  return null
}

/**
 * Correct text using spell checking
 */
export function correctText(text: string): string {
  // Split into words
  const words = text.split(/\s+/)
  
  // Correct each word
  const correctedWords = words.map(word => {
    // Extract just the alphabetic part (remove punctuation)
    const cleanWord = word.replace(/[^a-zA-Z]/g, '')
    
    if (cleanWord.length === 0) {
      return word
    }
    
    // Try to find correction
    const correction = findClosestWord(cleanWord)
    
    if (correction) {
      // Replace the alphabetic part but keep punctuation
      return word.replace(/[a-zA-Z]+/, correction)
    }
    
    return word
  })
  
  return correctedWords.join(' ')
}

/**
 * Check if word is likely misspelled (not in dictionary and not a proper noun)
 */
export function isLikelyMisspelled(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
  
  if (cleanWord.length < 2) {
    return false
  }
  
  // Check if in dictionary
  if (DICTIONARY.has(cleanWord)) {
    return false
  }
  
  // If it's all caps or starts with capital, might be proper noun
  if (word === word.toUpperCase() || (word[0] === word[0].toUpperCase() && word.length > 3)) {
    return false
  }
  
  return true
}
