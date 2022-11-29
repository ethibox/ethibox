const requireEsm = require('esm-wallaby')(module);

module.exports = (path) => requireEsm(path);
