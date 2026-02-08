# Code Reference Guide - Field Worker Features

Quick snippets for developers integrating or extending these features.

---

## Offline Mode

### Initialize Offline Support
```javascript
// Auto-initialized on page load, but can be triggered manually
await initOfflineMode();

// Initialize IndexedDB only
await offlineSync.init();

// Create UI indicator
offlineIndicator.createBanner();
```

### Save Invoice Offline
```javascript
const invoiceData = {
  job_id: "uuid-123",
  worker_id: "user-456",
  worker_name: "John Doe",
  invoice_date: "2026-02-08",
  invoice_time: "14:30",
  units_data: [...],
  total_diesel: 50.5,
  total_def: 10.0,
  photos_meter_before: ["data:image/jpeg..."],
  photos_meter_after: ["data:image/jpeg..."],
  photos_equipment: ["data:image/jpeg..."],
  signature_data: "data:image/png..."
};

const invoiceId = await offlineSync.saveOfflineInvoice(invoiceData);
console.log('Saved offline with ID:', invoiceId);
```

### Check Offline Status
```javascript
const status = await offlineSync.getOfflineStatus();
console.log(status);
// Output: { hasPending: 2, pendingCount: 2, isOnline: false }

// Get all pending invoices
const pending = await offlineSync.getPendingInvoices();
pending.forEach(inv => console.log(`Pending: ${inv.offline_id}`));

// Get all invoices (synced and pending)
const all = await offlineSync.getAllOfflineInvoices();
console.log(`Total stored: ${all.length}`);
```

### Sync Pending Invoices
```javascript
// Define sync callback (how to submit each invoice)
async function submitInvoiceCallback(invoice) {
  try {
    const { data, error } = await db.from('invoices')
      .insert([invoice])
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      remoteId: data.id
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Sync all pending
const result = await offlineSync.syncPendingInvoices(submitInvoiceCallback);
console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
```

### Mark Invoice as Synced
```javascript
// After successful sync
await offlineSync.markAsSynced(
  localId,           // ID from IndexedDB
  remoteInvoiceId    // ID from Supabase
);
```

### Clean Up Old Data
```javascript
// Delete synced invoices older than 7 days
await offlineSync.deleteSyncedData(7);

// Delete all synced invoices (regardless of age)
await offlineSync.deleteSyncedData(0);
```

### Listen for Online/Offline Events
```javascript
window.addEventListener('online', async () => {
  console.log('Back online!');
  const status = await offlineSync.getOfflineStatus();
  offlineIndicator.showSyncToast(
    `Syncing ${status.pendingCount} invoices...`,
    'info'
  );
});

window.addEventListener('offline', async () => {
  console.log('Gone offline');
  const status = await offlineSync.getOfflineStatus();
  offlineIndicator.showSyncToast(
    `${status.pendingCount} invoices will sync when online`,
    'info'
  );
});
```

### Show Toast Notification
```javascript
// Success
offlineIndicator.showSyncToast(
  'Invoice saved successfully!',
  'success'
);

// Error
offlineIndicator.showSyncToast(
  'Failed to sync invoice',
  'error'
);

// Info
offlineIndicator.showSyncToast(
  'Syncing pending invoices...',
  'info'
);
```

---

## Digital Signature

### Open Signature Modal
```javascript
// Opens full-screen signature capture
openSignatureModal();

// User draws and clicks "Done"
// Signature automatically saved to global signatureData
console.log('Signature saved:', signatureData);
```

### Get Signature Data
```javascript
// After user clicks "Done" in modal
if (signatureData) {
  // Data URL (PNG base64)
  console.log(signatureData.substring(0, 50) + '...');

  // Can send to server or store locally
  const { data, error } = await db.from('invoices')
    .update({ signature_data: signatureData })
    .eq('id', invoiceId);
}
```

### Clear Signature
```javascript
// Programmatically clear
clearSignatureModal();

// Or user clicks "Clear" button in modal
// Canvas resets to white
```

### Validate Signature Required
```javascript
if (FC_FLAGS.isOn('signature')) {
  if (!signatureData) {
    showToast('Please capture a signature before submitting', 'error');
    return false;
  }
}
```

### Store Signature with Invoice
```javascript
const invoiceData = {
  job_id: "uuid-123",
  worker_id: "user-456",
  // ... other fields
  signature_data: signatureData,  // PNG data URL
  signature_timestamp: new Date().toISOString()
};

const { data, error } = await db.from('invoices')
  .insert([invoiceData])
  .select()
  .single();
```

### Display Signature Thumbnail
```javascript
// Show stored signature
const invoice = await db.from('invoices')
  .select('signature_data')
  .eq('id', invoiceId)
  .single();

if (invoice.data.signature_data) {
  const img = document.createElement('img');
  img.src = invoice.data.signature_data;
  img.style.cssText = 'max-width: 200px; border: 1px solid #333; border-radius: 8px;';
  document.body.appendChild(img);
}
```

---

## Photo Capture

### Open Photo Picker
```javascript
// Open file picker for "Meter Before" photos
openPhotoCapture('meter_before');

// Categories available:
// - 'meter_before'
// - 'meter_after'
// - 'equipment'
```

### Handle Photo Upload
```javascript
// Auto-triggered by file input
function handlePhotoCapture(event) {
  const category = event.target.dataset.category;  // 'meter_before'
  const files = Array.from(event.target.files);

  // Compress each file
  Promise.all(files.map(file => compressImage(file)))
    .then(compressedPhotos => {
      capturedPhotos[category] = [
        ...capturedPhotos[category],
        ...compressedPhotos
      ];
      renderPhotoCategories();
    });
}
```

### Compress Single Image
```javascript
// Manually compress an image file
const photo = document.getElementById('photoInput').files[0];

const compressed = await compressImage(photo);
console.log(compressed);
// Output: {
//   data: "data:image/jpeg;base64,...",
//   name: "photo.jpg",
//   size: 65432
// }

// Store in array
capturedPhotos.meter_before.push(compressed);
renderPhotoCategories();
```

### Get All Captured Photos
```javascript
// Access current captured photos
console.log('Meter Before:', capturedPhotos.meter_before.length);
console.log('Meter After:', capturedPhotos.meter_after.length);
console.log('Equipment:', capturedPhotos.equipment.length);

// Get all as flat array
const allPhotos = [
  ...capturedPhotos.meter_before,
  ...capturedPhotos.meter_after,
  ...capturedPhotos.equipment
];
console.log('Total photos:', allPhotos.length);
```

### Delete Photo
```javascript
// Remove specific photo
deletePhoto('meter_before', 0);  // Delete first photo in meter_before

// Triggers renderPhotoCategories() to update UI
```

### Validate Photos (All Required)
```javascript
if (validatePhotos()) {
  console.log('All required photos present');
  // Proceed with submission
} else {
  console.log('Missing required photo');
  showToast('Missing required photo: meter after', 'error');
}
```

### Submit with Photos
```javascript
// In your submit handler
if (FC_FLAGS.isOn('photo_invoice')) {
  if (!validatePhotos()) {
    showToast('Please capture all required photos', 'error');
    return;
  }
}

// Build invoice with photos
const invoiceData = {
  job_id: "uuid-123",
  worker_id: "user-456",
  // ... other fields
  photos_meter_before: capturedPhotos.meter_before.map(p => p.data),
  photos_meter_after: capturedPhotos.meter_after.map(p => p.data),
  photos_equipment: capturedPhotos.equipment.map(p => p.data)
};

const { data, error } = await db.from('invoices')
  .insert([invoiceData])
  .select()
  .single();

if (!error) {
  // Clear captured photos
  capturedPhotos = {
    meter_before: [],
    meter_after: [],
    equipment: []
  };
}
```

### Display Photos in History
```javascript
// When viewing submitted invoice
const invoice = await db.from('invoices')
  .select('photos_meter_before, photos_meter_after, photos_equipment')
  .eq('id', invoiceId)
  .single();

const photos = {
  before: invoice.data.photos_meter_before || [],
  after: invoice.data.photos_meter_after || [],
  equipment: invoice.data.photos_equipment || []
};

// Render thumbnails
const html = `
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
    ${photos.before.map(p => `<img src="${p}" style="width:100%;border-radius:8px;">`).join('')}
    ${photos.after.map(p => `<img src="${p}" style="width:100%;border-radius:8px;">`).join('')}
    ${photos.equipment.map(p => `<img src="${p}" style="width:100%;border-radius:8px;">`).join('')}
  </div>
`;
document.body.innerHTML += html;
```

### Expand/Preview Photo
```javascript
// Click to enlarge
function showPhotoModal(photoDataUrl) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.95);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `;

  const img = document.createElement('img');
  img.src = photoDataUrl;
  img.style.cssText = 'max-width: 90vw; max-height: 90vh; object-fit: contain;';

  modal.appendChild(img);
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
}
```

---

## Feature Flags

### Check if Feature Enabled
```javascript
// In invoice modal
if (FC_FLAGS.isOn('photo_invoice')) {
  // Show photo upload section
}

if (FC_FLAGS.isOn('signature')) {
  // Show signature capture button
}

if (FC_FLAGS.isOn('offline_mode')) {
  // Offline functionality enabled
}
```

### Initialize for Role
```javascript
// On page load
const role = currentUser.role;  // 'fieldworker'
await FC_FLAGS.init(role);

// Features loaded and cached
console.log(FC_FLAGS.isOn('photo_invoice'));  // true/false based on role
```

### Hide UI Elements Based on Flags
```javascript
// Programmatically hide elements
if (!FC_FLAGS.isOn('photo_invoice')) {
  document.getElementById('photoCategoriesContainer').style.display = 'none';
}

// Or use helper
FC_FLAGS.hide('photo_invoice', '#photoCategoriesContainer');
```

---

## Complete Submit Example

### Full Invoice Submission (All Features)
```javascript
async function submitInvoice(jobId) {
  try {
    // Validate photos
    if (FC_FLAGS.isOn('photo_invoice')) {
      if (!validatePhotos()) return;
    }

    // Validate signature
    if (FC_FLAGS.isOn('signature')) {
      if (!signatureData) {
        showToast('Please capture a signature', 'error');
        return;
      }
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    // Build invoice data
    const invoiceData = {
      job_id: jobId,
      worker_id: currentUser.id,
      worker_name: currentUser.name,
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_time: new Date().toTimeString().slice(0, 5),
      units_data: getSelectedUnits(),
      total_diesel: calculateTotalDiesel(),
      total_def: calculateTotalDef(),
      notes: document.getElementById('invoiceNotes').value,

      // Photos
      photos_meter_before: capturedPhotos.meter_before.map(p => p.data),
      photos_meter_after: capturedPhotos.meter_after.map(p => p.data),
      photos_equipment: capturedPhotos.equipment.map(p => p.data),

      // Signature
      signature_data: signatureData || null,

      // GPS
      latitude: capturedGPS?.latitude || null,
      longitude: capturedGPS?.longitude || null,
      location_accuracy: capturedGPS?.accuracy || null
    };

    // Try online first
    if (navigator.onLine) {
      const { data, error } = await db.from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;

      showToast('Invoice submitted successfully!', 'success');
    } else {
      // Fall back to offline storage
      if (typeof offlineSync !== 'undefined') {
        await offlineSync.saveOfflineInvoice(invoiceData);
        showToast('Saved offline. Will sync when online.', 'success');
      } else {
        throw new Error('Cannot submit offline without offline support');
      }
    }

    // Reset forms
    capturedPhotos = { meter_before: [], meter_after: [], equipment: [] };
    signatureData = null;
    capturedGPS = null;

    // Close modal and reload
    closeInvoiceModal();
    await loadData();

  } catch (err) {
    console.error('Submit error:', err);
    showToast('Error: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Create Invoice';
  }
}
```

---

## Debugging & Troubleshooting

### Check Offline Status
```javascript
// In browser console
navigator.onLine
// true or false

const status = await offlineSync.getOfflineStatus();
console.table(status);
```

### View Pending Invoices
```javascript
// In browser console
const pending = await offlineSync.getPendingInvoices();
console.table(pending);
```

### Clear All Offline Data
```javascript
// WARNING: Irreversible!
indexedDB.deleteDatabase('FleetConnectOffline');
location.reload();
```

### Check Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => console.log(reg));
  });

// View Service Worker details
navigator.serviceWorker.controller
```

### View Cache
```javascript
// In browser console
caches.keys()
  .then(names => {
    names.forEach(name => {
      caches.open(name).then(cache => {
        cache.keys().then(requests => {
          console.log(`Cache: ${name}`);
          requests.forEach(req => console.log('  ' + req.url));
        });
      });
    });
  });
```

### Enable Debug Logging
```javascript
// In browser console
localStorage.setItem('debug_offline', 'true');
localStorage.setItem('debug_photos', 'true');
localStorage.setItem('debug_signature', 'true');

// Check console for extra logs
// Then reload page
location.reload();
```

### Check IndexedDB
```javascript
// In browser DevTools
// Application → Storage → IndexedDB → FleetConnectOffline
// Browse pending_invoices store
// Click record to view full data
```

---

## Mobile Testing

### Test on iPhone
```
1. Open Safari
2. Go to field-worker.html
3. Long-press Home button → Add to Home Screen
4. Open as "app"
5. Enable Airplane mode
6. Test offline functionality
```

### Test Camera Access
```
1. Allow camera permission when prompted
2. Click photo button
3. Camera app should open
4. Take photo
5. Verify thumbnail appears
```

### Test Touch Events
```
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Draw signature with mouse (simulates touch)
4. Test buttons with simulated touch
```

---

## Performance Optimization

### Reduce Photo Size
```javascript
// Current compression: 80% quality
// Reduce further if needed
canvas.toDataURL('image/jpeg', 0.7);  // Lower quality

// Or resize to smaller max width
const maxWidth = 800;  // Instead of 1200
```

### Batch Sync
```javascript
// Sync 3 at a time instead of sequential
const pending = await offlineSync.getPendingInvoices();
const batches = [];

for (let i = 0; i < pending.length; i += 3) {
  batches.push(pending.slice(i, i + 3));
}

for (const batch of batches) {
  await Promise.all(batch.map(inv => submitToServer(inv)));
  await new Promise(r => setTimeout(r, 1000));  // Delay between batches
}
```

### Clear Cache Periodically
```javascript
// Run monthly cleanup
setInterval(async () => {
  await offlineSync.deleteSyncedData(30);  // 30+ days
}, 30 * 24 * 60 * 60 * 1000);
```

---

## API Integration

### Supabase Insert with All Data
```javascript
const { data: invoice, error } = await db.from('invoices')
  .insert([{
    job_id: jobId,
    worker_id: userId,
    worker_name: userName,
    invoice_date: dateString,
    invoice_time: timeString,
    units_data: unitsList,
    total_diesel: diesel,
    total_def: def,
    notes: notes,
    photos_meter_before: photosArray1,
    photos_meter_after: photosArray2,
    photos_equipment: photosArray3,
    signature_data: signatureDataUrl,
    has_incident: boolean,
    incident_photos: incidentPhotosArray,
    incident_videos: incidentVideosArray,
    latitude: lat,
    longitude: lng,
    location_accuracy: accuracy,
    created_at: new Date().toISOString()
  }])
  .select()
  .single();

if (error) {
  console.error('Database error:', error.message);
} else {
  console.log('Invoice created:', invoice.id);
}
```

---

## Notes for Future Devs

1. **Service Worker Path**: Must be at root `/fleetconnect/service-worker.js` (not in subdirectory)
2. **IndexedDB Scope**: Database is per-origin, so same across all pages on same domain
3. **Base64 Size**: Each photo ~60-80KB base64 (takes up space in IndexedDB)
4. **Touch Events**: Use `pointer` events (more universal than `touch`)
5. **Canvas DPI**: Handle devicePixelRatio if supporting high-DPI displays
6. **Signature Validation**: Currently just checks if data exists; could validate strokes/area
7. **Feature Flags**: Server-side controlled, cached for 10 minutes

---

**Last Updated:** February 8, 2026
