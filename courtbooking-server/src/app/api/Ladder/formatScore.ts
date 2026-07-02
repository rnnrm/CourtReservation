export function formatScore(score?: number[] | null) {
  if (!score || score.length < 2) return "0-0";
  if (score[0] === score[1]) return "0-0";
  let s = `${score[0]}-${score[1]}`;
  for (let i = 2; i < score.length; i += 2) {
    if (score[i] == null || score[i + 1] == null) continue;
    if (score[i] === score[i + 1]) continue;
    s += `,${score[i]}-${score[i + 1]}`;
  }
  return s;
}