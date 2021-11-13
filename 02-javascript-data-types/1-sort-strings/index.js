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

const OptionsForLocalCompareMethod = {
  caseFirst: 'upper'
};

const compareString = (sortType) => (a, b) => 
  SortTypes.ASC === sortType 
    ? a.localeCompare(b, undefined, OptionsForLocalCompareMethod) 
    : b.localeCompare(a, undefined, OptionsForLocalCompareMethod);

export function sortStrings (arr, param = SortTypes.ASC) {
  return [...arr].sort(compareString(param));
}