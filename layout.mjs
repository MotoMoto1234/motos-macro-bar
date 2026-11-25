export function chooseLayout(arrangement, available, barWidth, barHeight, controlWidth, controlHeight, reverse = false) {
    let gap = 2;
    let controlGap = 4;
    let layouts = { "2:1:2": [2, 1, 2], "0:5:0": [5], "3:2": [3, 2] };
    let counts = layouts[arrangement] ?? layouts["2:1:2"];
    let columns = counts.length;
    let rows = Math.max(...counts);
    let vertical = arrangement === "3:2";
    let barsWidth = columns * barWidth + (columns - 1) * gap;
    let barsHeight = rows * barHeight + (rows - 1) * gap;
    let width = vertical ? barsWidth + controlGap + controlWidth : Math.max(barsWidth, controlWidth);
    let height = vertical ? Math.max(barsHeight, controlHeight) : columns === 1
        ? barsHeight + controlGap + controlHeight
        : Math.max(barsHeight, barHeight + controlGap + controlHeight);
    let controls = {
        x: vertical ? barsWidth + controlGap : (width - controlWidth) / 2,
        y: vertical ? height - controlHeight : columns === 1 ? 0 : height - barHeight - controlGap - controlHeight
    };
    let pages = [];
    let page = reverse ? 5 : 1;
    for (let column = 0; column < columns; column++) {
        for (let level = 0; level < counts[column]; level++) {
            pages.push({
                page,
                x: (vertical ? 0 : (width - barsWidth) / 2) + column * (barWidth + gap),
                y: height - barHeight - level * (barHeight + gap)
            });
            page += reverse ? -1 : 1;
        }
    }
    let fit = Math.min(1, Math.max(0, available) / width);
    return { counts, pages, controls, width, fit, height };
}
