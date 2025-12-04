export const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
export const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
