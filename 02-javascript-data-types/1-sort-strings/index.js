/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
const SortTypes = {
  ASC: 'asc',
  DESC: 'desc'
};

const Direction = {
  [SortTypes.ASC]: 1,
  [SortTypes.DESC]: -1
};

const compareString = (sortType) => {
  return (stringA, stringB) => stringA.localeCompare(stringB, ['ru', 'en'], {caseFirst: 'upper'}) * Direction[sortType];
};

export function sortStrings (arr, param = SortTypes.ASC) {
  return [...arr].sort(compareString(param));
}