'use strict';

const fs = require('fs');
const join = require('path').join;

const OCLE = require('../..');

describe('getMF test', () => {
  it('check benzene', () => {
    var molecule = OCLE.Molecule.fromSmiles('c1ccccc1');
    var result = molecule.getMF();
    expect(result.mf).toBe('C6H6');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toBe('C6H6');
  });
  it('check glycine', () => {
    var molecule = OCLE.Molecule.fromSmiles('[NH3+]CC(=O)[O-]');
    var result = molecule.getMF();
    expect(result.mf).toBe('C2H5NO2');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toBe('C2H5NO2');
  });
  it('check isotope of pentane', () => {
    var molecule = OCLE.Molecule.fromSmiles('CC[13CH2]CC([2H])([2H])([2H])');
    var result = molecule.getMF();
    expect(result.mf).toBe('C4H9[13C][2H]3');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toBe('C4H9[13C][2H]3');
  });
  it('check multipart', () => {
    var molecule = OCLE.Molecule.fromSmiles('OCC(N)CCl.[CH2+][2H]');
    var result = molecule.getMF();
    expect(result.mf).toBe('C4H10ClNO[2H](+)');
    expect(result.parts).toHaveLength(2);
    expect(result.parts[0]).toBe('C3H8ClNO');
    expect(result.parts[1]).toBe('CH2[2H](+)');
  });
  it('check multihydrate', () => {
    var molecule = OCLE.Molecule.fromSmiles('[ClH].O.O.O.O');

    var result = molecule.getMF();
    expect(result.mf).toBe('H9ClO4');
    expect(result.parts).toHaveLength(2);
    expect(result.parts[0]).toBe('4H2O');
    expect(result.parts[1]).toBe('HCl');
  });

  it('check 4 H2O', () => {
    var molecule = OCLE.Molecule.fromSmiles('O.O.O.O');

    var result = molecule.getMF();
    expect(result.mf).toBe('H8O4');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toBe('4H2O');
  });

  it('check Li+ OH-', () => {
    var molecule = OCLE.Molecule.fromIDCode('eDJRpCjP@');
    var result = molecule.getMF();
    expect(result.mf).toBe('HLiO');
    expect(result.parts).toHaveLength(2);
    expect(result.parts[0]).toBe('HO(-)');
    expect(result.parts[1]).toBe('Li(+)');
  });

  it('check 2 atoms of cobalt', () => {
    // if we have the same molecular formula we group them and count in front
    var molecule = OCLE.Molecule.fromIDCode('eDACXm`@@');
    var result = molecule.getMF();
    expect(result.mf).toBe('Co2');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toBe('2Co');
  });

  it('check O--', () => {
    var molecule = OCLE.Molecule.fromSmiles('[O--]');
    var result = molecule.getMF();
    expect(result.mf).toBe('O(-2)');
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]).toBe('O(-2)');
  });

  it('multipart molfile', () => {
    let molfile = fs.readFileSync(join(__dirname, 'ru.mol'), 'utf8');
    let molecule = OCLE.Molecule.fromMolfile(molfile);
    let mf = molecule.getMF();
    expect(mf).toStrictEqual({ parts: ['2C8H16', '2HORu'], mf: 'C16H34O2Ru2' });
  });
});
