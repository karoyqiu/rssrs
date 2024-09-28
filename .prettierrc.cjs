/** @type {import("prettier").Options} */
module.exports = {
  plugins: [
    require.resolve('prettier-plugin-tailwindcss'),
    require.resolve('prettier-plugin-organize-attributes'),
    require.resolve('@trivago/prettier-plugin-sort-imports'),
  ],
  attributeGroups: ['$CODE_GUIDE'],
  attributeSort: 'ASC',
  printWidth: 100,
  singleQuote: true,
  importOrder: ['^@/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
