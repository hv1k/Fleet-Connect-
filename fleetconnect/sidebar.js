// FleetConnect Sidebar Navigation
function initSidebar() {
  const role = Store.getRole();
  const user = Store.getUser();
  const currentPage = location.pathname.split('/').pop();

  const navItems = {
    admin: [
      {href:'admin-dashboard.html', icon:'📊', label:'Dashboard'},
      {href:'user-management.html', icon:'👥', label:'User Management'},
    ],
    rental: [
      {href:'rental-dashboard.html', icon:'📊', label:'Dashboard'},
      {href:'create-work-order.html', icon:'📝', label:'Create Work Order'},
      {href:'rental-jobs.html', icon:'🔧', label:'Jobs'},
      {href:'rental-invoices.html', icon:'💰', label:'Invoices'},
    ],
    vendor: [
      {href:'vendor-dashboard.html', icon:'📊', label:'Dashboard'},
      {href:'vendor-jobs.html', icon:'🔧', label:'Jobs'},
      {href:'vendor-invoices.html', icon:'💰', label:'Invoices'},
    ],
    fieldworker: [
      {href:'worker-dashboard.html', icon:'📊', label:'Dashboard'},
      {href:'worker-jobs.html', icon:'🔧', label:'My Jobs'},
      {href:'submit-invoice.html', icon:'💰', label:'Submit Invoice'},
      {href:'time-clock.html', icon:'⏰', label:'Time Clock'},
    ]
  };

  const items = navItems[role] || [];
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">⚡ FleetConnect</div>
      <div class="sidebar-user">${user} <span class="sidebar-role">(${role})</span></div>
    </div>
    <nav class="sidebar-nav">
      ${items.map(i => `<a href="${i.href}" class="sidebar-link${currentPage === i.href ? ' active' : ''}">${i.icon} ${i.label}</a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <a href="#" class="sidebar-link" onclick="Store.logout();location.href='login.html';return false;">🚪 Logout</a>
    </div>
  `;
}
document.addEventListener('DOMContentLoaded', initSidebar);
