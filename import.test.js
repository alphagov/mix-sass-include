const { compileSassFile } = require('./test-helpers');

it(`compiles`, () => {
    const css = compileSassFile('import.scss');
    
    // Ignore line break changes in the future as 6.2.0-beta.0 introduces
    // quite a lot of change in that area
    // https://github.com/alphagov/govuk-design-system/issues/5284#issuecomment-4432406880
    expect(css).toMatchSnapshot()
})