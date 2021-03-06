'use strict';

var parseRXN = require('rxn-parser');

module.exports = function (OCL) {
  function RXN(rxn) {
    if (!rxn) {
      this.reagents = [];
      this.products = [];
    } else {
      var parsed = parseRXN(rxn);
      this.reagents = generateInfo(parsed.reagents);
      this.products = generateInfo(parsed.products);
    }
  }

  RXN.prototype.addReagent = function (molfile) {
    this.reagents.push(getMolfileInfo(molfile));
  };

  RXN.prototype.addProduct = function (molfile) {
    this.products.push(getMolfileInfo(molfile));
  };

  RXN.prototype.toRXN = function () {
    var result = [];
    result.push('$RXN');
    result.push('');
    result.push('');
    result.push('Openchemlib');
    result.push(format3(this.reagents.length) + format3(this.products.length));
    for (let i = 0; i < this.reagents.length; i++) {
      result.push('$MOL');
      result.push(getMolfile(this.reagents[i].molfile));
    }
    for (let i = 0; i < this.products.length; i++) {
      result.push('$MOL');
      result.push(getMolfile(this.products[i].molfile));
    }
    return result.join('\n');
  };


  function getMolfile(molfile) {
    var lines = (~molfile.indexOf('\r\n')) ? molfile.split('\r\n') : molfile.split(/[\r\n]/);
    return lines.join('\n');
  }

  function format3(number) {
    var length = (`${number}`).length;
    return '   '.substring(0, 3 - length) + number;
  }

  function generateInfo(molecules) {
    for (var i = 0; i < molecules.length; i++) {
      molecules[i] = getMolfileInfo(molecules[i]);
    }
    return molecules;
  }

  function getMolfileInfo(molfile) {
    var ocl = OCL.Molecule.fromMolfile(molfile);
    return {
      molfile: molfile,
      smiles: ocl.toSmiles(),
      mf: ocl.getMolecularFormula().formula,
      mw: ocl.getMolecularFormula().relativeWeight,
      idCode: ocl.getIDCode
    };
  }

  return RXN;
};
