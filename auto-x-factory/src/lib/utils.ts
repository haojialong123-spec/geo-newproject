export function calculateTotalScore(scores: { trending: number, controversy: number, value: number, relevance: number }): number {
    return scores.trending + scores.controversy + scores.value + scores.relevance;
}
