// Function to generate a consistent color based on a string
export const stringToColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
};

// Function to generate a color based on priority (1-100)
export const priorityToColor = (priority: number): string => {
    // High priority: red, Medium: yellow, Low: green
    if (priority >= 70) {
        return '#ff5252'; // Red
    } else if (priority >= 40) {
        return '#ffb74d'; // Orange
    } else {
        return '#81c784'; // Green
    }
};

// Function to generate a lighter version of a color
export const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1);
};