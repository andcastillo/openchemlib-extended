'use strict';

const electronegativities = require('./electronegativities');
const fragments = require('./fragments');

module.exports = function getAllCouplings() {
  var molecule = this.getCompactCopy();
  var diaIDs = molecule.getDiastereotopicAtomIDs();
  var matchFragments = molecule.getFragments();
  var fragmentsId = {};
  var couplings = [];
  for (let i = 0; i < molecule.getAllAtoms(); i++) {
    if (molecule.getAtomLabel(i) === 'H') {
      for (let j = i + 1; j < molecule.getAllAtoms(); j++) {
        if (molecule.getAtomLabel(j) === 'H') {
          if (
            !isAttachedToHeteroAtom(molecule, i) &&
            !isAttachedToHeteroAtom(molecule, j)
          ) {
            if (!(diaIDs[i].toLowerCase() === diaIDs[j].toLowerCase())) {
              var atoms = [];
              var xyz = []; // TODO
              getPath(molecule, i, i, j, 0, atoms, xyz);
              if (atoms.length !== 0) {
                var fragmentId = -1;
                var coupling = {};
                coupling.atoms = atoms;
                coupling.xyz = xyz;
                coupling.fromDiaID = diaIDs[j];
                coupling.toDiaID = diaIDs[i];
                if (matchFragments !== null) {
                  fragmentId = couplingBelongToFragment(atoms, matchFragments);
                  coupling.fragmentId = fragmentId;
                }
                if (
                  calculatedCoupling(
                    molecule,
                    coupling,
                    fragmentsId,
                    matchFragments
                  )
                ) {
                  couplings.push(coupling);
                }
              }
            }
          }
        }
      }
    }
  }
  return couplings;
};

function getPath(molecule, parent, idInit, idEnd, pathLength, atoms, xyz) {
  if (pathLength > 3) {
    return;
  }
  var nbConnectedAtoms = molecule.getAllConnAtoms(idInit);
  for (let i = 0; i < nbConnectedAtoms; i++) {
    if (molecule.getConnAtom(idInit, i) === idEnd) {
      var coordinates = new Array(3);
      coordinates[0] = molecule.getAtomX(idEnd);
      coordinates[1] = molecule.getAtomY(idEnd);
      coordinates[2] = molecule.getAtomZ(idEnd);
      atoms.push(idEnd);
      xyz.push(coordinates);

      coordinates = new Array(3);
      coordinates[0] = molecule.getAtomX(idInit);
      coordinates[1] = molecule.getAtomY(idInit);
      coordinates[2] = molecule.getAtomZ(idInit);
      atoms.push(idInit);
      xyz.push(coordinates);
      pathLength++;
      return;
    }
  }

  pathLength++;

  for (let i = 0; i < nbConnectedAtoms; i++) {
    var connectivityAtom = molecule.getConnAtom(idInit, i);
    if (connectivityAtom !== parent) {
      getPath(
        molecule,
        idInit,
        connectivityAtom,
        idEnd,
        pathLength,
        atoms,
        xyz
      );
      if (atoms.length !== 0) {
        coordinates = new Array(3);
        coordinates[0] = molecule.getAtomX(idInit);
        coordinates[1] = molecule.getAtomY(idInit);
        coordinates[2] = molecule.getAtomZ(idInit);
        atoms.push(idInit);
        xyz.push(coordinates);
        break;
      }
    }
  }
}

function couplingBelongToFragment(atoms, matchFragments) {
  var match;
  var result = -1;
  var index = atoms.length - 1;
  for (let i = 0; i < matchFragments.length; i++) {
    match = 0;
    for (let j = 0; j < matchFragments[i].length; j++) {
      for (let k = 1; k < index; k++) {
        if (matchFragments[i][j] === atoms[k]) {
          match++;
        }
      }
    }

    if (match === atoms.length - 2) {
      result = i;
      i = matchFragments.length;
    }
  }
  return result;
}

function calculatedCoupling(molecule, coupling, fragmentsId, matchFragments) {
  var atoms = coupling.atoms;
  var bondLength = atoms.length - 1;
  var fragmentId = coupling.fragmentId;
  if (fragmentId !== -1) {
    coupling.type = 0;
    var C1 = -1;
    var C2 = -1;
    var possibleCouplings = fragments[fragmentsId[fragmentId]];

    for (var i = 0; i < matchFragments[coupling.getFragmentId()].length; i++) {
      if (atoms[1] === matchFragments[fragmentId][i]) {
        C1 = i;
      }
      if (atoms[atoms.length - 2] === matchFragments[fragmentId][i]) {
        C2 = i;
      }
    }

    if (C1 > C2) {
      [C1, C2] = [C2, C1];
    }

    if (possibleCouplings !== null) {
      coupling.value = possibleCouplings[`${C1}-${C2}`];
    }

    return true;
  }

  switch (bondLength) {
    case 2:
      if (molecule.getAllConnAtoms(atoms[1]) < 4) {
        coupling.type = 1; // geminal coupling of alkene
        coupling.value = geminalCoupling();
      } else {
        coupling.value = 16; // generic coupling between geminal hydrogens
      }
      break;
    case 3: {
      var angle, xyz, coords;
      if (isDoubleBond(molecule, atoms[1], atoms[2])) {
        // coupling
        // through
        // double
        // bond
        // It have to be plain
        coupling.type = 2;
        coords = new Array(3);
        xyz = coupling.xyz;
        for (let i = 0; i < xyz.length; i++) {
          coords[i] = new Array(3);
          for (let j = 0; j < 3; j++) {
            coords[i][j] = xyz[i][j];
          }
        }

        angle = getDihedralAngle(coords);

        if (angle > 60) {
          coupling.type = 22;
          coupling.value = doubleBondCoupling(molecule, 2, atoms);
        } else {
          coupling.type = 21;
          coupling.value = doubleBondCoupling(molecule, 1, atoms);
        }
      } else {
        var sumZ = 0;
        angle = 0.0;
        xyz = coupling.xyz;
        coords = new Array(3);

        for (let i = 0; i < xyz.length; i++) {
          coords[i] = new Array(3);
          for (let j = 0; j < 3; j++) {
            coords[i][j] = xyz[i][j];
          }
          sumZ += Math.abs(coords[i][2]);
        }
        if (sumZ === 0 && !isDoubleOrTripleBond(molecule, atoms[1], atoms[2])) {
          // If
          // it is single and no Z coordinate
          angle = 60;
        } else {
          angle = getDihedralAngle(coords);
        }
        if (checkVynilicCoupling(molecule, atoms) === true) {
          coupling.type = 3;
          coupling.value = vinylCoupling(angle);
        } else {
          coupling.type = 4;
          coupling.value = jCouplingVicinal(molecule, angle, 1, atoms);
        }
      }
      coupling.angle = angle;
      break;
    }
    case 4: {
      // allylic Coupling
      coupling.type = 5;
      if (
        isDoubleOrTripleBond(molecule, atoms[1], atoms[2]) &&
        isNotAromatic(molecule, atoms[1], atoms[2])
      ) {
        coupling.value = 2;
      } else if (
        isDoubleOrTripleBond(molecule, atoms[2], atoms[3]) &&
        isNotAromatic(molecule, atoms[2], atoms[3])
      ) {
        coupling.value = 2;
      } else if (
        isAromatic(molecule, atoms[1], atoms[2]) &&
        isAromatic(molecule, atoms[2], atoms[3])
      ) {
        coupling.value = 2;
      } else {
        if (
          isAromatic(molecule, atoms[1], atoms[1]) &&
          !isAromatic(molecule, atoms[2], atoms[3])
        ) {
          if (isOnlyAttachedToHC(molecule, atoms[3])) {
            coupling.value = 1.5;
            return true;
          }
        } else {
          if (
            !isAromatic(molecule, atoms[1], atoms[1]) &&
            isAromatic(molecule, atoms[2], atoms[3])
          ) {
            if (isOnlyAttachedToHC(molecule, atoms[1])) {
              coupling.value = 1.5;
              return true;
            }
          }
        }
        coupling.value = 0;
        return false;
      }
      break;
    }
    default:
      coupling.value = 7; // check default value
      break;
  }

  return true;
}

function getDihedralAngle(xyz) {
  /*
   * double sum=0; //Check if we have the Z coordinate for (int
   * i=0;i<xyz.length;i++) sum+=Math.abs(xyz[i][2]); if(sum==0) return 60;
   */
  var cosAng, P, Q;
  var distances = new Array(6);
  var Sdistances = new Array(6);
  var k = 0;

  for (let i = 0; i < xyz.length; i++) {
    for (let j = i + 1; j < xyz.length; j++) {
      Sdistances[k] =
        (xyz[i][0] - xyz[j][0]) * (xyz[i][0] - xyz[j][0]) +
        (xyz[i][1] - xyz[j][1]) * (xyz[i][1] - xyz[j][1]) +
        (xyz[i][2] - xyz[j][2]) * (xyz[i][2] - xyz[j][2]);
      distances[k] = Math.sqrt(Sdistances[k]);
      k++;
    }
  }

  P =
    Sdistances[0] * (Sdistances[3] + Sdistances[5] - Sdistances[4]) +
    Sdistances[3] * (-Sdistances[3] + Sdistances[5] + Sdistances[4]) +
    Sdistances[1] * (Sdistances[3] - Sdistances[5] + Sdistances[4]) -
    2 * Sdistances[3] * Sdistances[2];

  Q =
    (distances[0] + distances[3] + distances[1]) *
    (distances[0] + distances[3] - distances[1]) *
    (distances[0] - distances[3] + distances[1]) *
    (-distances[0] + distances[3] + distances[1]) *
    (distances[3] + distances[5] + distances[4]) *
    (distances[3] + distances[5] - distances[4]) *
    (distances[3] - distances[5] + distances[4]) *
    (-distances[3] + distances[5] + distances[4]);

  cosAng = P / Math.sqrt(Q);

  if (cosAng > 1 || cosAng < -1) {
    cosAng = 1;
  }

  return (Math.acos(cosAng) * 180) / Math.PI;
}

function jCouplingVicinal(molecule, dihedralAngle, model, atoms) {
  var J = 0.0;
  var delta;
  var nbConnectedAtoms;
  var electH = electronegativities.H;
  var direction = [1, -1, 1, -1];
  var p = [];
  switch (model) {
    case 1:
      // type = "karplus";

      p = [7.76, -1.1, 1.4];
      J =
        p[0] * Math.cos(dihedralAngle) * Math.cos(dihedralAngle) +
        p[1] * Math.cos(dihedralAngle) +
        p[2];
      break;

    case 2:
      // type = "Karplus-altona";

      // p = [13.88, -0.81, 0, 0.56, -2.32, 17.9];
      p = [13.7, -0.73, 0, 0.56, -2.47, 16.9];
      for (let j = 1; j < atoms.length - 1; j++) {
        nbConnectedAtoms = molecule.getAllConnAtoms(j);
        for (let i = 0; i < nbConnectedAtoms; i++) {
          delta =
            electronegativities[
              molecule.getAtomLabel(molecule.getConnAtom(j, i))
            ] - electH;
          J +=
            delta *
            (p[3] +
              p[4] *
                Math.cos(
                  direction[j] * dihedralAngle + p[5] * Math.abs(delta)
                ) *
                Math.cos(
                  direction[j] * dihedralAngle + p[5] * Math.abs(delta)
                ));
        }
      }
      J +=
        p[0] * Math.cos(dihedralAngle) * Math.cos(dihedralAngle) +
        p[1] * Math.cos(dihedralAngle) +
        p[2];
      break;

    case 3:
      // type = "Karplus-altona beta effect";
      p = [13.7, -0.73, 0, 0.56, -2.47, 16.9, -0.14];
      var I;
      var atom2;
      var nbConnectedAtoms2;

      for (let j = 1; j < atoms.length - 1; j++) {
        nbConnectedAtoms = molecule.getAllConnAtoms(j);
        I = 0;
        for (let i = 0; i < nbConnectedAtoms; i++) {
          atom2 = molecule.getConnAtom(j, i);
          delta = electronegativities[molecule.getAtomLabel(atom2)] - electH;
          atom2 = molecule.getConnAtom(j, i);
          nbConnectedAtoms2 = molecule.getAllConnAtoms(atom2);
          for (let k = 0; k < nbConnectedAtoms2; k++) {
            // i = (Ca -CH) + p7 S ( Cb -CH)
            I +=
              electronegativities[
                molecule.getAtomLabel(molecule.getConnAtom(atom2, k))
              ] - electH;
          }
          I = delta + p[6] * I;
        }

        J +=
          I *
          (p[3] +
            p[4] *
              (Math.cos(direction[j] * dihedralAngle + p[5] * Math.abs(I)) *
                Math.cos(direction[j] * dihedralAngle + p[5] * Math.abs(I))));
      }
      J +=
        p[0] * Math.cos(dihedralAngle) * Math.cos(dihedralAngle) +
        p[1] * Math.cos(dihedralAngle) +
        p[2];
      break;
    default:
      J = 0.0;
  }
  return J;
}

function vinylCoupling(phi) {
  var J = 0.0;
  if (phi <= 90) {
    J =
      6.6 * Math.cos(phi) * Math.cos(phi) + 2.6 * Math.sin(phi) * Math.sin(phi);
  } else {
    J =
      11.6 * Math.cos(phi) * Math.cos(phi) +
      2.6 * Math.sin(phi) * Math.sin(phi);
  }
  return J;
}

function geminalCoupling() {
  return 1.6; // average over a sample of experimental spectra
}

function doubleBondCoupling(molecule, type, atoms) {
  var x = 0;
  var nbConnectedAtoms;
  for (let j = 1; j < atoms.length - 1; j++) {
    nbConnectedAtoms = molecule.getAllConnAtoms(j);
    for (let i = 0; i < nbConnectedAtoms; i++) {
      x +=
        electronegativities[molecule.getAtomLabel(molecule.getConnAtom(j, i))] -
        electronegativities.H;
    }
  }

  var result;
  switch (type) {
    case 1: // cis, empirical formula from a sample of experimental spectra
      result = -4.724 * x + 13.949;
      break;
    case 2: // trans, empirical formula from a sample of experimental
      // spectra
      result = -3.063 * x + 17.519;
      break;
    default:
      result = 0;
  }

  return result;
}

function checkVynilicCoupling(molecule, atoms) {
  var nbConnectedAtoms;
  var result = false;
  for (var j = 1, l = atoms.length - 1; j < l; j++) {
    nbConnectedAtoms = molecule.getAllConnAtoms(atoms[j]);
    if (nbConnectedAtoms < 4) {
      result = true;
      j = l;
    }
  }
  return result;
}

function isDoubleBond(molecule, atom1, atom2) {
  var bond = molecule.getBond(atom1, atom2);
  var bondType = molecule.getBondType(bond);
  return bondType === 2;
}

function isDoubleOrTripleBond(molecule, atom1, atom2) {
  var bond = molecule.getBond(atom1, atom2);
  var bondType = molecule.getBondType(bond);
  return bondType === 2 || bondType === 4;
}

function isNotAromatic(molecule, atom1, atom2) {
  var bond = molecule.getBond(atom1, atom2);
  return !molecule.isAromaticBond(bond);
}

function isAromatic(molecule, atom1, atom2) {
  var bond = molecule.getBond(atom1, atom2);
  return molecule.isAromaticBond(bond);
}

function isAttachedToHeteroAtom(molecule, atom) {
  var result = false;
  var nbConnectedAtoms = molecule.getAllConnAtoms(atom);
  for (var j = 0; j < nbConnectedAtoms; j++) {
    var connAtom = molecule.getConnAtom(atom, j);
    if (!(molecule.getAtomLabel(connAtom) === 'C')) {
      result = true;
      j = nbConnectedAtoms;
    }
  }
  return result;
}

function isOnlyAttachedToHC(molecule, atom) {
  var nbConnectedAtoms = molecule.getAllConnAtoms(atom);
  for (var j = 0; j < nbConnectedAtoms; j++) {
    var connAtom = molecule.getConnAtom(atom, j);
    if (
      !(
        molecule.getAtomLabel(connAtom) === 'C' ||
        molecule.getAtomLabel(connAtom) === 'H'
      )
    ) {
      return false;
    }
  }
  return true;
}
