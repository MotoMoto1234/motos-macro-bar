export function chooseLayout(arrangement, available, barWidth, barHeight, leftGlobal, rightGlobal, reverse = false) {
    let gap = 2;
    let layouts = { "2:1:2": [2, 1, 2], "0:5:0": [5], "3:2": [3, 2] };
    let counts = layouts[arrangement] ?? layouts["2:1:2"];
    let columns = counts.length;
    let rows = Math.max(...counts);
    let width = columns * barWidth + (columns - 1) * gap + leftGlobal + rightGlobal;
    let pages = [];
    let page = reverse ? 5 : 1;
    for (let column = 0; column < columns; column++) {
        for (let level = 0; level < counts[column]; level++) {
            pages.push({
                page,
                x: leftGlobal + column * (barWidth + gap),
                y: (rows - 1 - level) * (barHeight + gap)
            });
            page += reverse ? -1 : 1;
        }
    }
    let fit = Math.min(1, Math.max(0, available) / width);
    return { counts, pages, width, fit, height: rows * barHeight + (rows - 1) * gap };
}
