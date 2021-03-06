'use strict';

const OCLE = require('../../..');

describe('getFunctions test acetone', () => {
  it('should yield to ketone', () => {
    var molecule = OCLE.Molecule.fromSmiles('CC(=O)C');
    var functions = molecule.getFunctions();

    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('ketone');
    expect(functions[0].atomMap).toStrictEqual([1, 2]);
  });
});
