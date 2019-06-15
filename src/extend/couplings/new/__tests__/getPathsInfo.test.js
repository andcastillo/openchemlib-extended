'use strict';

const OCLE = require('../../../..');
const getPathsInfo = require('../getPathsInfo');

describe('getPathsInfo test propane', () => {
  it('min:1, max:2', () => {
    var molecule = OCLE.Molecule.fromSmiles('CCC');
    molecule.addImplicitHydrogens();

    var pathsInfo = getPathsInfo(molecule, {
      fromLabel: 'H',
      toLabel: 'H',
      minLength: 1,
      maxLength: 3
    });

    expect(true).toBe(true);
  });
});
