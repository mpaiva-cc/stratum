// ff-roles.js — viewer-role personas for the permission layer. Pure data + dual-mode.
// Each role: { id, label, anchor, anchorDesc, population, scopes }.
//   population.type: 'all' | 'region' | 'subtree' | 'self' | 'store'  (+ value)
//   scopes: subset of the four consent scopes the role's AUTHORITY permits
//           (directory is always allowed for a visible person).
(function (global) {
  'use strict';
  var EMPLOYEE = ['hr.scheduling', 'hr.payroll', 'hr.certifications', 'hr.employment',
                  'hr.performance', 'hr.learning', 'hr.benefits', 'hr.work_auth'];
  var ALL = EMPLOYEE.concat(['hr.recruiting']);
  var ROLES = {
    chro: { id: 'chro', label: 'CHRO', anchor: null, anchorDesc: 'corporate',
            population: { type: 'all' }, scopes: ALL.slice() },
    hrbp: { id: 'hrbp', label: 'HRBP', anchor: null, anchorDesc: 'West Region',
            population: { type: 'region', value: 'West Region' }, scopes: ALL.slice() },
    manager: { id: 'manager', label: 'Manager', anchor: 'EMP-0001',
            anchorDesc: 'GM, Store 01',
            population: { type: 'subtree', value: 'EMP-0001' },
            scopes: ['hr.scheduling', 'hr.certifications', 'hr.employment', 'hr.performance', 'hr.learning'] },
    ic: { id: 'ic', label: 'IC', anchor: 'EMP-0002', anchorDesc: 'Store 01',
            population: { type: 'self', value: 'EMP-0002' }, scopes: EMPLOYEE.slice() },
    peer: { id: 'peer', label: 'Peer', anchor: 'EMP-0002', anchorDesc: 'Store 01',
            population: { type: 'store', value: 'Store 01 - Austin Domain' }, scopes: [] },
  };
  var api = { ROLES: ROLES, ALL_SCOPES: ALL, EMPLOYEE_SCOPES: EMPLOYEE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FFRoles = api;
})(typeof window !== 'undefined' ? window : globalThis);
