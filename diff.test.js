const {createPatch} = require('diff');
const { compileSassFile } = require('./test-helpers');

it('applies configuration with `@import`', () => {
    const withImport = compileSassFile(`import.scss`);
    const withUse = compileSassFile(`use.scss`);

    expect(createPatch('import-vs-use', withImport, withUse)).toMatchSnapshot()
})
