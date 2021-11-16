/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === 0) {
    return '';
  }

  if (!size) {
    return string;
  }

  let counter = 0;

  return string
    .split('')
    .reduce((accStr, char) => {
      if (accStr[accStr.length - 1] === char) {
        if (counter < size) {
          accStr.push(char);
          counter += 1;
        }
      } else {
        accStr.push(char);
        counter = 1;
      }

      return accStr;
    }, [])
    .join('');
}
