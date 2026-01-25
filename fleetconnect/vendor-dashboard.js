// Check auth
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (!currentUser || currentUser.role !== 'vendor') {
    window.location.href = 'login.html';
}
document.getElementById('userName').textContent = currentUser?.name || '';

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Current vendor (in real app, this would come from login)
const CURRENT_VENDOR = currentUser?.vendorId || 'your-company';

// Sample jobs for demo
const sampleJobs = [
    {
        id: 'WO-1001',
        contractNumber: '178435490',
        poNumber: '802556817',
        jobSiteName: 'D-27 MONROVIA -EATON A-1203',
        address: { street: '2528 LA VENEZIA CT', city: 'ALTADENA', state: 'CA', zip: '91001' },
        customerName: 'SOUTHERN CALIFORNIA EDISON TSD',
        contactName: 'MYERS, MORGAN',
        contactPhone: '626-201-6548',
        rentalCompany: 'Sunbelt Rentals',
        dateOut: '2025-01-24',
        timeOut: '08:00',
        equipment: [
            { qty: '1', equipNum: '0090030', description: '20KW DIESEL GENERATOR' },
            { qty: '2', description: 'WHEEL CHOCK' }
        ],
        jobType: 'fuel-delivery',
        priority: 'normal',
        instructions: 'Gate code: 4521. Fuel tank behind generator on east side.',
        status: 'assigned',
        assignedVendor: 'your-company',
        submittedAt: '2025-01-22T14:30:00Z'
    },
    {
        id: 'WO-1002',
        contractNumber: '178435489',
        poNumber: '802556816',
        jobSiteName: 'SCE POMONA SUBSTATION',
        address: { street: '1500 HOLT AVE', city: 'POMONA', state: 'CA', zip: '91768' },
        customerName: 'SOUTHERN CALIFORNIA EDISON TSD',
        contactName: 'JOHNSON, MIKE',
        contactPhone: '909-555-1234',
        rentalCompany: 'Sunbelt Rentals',
        dateOut: '2025-01-25',
        timeOut: '07:00',
        equipment: [{ qty: '1', equipNum: '0088542', description: '45KW DIESEL GENERATOR' }],
        jobType: 'equipment-tow',
        priority: 'urgent',
        instructions: 'Equipment needs to be moved to new location on site. Call when arriving.',
        status: 'assigned',
        assignedVendor: 'your-company',
        submittedAt: '2025-01-23T09:00:00Z'
    },
    {
        id: 'WO-1003',
        contractNumber: '178435488',
        poNumber: '802556815',
        jobSiteName: 'DOWNTOWN LA CONSTRUCTION',
        address: { street: '500 S GRAND AVE', city: 'LOS ANGELES', state: 'CA', zip: '90071' },
        customerName: 'AECOM CONSTRUCTION',
        contactName: 'SMITH, JAMES',
        contactPhone: '213-555-9876',
        rentalCompany: 'United Rentals',
        dateOut: '2025-01-26',
        equipment: [{ qty: '2', equipNum: '0095521', description: '100KW GENERATOR' }],
        jobType: 'fuel-delivery',
        status: 'open',
        assignedVendor: null,
        submittedAt: '2025-01-23T11:00:00Z'
    },
    {
        id: 'WO-1004',
        contractNumber: '178435487',
        poNumber: '802556814',
        jobSiteName: 'IRVINE SPECTRUM PROJECT',
        address: { street: '8000 IRVINE CENTER DR', city: 'IRVINE', state: 'CA', zip: '92618' },
        customerName: 'TURNER CONSTRUCTION',
        contactName: 'DAVIS, SARAH',
        contactPhone: '949-555-4567',
        rentalCompany: 'Herc Rentals',
        dateOut: '2025-01-27',
        equipment: [{ qty: '1', equipNum: '0077899', description: '60KW DIESEL GENERATOR' }],
        jobType: 'delivery',
        status: 'open',
        assignedVendor: null,
        submittedAt: '2025-01-23T16:00:00Z'
    },
    {
        id: 'WO-1005',
        contractNumber: '178435486',
        poNumber: '802556813',
        jobSiteName: 'BURBANK MEDIA CENTER',
        address: { street: '3000 W ALAMEDA AVE', city: 'BURBANK', state: 'CA', zip: '91523' },
        customerName: 'NBC UNIVERSAL',
        contactName: 'WILSON, TOM',
        contactPhone: '818-555-3333',
        rentalCompany: 'Sunbelt Rentals',
        dateOut: '2025-01-20',
        equipment: [{ qty: '1', description: '30KW GENERATOR' }],
        jobType: 'fuel-delivery',
        status: 'accepted',
        assignedVendor: 'your-company',
        submittedAt: '2025-01-19T08:00:00Z'
    },
    {
        id: 'WO-1006',
        contractNumber: '178435485',
        poNumber: '802556812',
        jobSiteName: 'LONG BEACH PORT',
        address: { street: '415 W OCEAN BLVD', city: 'LONG BEACH', state: 'CA', zip: '90802' },
        customerName: 'PORT OF LONG BEACH',
        contactName: 'GARCIA, MARIA',
        contactPhone: '562-555-7777',
        rentalCompany: 'United Rentals',
        dateOut: '2025-01-15',
        equipment: [{ qty: '3', description: '50KW GENERATOR' }],
        jobType: 'fuel-delivery',
        status: 'completed',
        assignedVendor: 'your-company',
        completedAt: '2025-01-15T16:00:00Z',
        submittedAt: '2025-01-14T10:00:00Z'
    }
];

// Get jobs from localStorage and merge with samples
function getAllJobs() {
    const stored = JSON.parse(localStorage.getItem('vendorJobs') || '[]');
    // Merge, avoiding duplicates by ID
    const ids = new Set(stored.map(j => j.id));
    const merged = [...stored];
    sampleJobs.forEach(job => {
        if (!ids.has(job.id)) merged.push(job);
    });
    return merged;
}

function saveJobs(jobs) {
    localStorage.setItem('vendorJobs', JSON.stringify(jobs));
}

// Format helpers
function formatJobType(type) {
    const types = { 'fuel-delivery': 'Fuel Delivery', 'equipment-tow': 'Equipment Tow', 'emergency-fuel': 'Emergency Fuel', 'pickup': 'Pickup', 'delivery': 'Delivery' };
    return types[type] || type;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Current tab
let currentTab = 'assigned';

// Filter jobs by tab
function getFilteredJobs(tab) {
    const jobs = getAllJobs();
    switch(tab) {
        case 'assigned':
            return jobs.filter(j => j.assignedVendor === CURRENT_VENDOR && j.status === 'assigned');
        case 'active':
            return jobs.filter(j => j.assignedVendor === CURRENT_VENDOR && (j.status === 'accepted' || j.status === 'in-progress'));
        case 'open':
            return jobs.filter(j => j.status === 'open');
        case 'completed':
            return jobs.filter(j => j.assignedVendor === CURRENT_VENDOR && j.status === 'completed');
        default:
            return [];
    }
}

// Update stats
function updateStats() {
    const jobs = getAllJobs();
    const needsResponse = jobs.filter(j => j.assignedVendor === CURRENT_VENDOR && j.status === 'assigned').length;
    const active = jobs.filter(j => j.assignedVendor === CURRENT_VENDOR && (j.status === 'accepted' || j.status === 'in-progress')).length;
    const completed = jobs.filter(j => j.assignedVendor === CURRENT_VENDOR && j.status === 'completed').length;
    const open = jobs.filter(j => j.status === 'open').length;
    
    document.getElementById('statNeedsResponse').textContent = needsResponse;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statOpen').textContent = open;
    
    document.getElementById('countAssigned').textContent = needsResponse;
    document.getElementById('countActive').textContent = active;
    document.getElementById('countOpen').textContent = open;
    document.getElementById('countCompleted').textContent = completed;
}

// Render job card
function renderJobCard(job) {
    const priorityBadge = job.priority === 'urgent' ? '<span class="priority-badge urgent">URGENT</span>' : 
                          job.priority === 'emergency' ? '<span class="priority-badge emergency">EMERGENCY</span>' : '';
    
    const equipmentTags = job.equipment?.map(e => 
        `<span class="equipment-tag"><span class="qty">${e.qty}x</span>${e.description}</span>`
    ).join('') || '';
    
    let actions = '';
    if (job.status === 'assigned' && job.assignedVendor === CURRENT_VENDOR) {
        actions = `
            <button class="btn btn-danger" onclick="declineJob('${job.id}')">Decline</button>
            <button class="btn btn-primary" onclick="acceptJob('${job.id}')">Accept Job</button>
        `;
    } else if (job.status === 'open') {
        actions = `<button class="btn btn-secondary" onclick="claimJob('${job.id}')">Claim This Job</button>`;
    } else if (job.status === 'accepted') {
        actions = `
            <button class="btn btn-outline" onclick="openAssignWorkerModal('${job.id}')">Assign Worker</button>
            <button class="btn btn-outline" onclick="viewJobDeliveries('${job.id}')">Deliveries</button>
            <button class="btn btn-danger" onclick="closeJob('${job.id}')">Close Job</button>
        `;
    } else if (job.status === 'in-progress') {
        actions = `
            <button class="btn btn-outline" onclick="viewJobDeliveries('${job.id}')">View Deliveries</button>
            <button class="btn btn-danger" onclick="closeJob('${job.id}')">Close Job</button>
        `;
    }
    
    const cardClass = job.priority === 'urgent' || job.priority === 'emergency' ? 'job-card urgent' : 
                      job.status === 'open' ? 'job-card new' : 'job-card';
    
    return `
        <div class="${cardClass}">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.jobSiteName} ${priorityBadge}</div>
                    <div class="job-meta">
                        <span class="job-meta-item">Contract: <span style="font-family: 'Space Mono', monospace; color: var(--accent);">${job.contractNumber}</span></span>
                        <span class="job-meta-item">${formatJobType(job.jobType)}</span>
                        <span class="rental-company">${job.rentalCompany}</span>
                    </div>
                </div>
                <span class="status-badge ${job.status}">${job.status}</span>
            </div>
            
            <div class="job-details">
                <div>
                    <div class="job-detail-label">Location</div>
                    <div class="job-detail-value">${job.address.street}<br>${job.address.city}, ${job.address.state} ${job.address.zip}</div>
                </div>
                <div>
                    <div class="job-detail-label">Date & Time</div>
                    <div class="job-detail-value">${formatDate(job.dateOut)}<br>${job.timeOut || 'TBD'}</div>
                </div>
                <div>
                    <div class="job-detail-label">Contact</div>
                    <div class="job-detail-value">${job.contactName || '-'}<br>${job.contactPhone || '-'}</div>
                </div>
            </div>
            
            ${equipmentTags ? `
            <div class="job-equipment">
                <div class="job-equipment-title">Equipment</div>
                <div class="equipment-tags">${equipmentTags}</div>
            </div>
            ` : ''}
            
            ${job.instructions ? `
            <div style="margin-bottom: 16px; padding: 12px; background: rgba(255, 170, 0, 0.1); border-radius: 8px; font-size: 0.9rem;">
                <strong style="color: var(--warning);">Instructions:</strong> ${job.instructions}
            </div>
            ` : ''}
            
            ${actions ? `<div class="job-actions">${actions}</div>` : ''}
        </div>
    `;
}

// Render jobs list
function renderJobs() {
    const jobs = getFilteredJobs(currentTab);
    const container = document.getElementById('jobsContainer');
    
    if (jobs.length === 0) {
        const messages = {
            'assigned': { icon: '✓', title: 'No pending assignments', text: 'New jobs assigned to you will appear here' },
            'active': { icon: '🚚', title: 'No active jobs', text: 'Accept a job to get started' },
            'open': { icon: '📋', title: 'No open jobs available', text: 'Check back later for new opportunities' },
            'completed': { icon: '🎉', title: 'No completed jobs yet', text: 'Completed jobs will appear here' }
        };
        const msg = messages[currentTab];
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${msg.icon}</div>
                <h3>${msg.title}</h3>
                <p>${msg.text}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = jobs.map(renderJobCard).join('');
}

// Job actions
function acceptJob(jobId) {
    const jobs = getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'accepted';
        saveJobs(jobs);
        updateStats();
        renderJobs();
    }
}

function declineJob(jobId) {
    if (!confirm('Decline this job? It will become available for other vendors.')) return;
    const jobs = getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'open';
        job.assignedVendor = null;
        saveJobs(jobs);
        updateStats();
        renderJobs();
    }
}

function claimJob(jobId) {
    const jobs = getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'accepted';
        job.assignedVendor = CURRENT_VENDOR;
        saveJobs(jobs);
        updateStats();
        renderJobs();
    }
}

function closeJob(jobId) {
    if (!confirm('Close this job? This means the equipment is off-rent and no more deliveries are needed.')) return;
    
    const jobs = getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        saveJobs(jobs);
        
        // Also update field worker jobs if exists
        let fieldJobs = JSON.parse(localStorage.getItem('fieldWorkerJobs') || '[]');
        const fieldJob = fieldJobs.find(j => j.originalJobId === jobId || j.id === jobId);
        if (fieldJob) {
            fieldJob.status = 'completed';
            fieldJob.completedAt = new Date().toISOString();
            localStorage.setItem('fieldWorkerJobs', JSON.stringify(fieldJobs));
        }
        
        updateStats();
        renderJobs();
    }
}

function viewJobDeliveries(jobId) {
    const deliveries = JSON.parse(localStorage.getItem('fuelDeliveries') || '[]');
    
    // Get deliveries for this job (check both original and field worker job IDs)
    const fieldJobs = JSON.parse(localStorage.getItem('fieldWorkerJobs') || '[]');
    const fieldJob = fieldJobs.find(j => j.originalJobId === jobId);
    const fieldJobId = fieldJob ? fieldJob.id : null;
    
    const jobDeliveries = deliveries.filter(d => d.jobId === jobId || d.jobId === fieldJobId);
    
    // Calculate totals
    const totalGallons = jobDeliveries.reduce((sum, d) => sum + d.gallons, 0);
    const deliveryCount = jobDeliveries.length;
    
    let historyHtml = '';
    if (jobDeliveries.length === 0) {
        historyHtml = '<p style="color: var(--text-muted); text-align: center; padding: 30px;">No deliveries logged yet</p>';
    } else {
        historyHtml = `
            <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                <div style="flex: 1; text-align: center; padding: 16px; background: var(--bg-input); border-radius: 8px;">
                    <div style="font-family: 'Space Mono', monospace; font-size: 1.5rem; color: var(--accent);">${totalGallons.toFixed(1)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Gallons</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 16px; background: var(--bg-input); border-radius: 8px;">
                    <div style="font-family: 'Space Mono', monospace; font-size: 1.5rem; color: var(--text-primary);">${deliveryCount}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Deliveries</div>
                </div>
            </div>
        `;
        historyHtml += jobDeliveries.reverse().map(d => `
            <div style="padding: 14px; background: var(--bg-input); border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-family: 'Space Mono', monospace; color: var(--accent); font-weight: 600; font-size: 1.1rem;">${d.gallons} gal</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(d.timestamp).toLocaleDateString()} ${new Date(d.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${d.fuelType} • ${d.deliveredBy}</div>
                ${d.notes ? `<div style="font-size: 0.85rem; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); color: var(--text-secondary);">${d.notes}</div>` : ''}
            </div>
        `).join('');
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'deliveryHistoryModal';
    modal.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 500px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 1.1rem;">Delivery History</h3>
                <button onclick="document.getElementById('deliveryHistoryModal').remove()" style="background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; padding: 0 8px;">&times;</button>
            </div>
            <div style="padding: 20px 24px; overflow-y: auto;">
                ${historyHtml}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab;
        renderJobs();
    });
});

// Initial load
updateStats();
renderJobs();

// Assign worker modal
function openAssignWorkerModal(jobId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const workers = users.filter(u => u.role === 'fieldworker' && u.vendorId === CURRENT_VENDOR);
    
    const workerOptions = workers.length > 0 
        ? workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')
        : '<option value="">No field workers available</option>';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.id = 'assignModal';
    modal.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 400px; padding: 24px;">
            <h3 style="margin-bottom: 20px;">Assign to Field Worker</h3>
            <select id="workerSelect" style="width: 100%; padding: 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; margin-bottom: 20px;">
                <option value="">Select worker...</option>
                ${workerOptions}
            </select>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn btn-outline" onclick="closeAssignModal()">Cancel</button>
                <button class="btn btn-primary" onclick="assignWorker('${jobId}')">Assign</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeAssignModal() {
    const modal = document.getElementById('assignModal');
    if (modal) modal.remove();
}

function assignWorker(jobId) {
    const workerId = document.getElementById('workerSelect').value;
    if (!workerId) {
        alert('Please select a field worker');
        return;
    }
    
    const jobs = getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        job.status = 'in-progress';
        job.assignedWorker = workerId;
        saveJobs(jobs);
        
        // Also add to field worker's jobs
        let fieldJobs = JSON.parse(localStorage.getItem('fieldWorkerJobs') || '[]');
        const fieldJob = {
            ...job,
            id: 'FW-' + Date.now(),
            originalJobId: job.id,
            assignedWorker: workerId,
            status: 'assigned'
        };
        fieldJobs.push(fieldJob);
        localStorage.setItem('fieldWorkerJobs', JSON.stringify(fieldJobs));
        
        closeAssignModal();
        updateStats();
        renderJobs();
    }
}
