export const getEscapedCell = (s: string) => {
  if (s[0] === `"` && s[s.length - 1] === `"`) {
    return s.substring(1, s.length - 1);
  }
  return s;
};