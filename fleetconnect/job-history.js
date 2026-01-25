// Sample orders for demo
const sampleOrders = [
    {
        id: 'WO-1001',
        contractNumber: '178435490',
        poNumber: '802556817',
        jobNumber: '17-D-27 MONROVIA-E',
        jobSiteName: 'D-27 MONROVIA -EATON A-1203',
        address: { street: '2528 LA VENEZIA CT', city: 'ALTADENA', state: 'CA', zip: '91001' },
        customerName: 'SOUTHERN CALIFORNIA EDISON TSD',
        customerNumber: '76530',
        contactName: 'MYERS, MORGAN',
        contactPhone: '626-201-6548',
        rentalCompany: 'sunbelt',
        salesman: 'REYES, PAUL (1388)',
        dateOut: '2025-01-24',
        timeOut: '08:00',
        estReturn: '2025-01-30',
        equipment: [
            { qty: '1', equipNum: '0090030', description: '20KW DIESEL GENERATOR' },
            { qty: '2', equipNum: '', description: 'WHEEL CHOCK' },
            { qty: '4', equipNum: '', description: 'TEMP FENCE PKG' }
        ],
        jobType: 'fuel-delivery',
        priority: 'normal',
        instructions: 'Gate code: 4521. Fuel tank behind generator on east side.',
        status: 'pending',
        submittedAt: '2025-01-22T14:30:00Z'
    },
    {
        id: 'WO-1002',
        contractNumber: '178435489',
        poNumber: '802556816',
        jobNumber: '17-D-26',
        jobSiteName: 'SCE POMONA SUBSTATION',
        address: { street: '1500 HOLT AVE', city: 'POMONA', state: 'CA', zip: '91768' },
        customerName: 'SOUTHERN CALIFORNIA EDISON TSD',
        customerNumber: '76530',
        contactName: 'JOHNSON, MIKE',
        contactPhone: '909-555-1234',
        rentalCompany: 'sunbelt',
        salesman: 'REYES, PAUL (1388)',
        dateOut: '2025-01-20',
        equipment: [{ qty: '1', equipNum: '0088542', description: '45KW DIESEL GENERATOR' }],
        jobType: 'equipment-tow',
        priority: 'urgent',
        instructions: 'Equipment needs to be moved to new location on site.',
        status: 'completed',
        submittedAt: '2025-01-18T09:00:00Z'
    },
    {
        id: 'WO-1003',
        contractNumber: '178435488',
        poNumber: '802556815',
        jobSiteName: 'DOWNTOWN LA CONSTRUCTION',
        address: { street: '500 S GRAND AVE', city: 'LOS ANGELES', state: 'CA', zip: '90071' },
        customerName: 'AECOM CONSTRUCTION',
        customerNumber: '82100',
        contactName: 'SMITH, JAMES',
        contactPhone: '213-555-9876',
        rentalCompany: 'united',
        dateOut: '2025-01-15',
        equipment: [{ qty: '2', equipNum: '0095521', description: '100KW GENERATOR' }],
        jobType: 'fuel-delivery',
        status: 'completed',
        submittedAt: '2025-01-14T11:00:00Z'
    },
    {
        id: 'WO-1004',
        contractNumber: '178435487',
        poNumber: '802556814',
        jobSiteName: 'IRVINE SPECTRUM PROJECT',
        address: { street: '8000 IRVINE CENTER DR', city: 'IRVINE', state: 'CA', zip: '92618' },
        customerName: 'TURNER CONSTRUCTION',
        customerNumber: '77200',
        contactName: 'DAVIS, SARAH',
        contactPhone: '949-555-4567',
        rentalCompany: 'herc',
        dateOut: '2025-01-25',
        equipment: [{ qty: '1', equipNum: '0077899', description: '60KW DIESEL GENERATOR' }],
        jobType: 'delivery',
        status: 'pending',
        submittedAt: '2025-01-23T16:00:00Z'
    }
];

// Get all orders (localStorage + samples)
function getAllOrders() {
    const stored = JSON.parse(localStorage.getItem('workOrders') || '[]');
    const all = [...sampleOrders, ...stored];
    return all.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

// Format job type for display
function formatJobType(type) {
    const types = {
        'fuel-delivery': 'Fuel Delivery',
        'equipment-tow': 'Equipment Tow',
        'emergency-fuel': 'Emergency Fuel',
        'pickup': 'Pickup',
        'delivery': 'Delivery'
    };
    return types[type] || type;
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Update stats
function updateStats(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'assigned').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statCancelled').textContent = cancelled;
}

// Render table
function renderTable(orders) {
    const tbody = document.getElementById('tableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No orders found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <div class="table-row" onclick="showOrderDetail('${order.id}')">
            <div class="contract-num" data-label="Contract #">${order.contractNumber}</div>
            <div data-label="Job Site">
                <div class="job-site">${order.jobSiteName}</div>
                <div class="job-site-address">${order.address.city}, ${order.address.state}</div>
            </div>
            <div class="customer-name" data-label="Customer">${order.customerName}</div>
            <div class="job-type" data-label="Type">${formatJobType(order.jobType)}</div>
            <div class="date" data-label="Date Out">${formatDate(order.dateOut)}</div>
            <div data-label="Status"><span class="status-badge ${order.status}">${order.status}</span></div>
        </div>
    `).join('');
}

// Filter orders
function filterOrders() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const type = document.getElementById('typeFilter').value;

    let orders = getAllOrders();

    if (search) {
        orders = orders.filter(o => 
            o.contractNumber.toLowerCase().includes(search) ||
            o.poNumber?.toLowerCase().includes(search) ||
            o.customerName.toLowerCase().includes(search) ||
            o.jobSiteName.toLowerCase().includes(search) ||
            o.address.city.toLowerCase().includes(search)
        );
    }

    if (status) {
        orders = orders.filter(o => o.status === status);
    }

    if (type) {
        orders = orders.filter(o => o.jobType === type);
    }

    updateStats(orders);
    renderTable(orders);
}

// Show order detail modal
let currentOrderId = null;

function showOrderDetail(orderId) {
    const orders = getAllOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    
    const equipmentHtml = order.equipment?.map(e => 
        `<li><span class="equipment-qty">${e.qty}x</span><span>${e.equipNum ? `#${e.equipNum} - ` : ''}${e.description}</span></li>`
    ).join('') || '<li>No equipment listed</li>';

    document.getElementById('modalBody').innerHTML = `
        <div class="detail-section">
            <div class="detail-section-label">Order Information</div>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">Contract #</div><div class="detail-value mono">${order.contractNumber}</div></div>
                <div class="detail-item"><div class="detail-label">P.O. #</div><div class="detail-value mono">${order.poNumber || '-'}</div></div>
                <div class="detail-item"><div class="detail-label">Job #</div><div class="detail-value mono">${order.jobNumber || '-'}</div></div>
                <div class="detail-item"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge ${order.status}">${order.status}</span></div></div>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-section-label">Job Site</div>
            <div class="detail-grid">
                <div class="detail-item full-width"><div class="detail-label">Site Name</div><div class="detail-value">${order.jobSiteName}</div></div>
                <div class="detail-item full-width"><div class="detail-label">Address</div><div class="detail-value">${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zip}</div></div>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-section-label">Customer & Contact</div>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">Customer</div><div class="detail-value">${order.customerName}</div></div>
                <div class="detail-item"><div class="detail-label">Customer #</div><div class="detail-value mono">${order.customerNumber || '-'}</div></div>
                <div class="detail-item"><div class="detail-label">Contact</div><div class="detail-value">${order.contactName || '-'}</div></div>
                <div class="detail-item"><div class="detail-label">Phone</div><div class="detail-value">${order.contactPhone || '-'}</div></div>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-section-label">Schedule</div>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">Date Out</div><div class="detail-value">${formatDate(order.dateOut)} ${order.timeOut || ''}</div></div>
                <div class="detail-item"><div class="detail-label">Est. Return</div><div class="detail-value">${formatDate(order.estReturn) || '-'}</div></div>
                <div class="detail-item"><div class="detail-label">Job Type</div><div class="detail-value">${formatJobType(order.jobType)}</div></div>
                <div class="detail-item"><div class="detail-label">Priority</div><div class="detail-value">${order.priority || 'Normal'}</div></div>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-section-label">Equipment</div>
            <ul class="equipment-list">${equipmentHtml}</ul>
        </div>
        ${order.instructions ? `
        <div class="detail-section">
            <div class="detail-section-label">Special Instructions</div>
            <div class="detail-item full-width"><div class="detail-value">${order.instructions}</div></div>
        </div>
        ` : ''}
    `;

    document.getElementById('modalOverlay').classList.add('show');
    
    // Update button based on status
    const btn = document.getElementById('markCompleteBtn');
    if (order.status === 'completed') {
        btn.textContent = 'Reopen Order';
    } else {
        btn.textContent = 'Mark Complete';
    }
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    currentOrderId = null;
}

// Mark complete handler
document.getElementById('markCompleteBtn').addEventListener('click', function() {
    if (!currentOrderId) return;
    
    // For sample orders, just show alert
    if (currentOrderId.startsWith('WO-100')) {
        alert('Demo order - status would be updated in a real database');
        closeModal();
        return;
    }
    
    // For localStorage orders
    let orders = JSON.parse(localStorage.getItem('workOrders') || '[]');
    const idx = orders.findIndex(o => o.id === currentOrderId);
    if (idx !== -1) {
        orders[idx].status = orders[idx].status === 'completed' ? 'pending' : 'completed';
        localStorage.setItem('workOrders', JSON.stringify(orders));
        filterOrders();
    }
    closeModal();
});

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Event listeners
document.getElementById('searchInput').addEventListener('input', filterOrders);
document.getElementById('statusFilter').addEventListener('change', filterOrders);
document.getElementById('typeFilter').addEventListener('change', filterOrders);

// Initial load
filterOrders();
