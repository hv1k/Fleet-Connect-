# Quick Setup Guide: Phase 2 Field Worker Features

## What's Included

Three new MEDIUM priority field worker features:

1. **Turn-by-Turn Navigation** - Green "🧭 Navigate" button with Google Maps/Apple Maps/Waze dropdown
2. **Service Checklist** - Pre/post-service checklist page (11 items total)
3. **Time Tracking** - Clock in/out with GPS geofencing and weekly analytics

All mobile-first, dark mode, 44px+ touch targets.

---

## Installation (5 Steps)

### Step 1: Database Tables

**Option A: Supabase UI**
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy all SQL from `db-migrations.sql`
4. Execute

**Option B: Manual** (if tables already exist, skip)
- `service_checklists` table must exist
- `time_entries` table must exist
- See `db-migrations.sql` for schema

### Step 2: Deploy HTML Files

Copy to your server:
```
/service-checklist.html      ← NEW
/time-tracking.html          ← NEW
/field-worker.html           ← UPDATED (already exists)
```

### Step 3: Verify Updated field-worker.html

Check that field-worker.html contains:

**New sidebar nav item:**
```html
<a class="nav-item" href="time-tracking.html">
    <svg>...</svg>Time Tracking
</a>
```

**New CSS for nav menu:**
```css
.nav-menu { ... }
.nav-menu-item { ... }
```

**New functions at end of script:**
```javascript
function toggleNavMenu(button) { ... }
function openNavApp(app, encodedAddress, jobId) { ... }
function openChecklist(jobId) { ... }
```

**Updated job-actions rendering:**
```html
<button class="btn btn-navigate" onclick="toggleNavMenu(this)">🧭 Navigate</button>
<button class="btn btn-outline" onclick="openChecklist('${job.id}')">📋 Checklist</button>
```

### Step 4: Enable Feature Flags

In admin dashboard or via API, ensure these flags are enabled for `fieldworker` role:

```json
{
    "navigation": true,
    "service_checklist": true,
    "time_tracking": true
}
```

If flags don't exist, create them. Default should be `enabled: true`.

### Step 5: Test on Mobile

1. **Open field-worker.html** on mobile device
2. **Test Navigation:**
   - Tap "🧭 Navigate" on any job with address
   - Select "Google Maps" / "Apple Maps" / "Waze"
   - Should open navigation app
3. **Test Checklist:**
   - Tap "📋 Checklist" on any job
   - Check all 11 items
   - Submit checklist
   - Should return to job list
4. **Test Time Tracking:**
   - Tap "Time Tracking" in sidebar
   - Tap green "START" button
   - Should prompt for GPS permission
   - Timer should start counting
   - Tap red "STOP" button to end session
   - Should appear in today's list

---

## Minimal Verification Checklist

- [ ] `service_checklists` table exists in Supabase
- [ ] `time_entries` table exists in Supabase
- [ ] Both HTML files deployed
- [ ] field-worker.html updated with new buttons/nav
- [ ] Feature flags enabled (`navigation`, `service_checklist`, `time_tracking`)
- [ ] Green Navigate button visible on job cards
- [ ] Checklist button visible on job cards
- [ ] Time Tracking link visible in sidebar
- [ ] Navigation opens correct app
- [ ] Checklist saves to database
- [ ] Time entries save to database

---

## File Sizes & Performance

| File | Size | Load Time |
|------|------|-----------|
| service-checklist.html | ~12 KB | <100ms |
| time-tracking.html | ~18 KB | <100ms |
| field-worker.html | +2 KB (delta) | unchanged |

All use vanilla JavaScript (no new dependencies).

---

## Database Schema at a Glance

**service_checklists:**
- Stores completed checklists
- Indexed by job_id, worker_id, created_at
- JSON fields for state and timestamps

**time_entries:**
- Stores clock in/out records
- Indexed by worker_id, job_id, created_at
- GPS coordinates stored (latitude/longitude)

---

## Feature Access Control

All features respect:
- **checkAuth(['fieldworker'])** - Redirects to login if not authenticated
- **FC_FLAGS.init('fieldworker')** - Loads feature flags for role
- **Feature flag checks** - Navigation/checklist/time-tracking can be toggled off per role

---

## Browser Permissions Required

**iOS Safari:**
- Geolocation permission prompt (for time-tracking GPS)
- No other permissions needed

**Android Chrome:**
- Geolocation permission prompt (for time-tracking GPS)
- No other permissions needed

**Desktop (Testing Only):**
- Geolocation will use computer location (usually inaccurate)
- Suggested: Test on actual mobile device

---

## Troubleshooting

### Issue: "Navigation" button not appearing
→ Check `FC_FLAGS.isOn('navigation')` returns true
→ Verify job has address (street and city)

### Issue: "Checklist" button not appearing
→ Check `FC_FLAGS.isOn('service_checklist')` returns true

### Issue: Time Tracking link not in sidebar
→ Check `FC_FLAGS.isOn('time_tracking')` returns true
→ Refresh page (Ctrl+F5)

### Issue: Checklist won't save
→ Check `service_checklists` table exists in Supabase
→ Verify all 11 items are checked
→ Check browser console for errors

### Issue: Time entries not saving
→ Check `time_entries` table exists in Supabase
→ Verify GPS permissions granted
→ Check browser console for errors

### Issue: GPS not working
→ Verify geolocation permission granted
→ Check for "Position Unavailable" error in console
→ Test on actual device (not desktop simulator)

---

## Rollback

To remove these features:

1. **Hide from UI:**
   - Set feature flags to `false`:
     - `navigation: false`
     - `service_checklist: false`
     - `time_tracking: false`

2. **Remove HTML files (optional):**
   - Delete `service-checklist.html`
   - Delete `time-tracking.html`
   - Revert `field-worker.html` to previous version

3. **Keep database (optional):**
   - Tables can remain for historical data
   - Or drop them if no longer needed:
     ```sql
     DROP TABLE IF EXISTS service_checklists;
     DROP TABLE IF EXISTS time_entries;
     ```

---

## Support

For issues:
1. Check browser console (F12) for errors
2. Check Supabase logs for database errors
3. Test on different browser/device
4. Review `PHASE2_FEATURES.md` for detailed documentation
5. Contact development team

---

## Next Steps

After deployment:

- Monitor audit logs for usage
- Collect feedback from field workers
- Adjust geofencing radius (currently 500m) if needed
- Consider offline sync for time entries
- Plan Phase 3 features

---

**Estimated Setup Time:** 15-20 minutes
**Deployment Date:** [Your Date]
**Tested On:** iOS Safari, Android Chrome, Desktop Chrome/Edge
