'use strict';

var OCLE = require('../core');

var molecule = OCLE.Molecule.fromSmiles('CCC');
molecule.addImplicitHydrogens();

let diaIDs = molecule.getDiastereotopicAtomIDs();

console.log(diaIDs);
