// defaultValues.js
// ================
// Stores static default values

define({
  // dependencyBlacklist
  // -------------------
  // Variable names that are not allowed as dependencies to functions
  'dependencyBlacklist': {
    'require': 'remove',
    'exports': true,
    'module': 'remove'
  },

  // defaultLOC
  // ----------
  // Default line of code property
  'defaultLOC': {
    'start': {
      'line': 0,
      'column': 0
    }
  },

  // defaultRange
  // ------------
  // Default range property
  'defaultRange': [0, 0]
});