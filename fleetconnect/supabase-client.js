// Supabase Configuration for FleetConnect
const SUPABASE_URL = 'https://ojqoxdsibiutpfhtvyyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcW94ZHNpYml1dHBmaHR2eXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMDgzODEsImV4cCI6MjA4NDg4NDM4MX0.GgpdgFyJBVtkAKmp2ZJIoEd5xO5EwA2itnfST-ig1ck';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ USER FUNCTIONS ============

async function loginUser(email, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
    
    if (error || !data) {
        return { success: false, error: 'Invalid email or password' };
    }
    
    // Store in localStorage for session
    localStorage.setItem('currentUser', JSON.stringify(data));
    return { success: true, user: data };
}

async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data;
}

async function createUser(userData) {
    const { data, error } = await supabase
        .from('users')
        .insert([{
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
            company: userData.company,
            vendor_id: userData.vendor_id || null
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating user:', error);
        return { success: false, error: error.message };
    }
    return { success: true, user: data };
}

async function updateUser(userId, userData) {
    const { data, error } = await supabase
        .from('users')
        .update({
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: userData.role,
            company: userData.company,
            vendor_id: userData.vendor_id || null
        })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating user:', error);
        return { success: false, error: error.message };
    }
    return { success: true, user: data };
}

async function deleteUser(userId) {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    
    if (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}

// ============ VENDOR FUNCTIONS ============

async function getAllVendors() {
    const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Error fetching vendors:', error);
        return [];
    }
    return data;
}

async function createVendor(vendorData) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
        .from('jobs')
        .select(`
            *,
            equipment (*),
            assigned_vendor_details:vendors(id, name, company)
        `)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
    return data;
}

async function getJobsByStatus(statuses) {
    const { data, error } = await supabase
        .from('jobs')
        .select(`
            *,
            equipment (*)
        `)
        .in('status', statuses)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching jobs:', error);
        return [];
    }
    return data;
}

async function getJobsByVendor(vendorId) {
    const { data, error } = await supabase
        .from('jobs')
        .select(`
            *,
            equipment (*)
        `)
        .eq('assigned_vendor', vendorId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching vendor jobs:', error);
        return [];
    }
    return data;
}

async function getJobsByWorker(workerId) {
    const { data, error } = await supabase
        .from('jobs')
        .select(`
            *,
            equipment (*)
        `)
        .eq('assigned_worker', workerId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching worker jobs:', error);
        return [];
    }
    return data;
}

async function createJob(jobData, equipmentList) {
    // Insert job
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([{
            contract_number: jobData.contractNumber,
            po_number: jobData.poNumber,
            job_number: jobData.jobNumber,
            order_id: jobData.orderId,
            job_site_name: jobData.jobSiteName,
            address_street: jobData.address?.street,
            address_city: jobData.address?.city,
            address_state: jobData.address?.state,
            address_zip: jobData.address?.zip,
            customer_name: jobData.customerName,
            customer_number: jobData.customerNumber,
            vendor_number: jobData.vendorNumber,
            payment_terms: jobData.paymentTerms,
            contact_name: jobData.contactName,
            contact_phone: jobData.contactPhone,
            rental_company: jobData.rentalCompany,
            salesman: jobData.salesman,
            date_out: jobData.dateOut,
            time_out: jobData.timeOut,
            est_return: jobData.estReturn,
            time_return: jobData.timeReturn,
            job_type: jobData.jobType,
            priority: jobData.priority,
            instructions: jobData.instructions,
            status: jobData.status || 'pending',
            assigned_vendor: jobData.assignedVendor,
            allow_open_if_declined: jobData.allowOpenIfDeclined,
            created_by: jobData.createdBy
        }])
        .select()
        .single();
    
    if (jobError) {
        console.error('Error creating job:', jobError);
        return { success: false, error: jobError.message };
    }
    
    // Insert equipment
    if (equipmentList && equipmentList.length > 0) {
        const equipmentData = equipmentList.map(eq => ({
            job_id: job.id,
            quantity: parseInt(eq.qty) || 1,
            equipment_number: eq.equipNum,
            description: eq.description
        }));
        
        const { error: eqError } = await supabase
            .from('equipment')
            .insert(equipmentData);
        
        if (eqError) {
            console.error('Error adding equipment:', eqError);
        }
    }
    
    return { success: true, job: job };
}

async function updateJobStatus(jobId, status, additionalData = {}) {
    const updateData = { status, ...additionalData };
    
    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('job_id', jobId)
        .order('timestamp', { ascending: false });
    
    if (error) {
        console.error('Error fetching deliveries:', error);
        return [];
    }
    return data;
}

async function getAllDeliveries() {
    const { data, error } = await supabase
        .from('deliveries')
        .select(`
            *,
            job:jobs(id, job_site_name, contract_number)
        `)
        .order('timestamp', { ascending: false });
    
    if (error) {
        console.error('Error fetching all deliveries:', error);
        return [];
    }
    return data;
}

async function createDelivery(deliveryData) {
    const { data, error } = await supabase
        .from('deliveries')
        .insert([{
            job_id: deliveryData.jobId,
            gallons: deliveryData.gallons,
            fuel_type: deliveryData.fuelType,
            notes: deliveryData.notes,
            delivered_by: deliveryData.deliveredById,
            delivered_by_name: deliveryData.deliveredByName
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating delivery:', error);
        return { success: false, error: error.message };
    }
    return { success: true, delivery: data };
}

// ============ HELPER FUNCTIONS ============

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function checkAuth(allowedRoles = null) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// Format helpers
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
