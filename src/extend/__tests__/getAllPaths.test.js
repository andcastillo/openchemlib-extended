'use strict';

const OCLE = require('../..');

describe('getAllPaths test propane', () => {
  it('min:1, max:2', () => {
    var molecule = OCLE.Molecule.fromSmiles('CCC');
    molecule.addImplicitHydrogens();

    var paths = molecule.getAllPaths({
      fromLabel: 'C',
      toLabel: 'H',
      minLength: 1,
      maxLength: 2
    });

    expect(paths).toStrictEqual([
      {
        fromDiaID: 'eM@Df`Xb`RP\\Jh',
        toDiaID: 'gC`HALiKT@RHDRj@',
        fromAtoms: [0, 0, 0, 2, 2, 2],
        toAtoms: [3, 4, 5, 8, 9, 10],
        fromLabel: 'C',
        toLabel: 'H',
        pathLength: 1
      },
      {
        fromDiaID: 'eM@Df`Xb`RP\\Jh',
        toDiaID: 'gC`HALiMT@RHDRj@',
        fromAtoms: [0, 0, 2, 2],
        toAtoms: [6, 7, 6, 7],
        fromLabel: 'C',
        toLabel: 'H',
        pathLength: 2
      },
      {
        fromDiaID: 'eM@HzAbJC}IApj`',
        toDiaID: 'gC`HALiKT@RHDRj@',
        fromAtoms: [1, 1, 1, 1, 1, 1],
        toAtoms: [3, 4, 5, 8, 9, 10],
        fromLabel: 'C',
        toLabel: 'H',
        pathLength: 2
      },
      {
        fromDiaID: 'eM@HzAbJC}IApj`',
        toDiaID: 'gC`HALiMT@RHDRj@',
        fromAtoms: [1, 1],
        toAtoms: [6, 7],
        fromLabel: 'C',
        toLabel: 'H',
        pathLength: 1
      }
    ]);
  });

  it('min:2, max:2', () => {
    var molecule = OCLE.Molecule.fromSmiles('CCC');
    molecule.addImplicitHydrogens();

    var paths = molecule.getAllPaths({
      fromLabel: 'C',
      toLabel: 'H',
      minLength: 2,
      maxLength: 2
    });
    expect(paths[1].toAtoms).toStrictEqual([3, 4, 5, 8, 9, 10]);
  });

  it('CCC J-HH 1 to 4 ', () => {
    var molecule = OCLE.Molecule.fromSmiles('CCC');
    molecule.addImplicitHydrogens();

    var paths = molecule.getAllPaths({
      fromLabel: 'H',
      toLabel: 'H',
      minLength: 1,
      maxLength: 4
    });
    console.log(JSON.stringify(paths));
    expect(paths).toStrictEqual([
      {
        fromDiaID: 'gC`HALiKT@RHDRj@',
        toDiaID: 'gC`HALiKT@RHDRj@',
        fromAtoms: [3, 3, 4, 4, 5, 5, 8, 8, 9, 9, 10, 10],
        toAtoms: [4, 5, 3, 5, 3, 4, 9, 10, 8, 10, 8, 9],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 2
      },
      {
        fromDiaID: 'gC`HALiKT@RHDRj@',
        toDiaID: 'gC`HALiMT@RHDRj@',
        fromAtoms: [3, 3, 4, 4, 5, 5, 8, 8, 9, 9, 10, 10],
        toAtoms: [6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 3
      },
      {
        fromDiaID: 'gC`HALiKT@RHDRj@',
        toDiaID: 'gC`HALiKT@RHDRj@',
        fromAtoms: [3, 3, 3, 4, 4, 4, 5, 5, 5, 8, 8, 8, 9, 9, 9, 10, 10, 10],
        toAtoms: [8, 9, 10, 8, 9, 10, 8, 9, 10, 3, 4, 5, 3, 4, 5, 3, 4, 5],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 4
      },
      {
        fromDiaID: 'gC`HALiMT@RHDRj@',
        toDiaID: 'gC`HALiKT@RHDRj@',
        fromAtoms: [6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7],
        toAtoms: [3, 4, 5, 8, 9, 10, 3, 4, 5, 8, 9, 10],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 3
      },
      {
        fromDiaID: 'gC`HALiMT@RHDRj@',
        toDiaID: 'gC`HALiMT@RHDRj@',
        fromAtoms: [6, 7],
        toAtoms: [7, 6],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 2
      }
    ]);
  });

  it.only('p-aromatic', () => {
    var molecule = OCLE.Molecule.fromSmiles('c1(Cl)ccc(Br)cc1');
    molecule.addImplicitHydrogens();

    var paths = molecule.getAllPaths({
      fromLabel: 'H',
      toLabel: 'H',
      minLength: 1,
      maxLength: 5
    });
    console.log(JSON.stringify(paths, undefined, 2));
    expect(paths).toStrictEqual([
      {
        fromDiaID: 'did@p@fRbAqDfYun``H@GzP`HeT',
        toDiaID: 'did@p@fRqAbDfYun``H@GzP`HeT',
        fromAtoms: [8, 11],
        toAtoms: [9, 10],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 3
      },
      {
        fromDiaID: 'did@p@fRbAqDfYun``H@GzP`HeT',
        toDiaID: 'did@p@fRbAqDfYun``H@GzP`HeT',
        fromAtoms: [8, 11],
        toAtoms: [11, 8],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 4
      },
      {
        fromDiaID: 'did@p@fRqAbDfYun``H@GzP`HeT',
        toDiaID: 'did@p@fRbAqDfYun``H@GzP`HeT',
        fromAtoms: [9, 10],
        toAtoms: [8, 11],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 3
      },
      {
        fromDiaID: 'did@p@fRqAbDfYun``H@GzP`HeT',
        toDiaID: 'did@p@fRqAbDfYun``H@GzP`HeT',
        fromAtoms: [9, 10],
        toAtoms: [10, 9],
        fromLabel: 'H',
        toLabel: 'H',
        pathLength: 4
      }
    ]);
  });
});
