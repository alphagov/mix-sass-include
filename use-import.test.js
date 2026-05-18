const { compile, NodePackageImporter } = require('sass');
const {createPatch} = require('diff')

it('applies configuration consistently', () => {
    const onlyUse = compileSassFile(`use.scss`);
    const useAndImport = compileSassFile(`use-import.scss`)

    expect(createPatch('use', onlyUse, useAndImport)).toMatchSnapshot()
})

function compileSassFile(file) {
    const {css} = compile(file, {
        importers: [new NodePackageImporter()],
        silenceDeprecations: ['import']
    });
    // Ignore line break changes in the future as 6.2.0-beta.0 introduces
    // quite a lot of change in that area
    // https://github.com/alphagov/govuk-design-system/issues/5284#issuecomment-4432406880
    return css.replaceAll(/(\n)+/g, '\n')
}