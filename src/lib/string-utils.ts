// src/lib/string-utils.ts
/**
 * Converts a snake_case string to Title Case
 * @param str - The snake_case string to convert
 * @returns The converted string in Title Case
 * @example
 * snakeToTitle('hello_world') // returns 'Hello World'
 * snakeToTitle('user_name') // returns 'User Name'
 */
export const snakeToTitle = (str: string): string => {
  if (!str) return '';

  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
