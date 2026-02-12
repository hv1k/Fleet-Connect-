import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALLOWED_ORIGINS = [
    'https://fleet-connect-three.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

function getCorsOrigin(req) {
    const origin = req.headers?.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (origin.endsWith('.vercel.app')) return origin;
    return ALLOWED_ORIGINS[0];
}

// Email template generators
function generateJobAssignedEmail(jobSiteName, recipientName, details) {
    const { jobId, assignedAt, estimatedHours, location } = details;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background-color: #0f172a;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                padding: 24px;
                text-align: center;
                color: white;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 32px 24px;
                color: #e2e8f0;
            }
            .greeting {
                margin-bottom: 20px;
                font-size: 16px;
            }
            .job-title {
                font-size: 20px;
                font-weight: 600;
                color: #60a5fa;
                margin: 20px 0;
            }
            .details {
                background-color: #0f172a;
                border-left: 3px solid #60a5fa;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .detail-item {
                display: flex;
                margin: 10px 0;
                font-size: 14px;
            }
            .detail-label {
                font-weight: 600;
                color: #94a3b8;
                min-width: 120px;
            }
            .detail-value {
                color: #e2e8f0;
            }
            .cta-button {
                display: inline-block;
                background-color: #60a5fa;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 24px;
                transition: background-color 0.2s;
            }
            .cta-button:hover {
                background-color: #3b82f6;
            }
            .footer {
                background-color: #0f172a;
                padding: 16px 24px;
                border-top: 1px solid #334155;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }
            .logo {
                font-weight: 700;
                color: #60a5fa;
                font-size: 18px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FleetConnect</div>
                <h1>New Job Assigned</h1>
            </div>
            <div class="content">
                <div class="greeting">Hi ${recipientName},</div>
                <p>A new work order has been assigned to you.</p>
                <div class="job-title">${jobSiteName}</div>
                <div class="details">
                    <div class="detail-item">
                        <div class="detail-label">Job ID:</div>
                        <div class="detail-value">${jobId}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Location:</div>
                        <div class="detail-value">${location || 'Not specified'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Estimated Hours:</div>
                        <div class="detail-value">${estimatedHours || 'TBD'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Assigned:</div>
                        <div class="detail-value">${assignedAt ? new Date(assignedAt).toLocaleString() : 'Just now'}</div>
                    </div>
                </div>
                <p>Please log in to FleetConnect to review the full job details and start working on this assignment.</p>
                <a href="https://fleet-connect-three.vercel.app/jobs" class="cta-button">View Job</a>
            </div>
            <div class="footer">
                <p>&copy; 2026 FleetConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateStatusChangedEmail(jobSiteName, recipientName, details) {
    const { jobId, oldStatus, newStatus, changedAt, reason } = details;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background-color: #0f172a;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                padding: 24px;
                text-align: center;
                color: white;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 32px 24px;
                color: #e2e8f0;
            }
            .greeting {
                margin-bottom: 20px;
                font-size: 16px;
            }
            .job-title {
                font-size: 20px;
                font-weight: 600;
                color: #60a5fa;
                margin: 20px 0;
            }
            .status-change {
                background-color: #0f172a;
                border-left: 3px solid #60a5fa;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .status-row {
                display: flex;
                align-items: center;
                margin: 12px 0;
                font-size: 14px;
            }
            .status-label {
                font-weight: 600;
                color: #94a3b8;
                min-width: 100px;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 4px;
                font-weight: 600;
                font-size: 13px;
            }
            .status-badge.old {
                background-color: rgba(239, 68, 68, 0.2);
                color: #fca5a5;
            }
            .status-badge.new {
                background-color: rgba(34, 197, 94, 0.2);
                color: #86efac;
            }
            .arrow {
                margin: 0 8px;
                color: #64748b;
            }
            .details {
                background-color: #0f172a;
                border-left: 3px solid #60a5fa;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .detail-item {
                display: flex;
                margin: 10px 0;
                font-size: 14px;
            }
            .detail-label {
                font-weight: 600;
                color: #94a3b8;
                min-width: 100px;
            }
            .detail-value {
                color: #e2e8f0;
            }
            .cta-button {
                display: inline-block;
                background-color: #60a5fa;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 24px;
                transition: background-color 0.2s;
            }
            .cta-button:hover {
                background-color: #3b82f6;
            }
            .footer {
                background-color: #0f172a;
                padding: 16px 24px;
                border-top: 1px solid #334155;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }
            .logo {
                font-weight: 700;
                color: #60a5fa;
                font-size: 18px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FleetConnect</div>
                <h1>Job Status Updated</h1>
            </div>
            <div class="content">
                <div class="greeting">Hi ${recipientName},</div>
                <p>The status of a work order has been updated.</p>
                <div class="job-title">${jobSiteName}</div>
                <div class="status-change">
                    <div class="status-row">
                        <div class="status-label">Status Change:</div>
                        <div>
                            <span class="status-badge old">${oldStatus || 'Unknown'}</span>
                            <span class="arrow">→</span>
                            <span class="status-badge new">${newStatus || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                <div class="details">
                    <div class="detail-item">
                        <div class="detail-label">Job ID:</div>
                        <div class="detail-value">${jobId}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Changed:</div>
                        <div class="detail-value">${changedAt ? new Date(changedAt).toLocaleString() : 'Just now'}</div>
                    </div>
                    ${reason ? `
                    <div class="detail-item">
                        <div class="detail-label">Reason:</div>
                        <div class="detail-value">${reason}</div>
                    </div>
                    ` : ''}
                </div>
                <p>Log in to FleetConnect to see the latest job updates.</p>
                <a href="https://fleet-connect-three.vercel.app/jobs" class="cta-button">View Job</a>
            </div>
            <div class="footer">
                <p>&copy; 2026 FleetConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateInvoiceSubmittedEmail(jobSiteName, recipientName, details) {
    const { invoiceId, jobId, amount, submittedAt, workerName } = details;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background-color: #0f172a;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                padding: 24px;
                text-align: center;
                color: white;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 32px 24px;
                color: #e2e8f0;
            }
            .greeting {
                margin-bottom: 20px;
                font-size: 16px;
            }
            .job-title {
                font-size: 20px;
                font-weight: 600;
                color: #60a5fa;
                margin: 20px 0;
            }
            .invoice-summary {
                background-color: #0f172a;
                border-left: 3px solid #60a5fa;
                padding: 16px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .amount {
                font-size: 24px;
                font-weight: 700;
                color: #86efac;
                margin: 12px 0;
            }
            .detail-item {
                display: flex;
                margin: 10px 0;
                font-size: 14px;
            }
            .detail-label {
                font-weight: 600;
                color: #94a3b8;
                min-width: 120px;
            }
            .detail-value {
                color: #e2e8f0;
            }
            .cta-button {
                display: inline-block;
                background-color: #60a5fa;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 24px;
                transition: background-color 0.2s;
            }
            .cta-button:hover {
                background-color: #3b82f6;
            }
            .footer {
                background-color: #0f172a;
                padding: 16px 24px;
                border-top: 1px solid #334155;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }
            .logo {
                font-weight: 700;
                color: #60a5fa;
                font-size: 18px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">FleetConnect</div>
                <h1>Invoice Submitted</h1>
            </div>
            <div class="content">
                <div class="greeting">Hi ${recipientName},</div>
                <p>A new invoice has been submitted.</p>
                <div class="job-title">${jobSiteName}</div>
                <div class="invoice-summary">
                    <div class="detail-item">
                        <div class="detail-label">Invoice ID:</div>
                        <div class="detail-value">${invoiceId}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Job ID:</div>
                        <div class="detail-value">${jobId}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted By:</div>
                        <div class="detail-value">${workerName || 'A field worker'}</div>
                    </div>
                    <div class="amount">${amount ? `$${parseFloat(amount).toFixed(2)}` : 'Amount pending'}</div>
                    <div class="detail-item">
                        <div class="detail-label">Date:</div>
                        <div class="detail-value">${submittedAt ? new Date(submittedAt).toLocaleString() : 'Just now'}</div>
                    </div>
                </div>
                <p>Please review and process this invoice through FleetConnect.</p>
                <a href="https://fleet-connect-three.vercel.app/invoices" class="cta-button">Review Invoice</a>
            </div>
            <div class="footer">
                <p>&copy; 2026 FleetConnect. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

async function sendViaResend(email, subject, html) {
    if (!RESEND_API_KEY) {
        console.log('[Email] RESEND_API_KEY not configured. Email would be sent to:', email);
        console.log('[Email] Subject:', subject);
        return { success: true, fallback: true };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'notifications@fleetconnect.com',
                to: email,
                subject: subject,
                html: html
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Email] Resend API error:', errorData);
            return { success: false, error: errorData.message || 'Failed to send email' };
        }

        const data = await response.json();
        console.log('[Email] Successfully sent via Resend:', data.id);
        return { success: true, messageId: data.id };
    } catch (err) {
        console.error('[Email] Error sending via Resend:', err.message);
        return { success: false, error: err.message };
    }
}

export default async function handler(req, res) {
    const origin = getCorsOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, jobId, recipientEmail, recipientName, details } = req.body;

        // Validate required fields
        if (!type || !jobId || !recipientEmail || !recipientName || !details) {
            return res.status(400).json({
                error: 'Missing required fields: type, jobId, recipientEmail, recipientName, details'
            });
        }

        // Validate notification type
        const validTypes = ['job_assigned', 'status_changed', 'invoice_submitted'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        let subject, html;
        const jobSiteName = details.jobSiteName || 'Job';

        // Generate email based on type
        if (type === 'job_assigned') {
            subject = `New Job Assigned: ${jobSiteName}`;
            html = generateJobAssignedEmail(jobSiteName, recipientName, details);
        } else if (type === 'status_changed') {
            subject = `Job Status Updated: ${jobSiteName}`;
            html = generateStatusChangedEmail(jobSiteName, recipientName, details);
        } else if (type === 'invoice_submitted') {
            subject = `New Invoice Submitted: ${jobSiteName}`;
            html = generateInvoiceSubmittedEmail(jobSiteName, recipientName, details);
        }

        // Send email via Resend
        const emailResult = await sendViaResend(recipientEmail, subject, html);

        if (!emailResult.success) {
            console.error('[Email] Failed to send notification:', emailResult.error);
            return res.status(500).json({
                error: 'Failed to send notification email',
                details: emailResult.error
            });
        }

        // Log notification in database (optional, for audit trail)
        try {
            const { error: logError } = await supabase
                .from('email_notifications')
                .insert([{
                    type,
                    job_id: jobId,
                    recipient_email: recipientEmail,
                    recipient_name: recipientName,
                    subject,
                    status: emailResult.fallback ? 'logged' : 'sent',
                    message_id: emailResult.messageId || null,
                    created_at: new Date().toISOString()
                }]);

            if (logError) {
                console.warn('[Email] Warning: Could not log notification:', logError.message);
                // Don't fail the response if logging fails
            }
        } catch (err) {
            console.warn('[Email] Warning: Could not log notification:', err.message);
            // Don't fail the response if logging fails
        }

        return res.status(200).json({
            success: true,
            message: emailResult.fallback
                ? 'Notification logged (email service not configured)'
                : 'Notification sent successfully',
            type,
            recipientEmail,
            jobId,
            messageId: emailResult.messageId || null
        });
    } catch (err) {
        console.error('[Email] Unexpected error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
}
