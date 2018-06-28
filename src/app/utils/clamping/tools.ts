export function clampToClosestValue(value: number, scale: Array<number>): number {
    // Calculate differences to all values
    const diffs = scale.map((item: number) => {
        return Math.abs(value - item);
    });

    // Look for closest match, return its value
    for(let i = 0; i < diffs.length - 1; i++) {
        if(diffs[i] < diffs[i + 1]) {
            return scale[i];
        }
    }

    // Smallest element was the last value
    return scale[diffs.length - 1];
}