# FleetConnect Field Worker Features Documentation

## Overview
Three HIGH priority field worker features have been implemented for mobile-first, offline-capable invoice and delivery management:

1. **Offline Mode** - Service Worker + IndexedDB caching
2. **Digital Signature Enhancement** - Full-screen modal with touch support
3. **Photo-Invoice Capture** - Required meter/gauge photos before submission

All features are MOBILE-FIRST optimized with touch-friendly buttons (min 44px) and dark mode styling.

---

## FEATURE 1: Offline Mode

### Files Created
- `/fleetconnect/service-worker.js` - Service Worker for caching and offline support
- `/fleetconnect/offline-sync.js` - IndexedDB wrapper and offline sync logic

### Architecture

#### Service Worker (`service-worker.js`)
- **Install**: Caches app shell (field-worker.html, JS/CSS, fonts, Supabase CDN)
- **Fetch**: Network-first strategy with cache fallback
- **Background Sync**: Registers 'sync-invoices' tag for offline queue sync
- **Scope**: Root level `/fleetconnect/` for global page coverage

#### Offline Sync (`offline-sync.js`)

**Main Classes:**

1. **`OfflineSync`**
   - `init()` - Initialize IndexedDB database
   - `saveOfflineInvoice(invoiceData)` - Store pending invoice to local DB
   - `getPendingInvoices()` - Get all unsynced invoices
   - `syncPendingInvoices(submitCallback)` - Bulk sync when online
   - `markAsSynced(localId, remoteInvoiceId)` - Mark as synced
   - `deleteSyncedData(daysOld)` - Cleanup old records (default 7 days)
   - `getOfflineStatus()` - Get pending count and online status

2. **`OfflineIndicator`**
   - Creates sticky banner at top of page
   - Shows: "🟢 Online" (green) or "🟠 Offline • X pending" (orange)
   - Auto-updates when online/offline status changes
   - Shows sync toast notifications

### Usage

#### In field-worker.html
```javascript
// Service worker auto-registered on page load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

// offline-sync.js auto-initializes on page load via DOMContentLoaded
// Indicators and listeners set up automatically
```

#### When Creating Invoice
```javascript
// If offline, automatically saves to IndexedDB instead of Supabase
if (!navigator.onLine && typeof offlineSync !== 'undefined') {
  await offlineSync.saveOfflineInvoice(invoiceData);
  showToast('Invoice saved offline. Will sync when online.', 'success');
}
```

#### When Coming Back Online
- Banner updates from orange to green
- Toast shows: "Back online! Syncing pending invoices..."
- Background sync automatically triggered
- Pending invoices synced one by one

### Data Storage
**IndexedDB Schema:**
```javascript
Database: FleetConnectOffline
Store: pending_invoices
Keys:
  - id (auto-increment)
  - synced (boolean, indexed)
  - timestamp (indexed)
  - job_id (indexed)
  - offline_id (unique identifier)
  - synced_at (ISO timestamp when synced)
  - remote_invoice_id (from Supabase)
```

### Feature Flags
Uses feature flag system - controlled via admin dashboard:
- Key: `offline_mode` (default: enabled for fieldworker role)

---

## FEATURE 2: Digital Signature Enhancement

### Files Modified
- `/fleetconnect/field-worker.html` - Added signature modal and UI

### Architecture

#### Full-Screen Signature Modal
- Opens in modal overlay (fixed position, z-index: 2000)
- Canvas fills available screen space (responsive)
- White background for clear signature display

#### Drawing Features
- **Touch Support**: Full pointer/touch event handling
- **Mouse Support**: Fallback for desktop testing
- **Line Smoothing**: Round line caps and joins
- **Variable Width**: 2.5px stroke width for visibility
- **Responsive**: Canvas adapts to container size

#### UI Flow
1. User clicks "✍️ Capture Signature" button in invoice modal
2. Full-screen modal opens with blank canvas
3. User draws signature (touch or mouse)
4. "Clear" button resets canvas
5. "Done" button saves signature to data URL (PNG)
6. Signature thumbnail shows in preview
7. Validation: Blocks submission if signature required but missing

#### Signature Storage
```javascript
// Stored as PNG data URL (base64)
signature_data: "data:image/png;base64,iVBORw0KGgo..."

// Saved with invoice record
{
  job_id: "uuid",
  signature_data: "data:image/png;base64,...",
  signature_timestamp: "2026-02-08T14:30:00Z"
}
```

### Implementation
```javascript
// Functions
openSignatureModal()           // Opens full-screen modal
initSignatureModal()           // Setup canvas and listeners
sigModalStart/Move/End()       // Drawing event handlers
clearSignatureModal()          // Reset canvas to white
saveSignatureModal()           // Save and close
closeSignatureModal()          // Clean up and remove modal

// Global state
enhancedSignatureData  // PNG data URL
signatureData          // Alias for Supabase storage

// Validation
if (FC_FLAGS.isOn('signature') && !signatureData) {
  showToast('Please capture a signature before submitting', 'error');
  return;
}
```

### Feature Flags
- Key: `signature` (default: enabled for fieldworker role)

---

## FEATURE 3: Photo-Invoice Capture

### Files Created/Modified
- `/fleetconnect/field-worker.html` - Integrated photo capture UI
- `/fleetconnect/photo-invoice.html` - Dedicated photo invoice page (alternative)

### Architecture

#### Photo Categories (Required)
1. **Meter Before** - Reading before service
2. **Meter After** - Reading after service
3. **Equipment Photo** - General equipment/site photo

All three categories marked with red asterisk (*) = required

#### Photo Capture Flow
1. User clicks category button (📸 Meter Before, etc.)
2. Camera app opens (native: `capture="environment"`)
3. Fallback to file picker if camera unavailable
4. Photo automatically compressed before storage
5. Thumbnail grid shows captured photos (2-3 columns on mobile)
6. Delete button (×) on each thumbnail
7. Submit blocked if required photo missing

#### Image Compression
```javascript
// Compression Pipeline
1. Read file as Data URL
2. Create Image element
3. Resize to max 1200px width (maintain aspect ratio)
4. Draw to Canvas
5. Compress to JPEG 80% quality
6. Return base64 data URL

Result: ~60-80KB per photo (vs 2-4MB original on mobile)
```

#### Photo Storage
```javascript
invoiceData = {
  photos_meter_before: ["data:image/jpeg;base64,...", ...],
  photos_meter_after: ["data:image/jpeg;base64,...", ...],
  photos_equipment: ["data:image/jpeg;base64,...", ...],
  ...other fields
}
```

#### UI Components

**Camera Button Group** (mobile-optimized)
```
┌─────────────────────────┐
│ 📸 Meter Before         │
├─────────────────────────┤
│ 📸 Meter After          │
├─────────────────────────┤
│ 📸 Equipment            │
└─────────────────────────┘
```

**Photo Grid** (responsive)
- Desktop: 3 columns
- Mobile: 2 columns
- Each thumbnail: 1:1 aspect ratio
- Delete button overlaid in top-right

### Implementation

#### In field-worker.html (Invoice Modal)
```javascript
// Photo data structure
capturedPhotos = {
  meter_before: [],
  meter_after: [],
  equipment: []
}

// Core functions
openPhotoCapture(category)      // Open file picker
handlePhotoCapture(event)       // Process files
compressImage(file)             // Compress to base64
renderPhotoCategories()         // Update UI grid
deletePhoto(category, index)    // Remove photo
validatePhotos()                // Block submit if missing

// Enhanced submitInvoice()
// - Validates all required photos present
// - Compresses photos before upload
// - Stores in invoice_data as base64
// - Saves offline if no connection
```

#### Alternative: Dedicated Page (`photo-invoice.html`)
```
- Full-page dedicated to photo capture only
- Lighter interface, no other fields
- Good for quick photo-only submissions
- Includes optional notes field
- Cancel/Submit buttons at bottom
```

### Validation
```javascript
// Before invoice submission
function validatePhotos() {
  const required = ['meter_before', 'meter_after', 'equipment'];
  for (const cat of required) {
    if (!capturedPhotos[cat] || capturedPhotos[cat].length === 0) {
      showToast(`Missing required photo: ${cat.replace('_', ' ')}`, 'error');
      return false;
    }
  }
  return true;
}
```

### Feature Flags
- Key: `photo_invoice` (default: enabled for fieldworker role)

---

## Mobile Optimization Details

### Touch-Friendly Sizing
- **Camera Buttons**: 16px padding (44px+ min height ✓)
- **Delete Buttons**: 24px × 24px circles (adequate target)
- **Photo Thumbnails**: Large click area with delete overlay

### Responsive Layout
```css
/* Desktop: 3-column photo grid */
@media (min-width: 769px) {
  .photo-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Mobile: 2-column photo grid */
@media (max-width: 768px) {
  .photo-grid { grid-template-columns: repeat(2, 1fr); }
}
```

### Camera Integration
- Uses `input type="file" capture="environment"`
- Triggers native camera app on mobile
- Falls back to file picker on desktop
- Respects browser camera permissions

### Performance
- **Image Compression**: 60-80KB per photo (base64)
- **IndexedDB Storage**: Unlimited (browser-dependent, typically 50MB+)
- **Service Worker Caching**: ~5MB app shell
- **Lazy Loading**: Photos loaded on demand in modal

---

## Integration Points

### Service Worker Registration
```javascript
// In field-worker.html page load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('SW registered'))
    .catch(err => console.warn('SW failed:', err));
}
```

### Offline Sync Initialization
```javascript
// In offline-sync.js (auto-init on DOMContentLoaded)
async function initOfflineMode() {
  await offlineSync.init();              // IndexedDB init
  offlineIndicator.createBanner();       // UI banner
  setupOnlineListeners();                // Event listeners
}
```

### Feature Flag Checks
```javascript
// Photo invoice feature
if (FC_FLAGS.isOn('photo_invoice')) {
  // Render photo upload section
}

// Signature capture
if (FC_FLAGS.isOn('signature')) {
  // Render signature modal button
}

// Offline mode (implicit, always on)
// Service worker handles automatically
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✓ | ✓ | ✓ (iOS 16+) | ✓ |
| IndexedDB | ✓ | ✓ | ✓ | ✓ |
| Canvas Drawing | ✓ | ✓ | ✓ | ✓ |
| File Capture | ✓ | ✓ | ✓ | ✓ |
| Background Sync | ✓ | ✓ | ✗ | ✓ |

---

## Testing Checklist

### Offline Mode
- [ ] Load page, go offline, verify banner shows orange
- [ ] Create invoice offline, verify saves to IndexedDB
- [ ] Go online, verify banner shows green and auto-syncs
- [ ] Check DevTools Application > IndexedDB for records
- [ ] Verify synced invoices marked with timestamp

### Digital Signature
- [ ] Click "Capture Signature" button
- [ ] Draw signature on canvas (touch and mouse)
- [ ] Click "Clear" - canvas resets
- [ ] Draw again, click "Done" - thumbnail appears
- [ ] Submit invoice without signature - verify error toast
- [ ] Submit with signature - verify stored in DB

### Photo Invoice
- [ ] Click "📸 Meter Before" button
- [ ] Native camera opens (on mobile)
- [ ] Take photo, thumbnail appears in grid
- [ ] Click × to delete photo
- [ ] Attempt submit with missing photos - verify error
- [ ] Capture all 3 photos, submit - verify success

---

## Data Flow Diagrams

### Offline Invoice Submission
```
User Creates Invoice (Offline)
  ↓
validatePhotos() ✓
  ↓
compressPhotos() → base64
  ↓
offlineSync.saveOfflineInvoice()
  ↓
IndexedDB Store (pending_invoices)
  ↓
[User comes online]
  ↓
offlineSync.syncPendingInvoices()
  ↓
db.from('invoices').insert()
  ↓
Supabase (remote)
  ↓
markAsSynced() + Toast notification
```

### Photo Compression Flow
```
Camera Photo (2-4MB)
  ↓
FileReader.readAsDataURL()
  ↓
Image Element (decode)
  ↓
Canvas (resize to 1200px width)
  ↓
canvas.toDataURL('image/jpeg', 0.8)
  ↓
Base64 String (~60-80KB)
  ↓
Store in invoiceData.photos_meter_before[]
```

---

## Feature Flag Configuration

Admin can control feature availability per role:

```json
{
  "fieldworker": {
    "offline_mode": true,
    "signature": true,
    "photo_invoice": true,
    "navigation": true,
    "invoice_creation": true
  }
}
```

To disable a feature, admin sets `false` in dashboard. Pages check `FC_FLAGS.isOn(key)` before rendering.

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Background Sync**: Not fully supported in Safari (iOS)
2. **Photo Metadata**: EXIF data stripped during compression
3. **Offline Editing**: Cannot edit submitted invoices while offline
4. **Storage Quota**: Limited to browser quota (~50MB typical)

### Future Enhancements
1. **Signature Templates**: Pre-drawn signature for quick signing
2. **OCR Photo Recognition**: Auto-read meter values from photos
3. **Batch Offline Sync**: Sync multiple invoices with progress bar
4. **Photo Filters**: Brightness/contrast adjustment pre-compression
5. **Voice Notes**: Audio memo attachment to invoices
6. **Geofencing**: Auto-capture GPS with photo metadata

---

## Support & Debugging

### Enable Debug Logging
```javascript
// In browser console
localStorage.setItem('debug_offline', 'true');
localStorage.setItem('debug_photos', 'true');

// Check logs in DevTools Console
[OfflineMode] Initialized successfully
[OfflineSync] Invoice saved: 123
[ServiceWorker] Caching app shell
```

### Check Offline Storage
```javascript
// In DevTools Console
await offlineSync.getOfflineStatus()
// Returns: { hasPending: 2, pendingCount: 2, isOnline: false }

await offlineSync.getPendingInvoices()
// Returns: [{ id: 1, synced: false, ... }, ...]
```

### Clear All Offline Data
```javascript
// WARNING: Deletes all pending invoices!
const req = indexedDB.deleteDatabase('FleetConnectOffline');
req.onsuccess = () => console.log('DB deleted');
```

---

## Files Summary

| File | Purpose | Size |
|------|---------|------|
| `service-worker.js` | Service Worker, caching strategy | ~3KB |
| `offline-sync.js` | IndexedDB wrapper, UI indicators | ~12KB |
| `field-worker.html` | Main field worker page (enhanced) | ~50KB |
| `photo-invoice.html` | Dedicated photo capture page | ~8KB |
| `FIELD_WORKER_FEATURES.md` | This documentation | ~10KB |

---

## Quick Start

1. **No setup needed** - Features auto-initialize on page load
2. **Feature flags** controlled by admin dashboard
3. **Offline automatically works** - Service Worker registered on load
4. **Photo capture** - Click button, take photo, done
5. **Signature** - Click "Capture Signature", draw, done

All three features integrated into existing field-worker.html workflow.
