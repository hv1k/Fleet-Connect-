// Supabase Configuration for FleetConnect
const SUPABASE_URL = 'https://ojqoxdsibiutpfhtvyyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcW94ZHNpYml1dHBmaHR2eXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDgzODEsImV4cCI6MjA4NDg4NDM4MX0.GgpdgFyJBVtkAKmp2ZJIoEd5xO5EwA2itnfST-ig1ck';

// Initialize Supabase client
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ AUTH TOKEN MANAGEMENT ============

const REMEMBER_KEY = 'fc_remember';

function isRemembered() {
    return localStorage.getItem(REMEMBER_KEY) === 'true';
}

function setRemembered(remember) {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
}

function getAuthToken() {
    return sessionStorage.getItem('fc_token') || localStorage.getItem('fc_token');
}

function setAuthToken(token) {
    if (isRemembered()) {
        localStorage.setItem('fc_token', token);
        sessionStorage.removeItem('fc_token');
    } else {
        sessionStorage.setItem('fc_token', token);
        localStorage.removeItem('fc_token');
    }
}

function setCurrentUser(user) {
    if (isRemembered()) {
        localStorage.setItem('fc_user', JSON.stringify(user));
        sessionStorage.removeItem('fc_user');
    } else {
        sessionStorage.setItem('fc_user', JSON.stringify(user));
        localStorage.removeItem('fc_user');
    }
}

function clearAuth() {
    sessionStorage.removeItem('fc_token');
    sessionStorage.removeItem('fc_user');
    localStorage.removeItem('fc_token');
    localStorage.removeItem('fc_user');
}

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return (payload.exp * 1000) < Date.now();
    } catch {
        return true;
    }
}

// ============ INPUT SANITIZATION ============

function sanitizeInput(str) {
    if (!str) return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Global safe() helper — sanitizes any value for safe HTML display
// This is defined globally so all pages can use it without scoping issues
function safe(v) {
    return sanitizeInput(v == null ? '' : String(v));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    if (!phone) return true; // optional field
    return /^[\d\s\-\(\)\+\.]{7,20}$/.test(phone);
}

function validateZip(zip) {
    if (!zip) return true; // optional field
    return /^\d{5}(-\d{4})?$/.test(zip);
}

// ============ USER FUNCTIONS (Server-Side Auth) ============

async function loginUser(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Invalid email or password' };
        }

        // Store token and user data (no password)
        setAuthToken(data.token);
        setCurrentUser(data.user);

        return { success: true, user: data.user };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function demoLogin(role) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demo: true, demoRole: role })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Demo login failed' };
        }

        setAuthToken(data.token);
        setCurrentUser(data.user);

        return { success: true, user: data.user };
    } catch (err) {
        console.error('Demo login error:', err);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function getAllUsers() {
    const { data, error } = await db
        .from('users')
        .select('id, email, name, role, company, vendor_id, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data || [];
}

async function createUser(userData) {
    const token = getAuthToken();
    try {
        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Failed to create user' };
        }

        return { success: true, user: data.user };
    } catch (err) {
        console.error('Create user error:', err);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function updateUser(userId, userData) {
    const token = getAuthToken();
    try {
        const response = await fetch('/api/update-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId, ...userData })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Failed to update user' };
        }

        return { success: true, user: data.user };
    } catch (err) {
        console.error('Update user error:', err);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function deleteUser(userId) {
    const token = getAuthToken();
    try {
        const response = await fetch('/api/delete-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            return { success: false, error: data.error || 'Failed to delete user' };
        }
        return { success: true };
    } catch (err) {
        console.error('Delete user error:', err);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// ============ VENDOR FUNCTIONS ============

async function getAllVendors() {
    const { data, error } = await db
        .from('vendors')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching vendors:', error);
        return [];
    }
    return data || [];
}

async function createVendor(vendorData) {
    const { data, error } = await db
        .from('vendors')
        .insert([vendorData])
        .select()
        .single();

    if (error) {
        console.error('Error creating vendor:', error);
        return { success: false, error: error.message };
    }
    return { success: true, vendor: data };
}

// ============ JOB FUNCTIONS ============

async function getAllJobs() {
    const { data, error } = await db
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
    return data || [];
}

// Role-filtered job fetching
async function getJobsForCurrentUser() {
    const user = getCurrentUser();
    if (!user) return [];

    switch (user.role) {
        case 'admin':
            return await getAllJobs();
        case 'vendor':
            // Get jobs assigned to this vendor
            let myJobs = [];
            if (user.vendor_id) {
                myJobs = await getJobsByVendor(user.vendor_id);
            }
            // Also get unassigned jobs (available job pool)
            const { data: unassignedJobs } = await db
                .from('jobs')
                .select('*')
                .is('assigned_vendor', null)
                .in('status', ['pending', 'open'])
                .order('created_at', { ascending: false });
            // Merge without duplicates
            const seenIds = new Set(myJobs.map(j => j.id));
            const merged = [...myJobs];
            (unassignedJobs || []).forEach(j => { if (!seenIds.has(j.id)) merged.push(j); });
            return merged;
        case 'rental':
            const allRentalJobs = await getAllJobs();
            return allRentalJobs.filter(j => {
                // Show jobs where rental_company matches user's company
                const companyMatch = j.rental_company && user.company &&
                    j.rental_company.toLowerCase().includes(user.company.toLowerCase());
                // Also show jobs created by this user (e.g. Power Plus jobs they scanned)
                const createdByMe = j.created_by && j.created_by === user.id;
                return companyMatch || createdByMe;
            });
        case 'fieldworker':
            return await getJobsByWorker(user.id);
        default:
            return [];
    }
}

async function getJobsByStatus(statuses) {
    const { data, error } = await db
        .from('jobs')
        .select('*')
        .in('status', statuses)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
    return data || [];
}

async function getJobsByVendor(vendorId) {
    const { data, error } = await db
        .from('jobs')
        .select('*')
        .eq('assigned_vendor', vendorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching vendor jobs:', error);
        return [];
    }
    return data || [];
}

async function getJobsByWorker(workerId) {
    const { data, error } = await db
        .from('jobs')
        .select('*')
        .eq('assigned_worker', workerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching worker jobs:', error);
        return [];
    }
    return data || [];
}

async function createJob(jobData, equipmentList) {
    const { data: job, error: jobError } = await db
        .from('jobs')
        .insert([{
            contract_number: sanitizeInput(jobData.contractNumber),
            po_number: sanitizeInput(jobData.poNumber),
            job_number: sanitizeInput(jobData.jobNumber),
            order_id: sanitizeInput(jobData.orderId),
            job_site_name: sanitizeInput(jobData.jobSiteName),
            address_street: sanitizeInput(jobData.address?.street),
            address_city: sanitizeInput(jobData.address?.city),
            address_state: sanitizeInput(jobData.address?.state),
            address_zip: sanitizeInput(jobData.address?.zip),
            customer_name: sanitizeInput(jobData.customerName),
            customer_number: sanitizeInput(jobData.customerNumber),
            vendor_number: sanitizeInput(jobData.vendorNumber),
            payment_terms: sanitizeInput(jobData.paymentTerms),
            contact_name: sanitizeInput(jobData.contactName),
            contact_phone: sanitizeInput(jobData.contactPhone),
            rental_company: sanitizeInput(jobData.rentalCompany),
            salesman: sanitizeInput(jobData.salesman),
            date_out: jobData.dateOut || null,
            time_out: jobData.timeOut || null,
            est_return: jobData.estReturn || null,
            time_return: jobData.timeReturn || null,
            job_type: jobData.jobType,
            priority: jobData.priority,
            instructions: sanitizeInput(jobData.instructions),
            status: jobData.status || 'pending',
            assigned_vendor: jobData.assignedVendor || null,
            allow_open_if_declined: jobData.allowOpenIfDeclined,
            created_by: jobData.createdBy || null,
            invoice_image: jobData.invoiceImage || null,
            document_source: jobData.documentSource || null,
            field_ticket_id: jobData.fieldTicketId || null,
            ticket_type: jobData.ticketType || null,
            area: jobData.area || null,
            ticket_status: jobData.ticketStatus || null,
            work_performed: jobData.workPerformed || null,
            technician_name: jobData.technicianName || null,
            old_gen_hour: jobData.oldGenHour || null,
            new_gen_id: jobData.newGenId || null,
            new_gen_hour: jobData.newGenHour || null,
            generator_info: jobData.generatorInfo || null,
            billable_services: jobData.billableServices || null
        }])
        .select()
        .single();

    if (jobError) {
        console.error('Error creating job:', jobError);
        return { success: false, error: jobError.message };
    }

    if (equipmentList && equipmentList.length > 0) {
        const equipmentData = equipmentList.map(eq => ({
            job_id: job.id,
            quantity: parseInt(eq.qty) || 1,
            equipment_number: sanitizeInput(eq.equipNum),
            description: sanitizeInput(eq.description)
        }));

        await db.from('equipment').insert(equipmentData);
    }

    return { success: true, job: job };
}

async function updateJob(jobId, updates) {
    const { data, error } = await db
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

    if (error) {
        console.error('Error updating job:', error);
        return { success: false, error: error.message };
    }
    return { success: true, job: data };
}

async function updateJobStatus(jobId, status, additionalData = {}) {
    const updateData = { status, ...additionalData };

    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await db
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single();

    if (error) {
        console.error('Error updating job:', error);
        return { success: false, error: error.message };
    }
    return { success: true, job: data };
}

async function assignWorkerToJob(jobId, workerId) {
    const { data, error } = await db
        .from('jobs')
        .update({
            assigned_worker: workerId,
            status: 'in-progress'
        })
        .eq('id', jobId)
        .select()
        .single();

    if (error) {
        console.error('Error assigning worker:', error);
        return { success: false, error: error.message };
    }
    return { success: true, job: data };
}

// ============ DELIVERY FUNCTIONS ============

async function getDeliveriesForJob(jobId) {
    const { data, error } = await db
        .from('deliveries')
        .select('*')
        .eq('job_id', jobId)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching deliveries:', error);
        return [];
    }
    return data || [];
}

async function getAllDeliveries() {
    const { data, error } = await db
        .from('deliveries')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching all deliveries:', error);
        return [];
    }
    return data || [];
}

// Role-filtered delivery fetching
async function getDeliveriesForCurrentUser() {
    const user = getCurrentUser();
    if (!user) return [];

    if (user.role === 'admin') {
        return await getAllDeliveries();
    }

    // Get jobs for this user first, then get deliveries for those jobs
    const jobs = await getJobsForCurrentUser();
    const jobIds = jobs.map(j => j.id);

    if (jobIds.length === 0) return [];

    const { data, error } = await db
        .from('deliveries')
        .select('*')
        .in('job_id', jobIds)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching deliveries:', error);
        return [];
    }
    return data || [];
}

async function createDelivery(deliveryData) {
    const { data, error } = await db
        .from('deliveries')
        .insert([{
            job_id: deliveryData.jobId,
            gallons: deliveryData.gallons,
            fuel_type: deliveryData.fuelType,
            notes: sanitizeInput(deliveryData.notes),
            delivered_by: deliveryData.deliveredById || null,
            delivered_by_name: sanitizeInput(deliveryData.deliveredByName),
            latitude: deliveryData.latitude || null,
            longitude: deliveryData.longitude || null,
            location_accuracy: deliveryData.locationAccuracy || null
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating delivery:', error);
        return { success: false, error: error.message };
    }
    return { success: true, delivery: data };
}

async function createDeliveryWithIncident(deliveryData) {
    const { data, error } = await db
        .from('deliveries')
        .insert([{
            job_id: deliveryData.jobId,
            gallons: deliveryData.gallons,
            fuel_type: deliveryData.fuelType || 'diesel',
            notes: sanitizeInput(deliveryData.notes),
            delivered_by: deliveryData.deliveredById || null,
            delivered_by_name: sanitizeInput(deliveryData.deliveredByName),
            has_incident: deliveryData.hasIncident || false,
            incident_description: sanitizeInput(deliveryData.incidentDescription) || null,
            incident_photos: deliveryData.incidentPhotos || [],
            incident_videos: deliveryData.incidentVideos || [],
            unit_id: deliveryData.unitId || null,
            unit_number: sanitizeInput(deliveryData.unitNumber) || null,
            unit_hours: deliveryData.unitHours || null,
            def_gallons: deliveryData.defGallons || null,
            latitude: deliveryData.latitude || null,
            longitude: deliveryData.longitude || null,
            location_accuracy: deliveryData.locationAccuracy || null,
            timestamp: deliveryData.timestamp || new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating delivery:', error);
        return { success: false, error: error.message };
    }
    return { success: true, delivery: data };
}

// ============ INVOICE FUNCTIONS ============

async function getAllWorkerInvoices() {
    const { data, error } = await db
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
    return data || [];
}

// ============ HELPER FUNCTIONS ============

function getCurrentUser() {
    const token = getAuthToken();
    if (!token || isTokenExpired(token)) {
        clearAuth();
        return null;
    }
    const user = sessionStorage.getItem('fc_user') || localStorage.getItem('fc_user');
    return user ? JSON.parse(user) : null;
}

function getDashboardUrl(role) {
    const dashboards = {
        admin: 'admin-dashboard.html',
        vendor: 'vendor-dashboard.html',
        rental: 'rental-dashboard.html',
        fieldworker: 'field-worker.html'
    };
    return dashboards[role] || 'login.html';
}

function logout() {
    clearAuth();
    window.location.href = 'login.html';
}

function checkAuth(allowedRoles = null) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        window.location.href = getDashboardUrl(user.role);
        return null;
    }
    return user;
}

function formatJobType(type) {
    const types = {
        'fuel-delivery': 'Fuel Delivery',
        'equipment-tow': 'Equipment Tow',
        'emergency-fuel': 'Emergency Fuel',
        'pickup': 'Pickup',
        'delivery': 'Delivery',
        'swap': 'Swap',
        'service': 'Service',
        'mechanic-inspection': 'Mechanic Inspection',
        'mechanic-repair': 'Mechanic Repair',
        'hour-check': 'Hour Check',
        'emergency-response': 'Emergency Response',
        'unit-removal': 'Unit Removal',
        'on-site-relocation': 'On-Site Relocation'
    };
    return types[type] || type || '-';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
}

// ============ AUDIT LOGGING ============

async function logAudit(action, targetType, targetId, details) {
    const token = getAuthToken();
    if (!token) return;

    try {
        await fetch('/api/audit-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action, targetType, targetId, details })
        });
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

async function getAuditLogs(limit = 50) {
    const token = getAuthToken();
    if (!token) return [];

    try {
        const response = await fetch(`/api/audit-log?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.logs || [];
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        return [];
    }
}
