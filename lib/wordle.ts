import fs from "fs";
import path from "path";

const jsonpath = path.resolve(__dirname, "../", "words.json");
const all = JSON.parse(fs.readFileSync(jsonpath, "utf8"));
const words = filterValidWords(all);

type Hint = {
  char: string;
  pos?: number;
  notpos?: number[];
  skip?: boolean;
};

const hints: Hint[] = [
  { char: "a", skip: true },
  { char: "r", notpos: [1] },
  { char: "i", pos: 2 },
  { char: "s", notpos: [3] },
  { char: "e", pos: 4 },
];

const results = run(words, hints);
console.log(results);

/**
 * Runs the wordle solver give the list of words and provided hints.
 * This naive algorithm does the following:
 * 1. filters the list of words to those matching the hints
 * 2. calculates a character frequency based on the possible words
 * 3. ranks each character where the most frequently used are the highest
 *    rank
 * 4. generates a score for each word based on the character ranks to
 *    find the word that is representative of the most words remaining
 * 5. sorts the words by score and and presents the top 10 best words to
 *    try next
 * @param words a list of words
 * @param hints a list of hints
 * @returns guesses to try next
 */
function run(words: string[], hints: Hint[]) {
  const possibleWords = filterWords(words, hints);
  const charFreqs = calcCharFreqs(possibleWords);
  const charRanks = calcCharRanks(charFreqs);
  const filteredWordScores = calcWordScores(possibleWords, charRanks);
  return sortWordScores(filteredWordScores)
    .map((p) => p[0])
    .slice(0, 10);
}

/**
 * Filters a list of words so that they only contain the characters a to
 * z and are five characters long. This function is useful if you use
 * a word list other than the supplied list.
 * @param words
 * @returns
 */
function filterValidWords(words: string[]): string[] {
  return words.filter(
    (word) =>
      word.length === 5 && word.split("").every((c) => c >= "a" && c <= "z")
  );
}

/**
 * Calculates the frequency of each chacater used in the corpus of
 * words. For example, if [apple, grape] generates a=2,p=3,l=1,e=2,g=1,r=1.
 * @param words
 * @returns
 */
function calcCharFreqs(words: string[]): Map<string, number> {
  const result = new Map<string, number>();
  for (let c = "a"; c <= "z"; c = String.fromCharCode(c.charCodeAt(0) + 1)) {
    result.set(c, 0);
  }

  for (const word of words) {
    for (const c of word) {
      result.set(c, result.get(c) + 1);
    }
  }

  return result;
}

/**
 * Ranks characters based on their frequency in descending order, meaning
 * the most frequently used characters have the highest rank. For example
 * a=2,p=3,l=1,e=2,g=1,r=1 generates a rank of p=1,a=2,e=3,g=4,r=5.
 * @param charFreqs
 * @returns
 */
function calcCharRanks(charFreqs: Map<string, number>): Map<string, number> {
  return new Map(
    Array.from(charFreqs.entries())
      .sort((a, b) => {
        if (a[1] > b[1]) return -1;
        if (a[1] < b[1]) return 1;
        return 0;
      })
      .map((kvp, i) => [kvp[0], i + 1])
  );
}

/**
 * From a list of words we calculate a score for the each word
 * by summing the character rank for each character in the word. The
 * lower the score the better the word. Duplicate characters have a
 * penalty applied.
 * @param words words to rank
 * @param charRank character rank
 * @returns
 */
function calcWordScores(
  words: string[],
  charRank: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  for (const word of words) {
    let score = 0;
    const chars = new Set<string>();
    for (const c of word) {
      const rank = charRank.get(c);
      score += chars.has(c) ? rank + 26 : rank;
      chars.add(c);
    }
    result.set(word, score);
  }
  return result;
}

/**
 * Sorts a tuple of [word,score] pairs by their rank ascending.
 * @param wordScores
 * @returns
 */
function sortWordScores(wordScores: Map<string, number>): [string, number][] {
  return Array.from(wordScores.entries()).sort((a, b) => {
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
  });
}

/**
 * Filters a list of words to only those matching the provided hints.
 * @param words
 * @param hints
 * @returns
 */
function filterWords(words: string[], hints: Hint[]): string[] {
  const results: string[] = [];
  for (const word of words) {
    if (testWord(word, hints)) results.push(word);
  }
  return results;
}

/**
 * Tests a word against the provided hints
 * @param word
 * @param hints
 * @returns
 */
function testWord(word: string, hints: Hint[]): boolean {
  for (const hint of hints) {
    if (!isWordHintMatch(word, hint)) return false;
  }
  return true;
}

/**
 * Tests a word against a particular hint.
 * @param word
 * @param hint
 * @returns
 */
function isWordHintMatch(word: string, hint: Hint): boolean {
  // must match position
  if (hint.pos !== undefined) {
    return word[hint.pos] === hint.char;
  }

  // must not have char in location but must be in some position
  if (hint.notpos !== undefined) {
    for (const notpos of hint.notpos) {
      if (word[notpos] === hint.char) return false;
    }
    return word.split("").some((c) => c === hint.char);
  }

  // must not contain char
  if (hint.skip) {
    return !word.split("").some((c) => c === hint.char);
  }
}
