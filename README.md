# A wordle solver!

To run this program use `npm start`. The result will be a list of words
that match your hints, sorted by the best next guess.

Hints are defined as:

```typescript
type Hint = {
  char: string;
  pos?: number;
  notpos?: number[];
  skip?: boolean;
};
```

You specify a character with `char` property. Then you need to specify
one of the `pos`, `notpos`, or `skip` properties.

- `pos` indicates a "green" character
  at the position (0-5).
- `notpos` indicates a "yellow" character and is not in the position(s)
  (0-5).
- `skip` indicates the character is not a match.

After each attempt you will need to adjust the hints accordingly, then
rerun the application.

For example:

First word of `arise` results in a miss of `a`, yellow `r`, green `i`,
yellow `s`, and green `e`.

```typescript
const hints: Hint[] = [
  { char: "a", skip: true },
  { char: "r", notpos: [1] },
  { char: "i", pos: 2 },
  { char: "s", notpos: [3] },
  { char: "e", pos: 4 },
];
```
