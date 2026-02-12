// FleetConnect localStorage Data Layer
const Store = {
  _get(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  _id() { return 'fc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5); },

  // Auth
  getRole() { return localStorage.getItem('fc_role'); },
  getUser() { return localStorage.getItem('fc_user'); },
  login(role, name) { localStorage.setItem('fc_role', role); localStorage.setItem('fc_user', name || role); },
  logout() { localStorage.removeItem('fc_role'); localStorage.removeItem('fc_user'); },

  // Users
  getUsers() {
    let u = this._get('fc_users');
    if (!u.length) { u = [{id:'u1',name:'Admin',role:'admin'},{id:'u2',name:'RentalCo',role:'rental'},{id:'u3',name:'VendorInc',role:'vendor'},{id:'u4',name:'John Worker',role:'fieldworker'}]; this._set('fc_users', u); }
    return u;
  },
  addUser(name, role) { const u = this.getUsers(); u.push({id: this._id(), name, role}); this._set('fc_users', u); return u; },
  getUsersByRole(role) { return this.getUsers().filter(u => u.role === role); },

  // Jobs / Work Orders
  getJobs() { return this._get('fc_jobs'); },
  addJob(job) { const jobs = this.getJobs(); job.id = this._id(); job.status = 'pending'; job.createdAt = new Date().toISOString(); job.assignedWorker = null; jobs.push(job); this._set('fc_jobs', jobs); return job; },
  updateJob(id, updates) { const jobs = this.getJobs().map(j => j.id === id ? {...j, ...updates} : j); this._set('fc_jobs', jobs); return jobs; },
  getJobsByStatus(status) { return this.getJobs().filter(j => j.status === status); },
  getJobsForWorker(name) { return this.getJobs().filter(j => j.assignedWorker === name); },

  // Invoices
  getInvoices() { return this._get('fc_invoices'); },
  addInvoice(inv) { const invs = this.getInvoices(); inv.id = this._id(); inv.createdAt = new Date().toISOString(); inv.status = 'submitted'; invs.push(inv); this._set('fc_invoices', invs); return inv; },

  // Time Entries
  getTimeEntries() { return this._get('fc_time'); },
  clockIn(user) { const entries = this.getTimeEntries(); entries.push({id: this._id(), user, clockIn: new Date().toISOString(), clockOut: null}); this._set('fc_time', entries); },
  clockOut(user) {
    const entries = this.getTimeEntries();
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].user === user && !entries[i].clockOut) { entries[i].clockOut = new Date().toISOString(); break; }
    }
    this._set('fc_time', entries);
  },
  isClockedIn(user) { const entries = this.getTimeEntries(); for (let i = entries.length - 1; i >= 0; i--) { if (entries[i].user === user && !entries[i].clockOut) return true; } return false; },
  getTimeForUser(user) { return this.getTimeEntries().filter(e => e.user === user); },

  // Stats
  stats() {
    const jobs = this.getJobs(), invs = this.getInvoices(), users = this.getUsers();
    return {
      totalJobs: jobs.length, pendingJobs: jobs.filter(j=>j.status==='pending').length,
      activeJobs: jobs.filter(j=>j.status==='accepted'||j.status==='assigned').length,
      completedJobs: jobs.filter(j=>j.status==='completed').length,
      totalInvoices: invs.length, totalUsers: users.length,
      totalRevenue: invs.reduce((s,i)=>s+(parseFloat(i.total)||0),0)
    };
  }
};

// Auth guard
function requireAuth(allowedRoles) {
  const role = Store.getRole();
  if (!role || (allowedRoles && !allowedRoles.includes(role))) { window.location.href = 'login.html'; }
}
