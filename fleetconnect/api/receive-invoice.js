import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

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


// Rate limiting
const RATE_WINDOW_MS = 60000;
const MAX_REQUESTS = 30;
const _rlAttempts = new Map();

function _getRateKey(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
}

function _isRateLimited(key) {
    const now = Date.now();
    const entry = _rlAttempts.get(key);
    if (!entry) return false;
    if (now - entry.first > RATE_WINDOW_MS) { _rlAttempts.delete(key); return false; }
    return entry.count >= MAX_REQUESTS;
}

function _recordRequest(key) {
    const now = Date.now();
    const entry = _rlAttempts.get(key);
    if (!entry || now - entry.first > RATE_WINDOW_MS) { _rlAttempts.set(key, { count: 1, first: now }); return; }
    entry.count += 1;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limit check
    const _rk = _getRateKey(req);
    if (_isRateLimited(_rk)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    _recordRequest(_rk);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    // Simple API key check
    const authKey = req.headers['authorization'];
    if (authKey !== `Bearer ${process.env.INVOICE_WEBHOOK_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const { pdf_base64, pdf_filename, email_from, email_subject, email_date } = req.body;
        
        if (!pdf_base64) {
            return res.status(400).json({ error: 'No PDF data provided' });
        }
        
        console.log(`Processing invoice from: ${email_from}, subject: ${email_subject}`);
        
        // Step 1: Send PDF to Claude API to extract invoice data
        const invoiceData = await parseInvoiceWithClaude(pdf_base64);
        
        if (!invoiceData) {
            return res.status(500).json({ error: 'Failed to parse invoice' });
        }
        
        console.log('Extracted invoice data:', JSON.stringify(invoiceData));
        
        // Step 2: Try to match with completed jobs
        const matchResult = await matchToJob(invoiceData);
        
        // Step 3: Store in Supabase
        const { data: savedInvoice, error: saveError } = await supabase
            .from('qb_invoices')
            .insert([{
                invoice_number: invoiceData.invoiceNumber || null,
                invoice_date: invoiceData.invoiceDate || null,
                due_date: invoiceData.dueDate || null,
                vendor_name: invoiceData.vendorName || null,
                vendor_email: email_from || null,
                customer_name: invoiceData.customerName || null,
                ship_to_name: invoiceData.shipToName || null,
                ship_to_address: invoiceData.shipToAddress || null,
                ship_to_city: invoiceData.shipToCity || null,
                ship_to_state: invoiceData.shipToState || null,
                ship_to_zip: invoiceData.shipToZip || null,
                fuel_type: invoiceData.fuelType || null,
                total_gallons: invoiceData.totalGallons || null,
                diesel_gallons: invoiceData.dieselGallons || null,
                def_gallons: invoiceData.defGallons || null,
                rate: invoiceData.rate || null,
                subtotal: invoiceData.subtotal || null,
                tax: invoiceData.tax || null,
                delivery_fee: invoiceData.deliveryFee || null,
                total_amount: invoiceData.totalAmount || null,
                balance_due: invoiceData.balanceDue || null,
                payment_terms: invoiceData.paymentTerms || null,
                line_items: invoiceData.lineItems || null,
                matched_job_id: matchResult.jobId || null,
                match_confidence: matchResult.confidence || null,
                match_status: matchResult.jobId ? (matchResult.confidence === 'high' ? 'matched' : 'pending_review') : 'unmatched',
                pdf_base64: pdf_base64,
                pdf_filename: pdf_filename || 'invoice.pdf',
                email_from: email_from || null,
                email_subject: email_subject || null,
                email_received_at: email_date || new Date().toISOString()
            }])
            .select()
            .single();
        
        if (saveError) {
            console.error('Error saving invoice:', saveError);
            return res.status(500).json({ error: 'Failed to save invoice', details: saveError.message });
        }
        
        console.log(`Invoice saved: ${savedInvoice.id}, match status: ${savedInvoice.match_status}`);
        
        return res.status(200).json({
            success: true,
            invoice_id: savedInvoice.id,
            match_status: savedInvoice.match_status,
            matched_job_id: savedInvoice.matched_job_id,
            match_confidence: savedInvoice.match_confidence
        });
        
    } catch (error) {
        console.error('Error processing invoice:', error);
        return res.status(500).json({ error: error.message });
    }
}

// Parse invoice PDF using Claude API
async function parseInvoiceWithClaude(pdfBase64) {
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
        throw new Error('CLAUDE_API_KEY not configured');
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'document',
                        source: {
                            type: 'base64',
                            media_type: 'application/pdf',
                            data: pdfBase64
                        }
                    },
                    {
                        type: 'text',
                        text: `Analyze this fuel delivery invoice and extract data. Return ONLY a JSON object with these fields (use null if not found):

{
    "invoiceNumber": "invoice number",
    "invoiceDate": "YYYY-MM-DD format",
    "dueDate": "YYYY-MM-DD format",
    "vendorName": "the company that sent/created the invoice (the FROM company)",
    "customerName": "the BILL TO company name",
    "shipToName": "the SHIP TO company/site name",
    "shipToAddress": "SHIP TO street address",
    "shipToCity": "SHIP TO city",
    "shipToState": "SHIP TO state (2 letter)",
    "shipToZip": "SHIP TO zip code",
    "fuelType": "diesel, DEF, or both",
    "totalGallons": total gallons as number,
    "dieselGallons": diesel gallons as number,
    "defGallons": DEF gallons as number,
    "rate": rate per gallon as number,
    "subtotal": subtotal as number,
    "tax": tax amount as number,
    "deliveryFee": delivery fee as number,
    "totalAmount": total amount as number,
    "balanceDue": balance due as number,
    "paymentTerms": "payment terms like NET 15",
    "lineItems": [
        {
            "service": "service/product name",
            "description": "description including unit numbers",
            "rate": rate as number,
            "quantity": quantity as number,
            "amount": amount as number
        }
    ],
    "unitNumbers": ["list of unit/equipment numbers found"],
    "unitDetails": [
        {
            "unitNumber": "unit ID",
            "dieselGallons": gallons as number,
            "defStatus": "FULL or gallons",
            "hours": hours as number
        }
    ]
}

Important: Extract ALL unit numbers and their individual fuel data from the description fields.`
                    }
                ]
            }]
        })
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Claude API error: ${err.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const text = data.content[0].text;
    
    // Parse JSON from response (handle markdown code blocks)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

// Match invoice to a completed job
async function matchToJob(invoiceData) {
    try {
        // Get completed jobs (and in-progress for flexibility)
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .in('status', ['completed', 'in-progress'])
            .order('completed_at', { ascending: false });
        
        if (error || !jobs || jobs.length === 0) {
            return { jobId: null, confidence: null };
        }
        
        let bestMatch = null;
        let bestScore = 0;
        
        for (const job of jobs) {
            let score = 0;
            
            // Address matching (strongest signal)
            if (invoiceData.shipToAddress && job.address_street) {
                const invoiceAddr = normalizeAddress(invoiceData.shipToAddress);
                const jobAddr = normalizeAddress(job.address_street);
                if (invoiceAddr === jobAddr) {
                    score += 40;
                } else if (fuzzyMatch(invoiceAddr, jobAddr) > 0.6) {
                    score += 25;
                }
            }
            
            // City matching
            if (invoiceData.shipToCity && job.address_city) {
                if (invoiceData.shipToCity.toLowerCase() === job.address_city.toLowerCase()) {
                    score += 15;
                }
            }
            
            // Zip matching
            if (invoiceData.shipToZip && job.address_zip) {
                if (invoiceData.shipToZip === job.address_zip) {
                    score += 10;
                }
            }
            
            // Customer name matching
            if (invoiceData.shipToName && job.job_site_name) {
                const invoiceCust = invoiceData.shipToName.toLowerCase();
                const jobCust = job.job_site_name.toLowerCase();
                if (invoiceCust.includes(jobCust) || jobCust.includes(invoiceCust)) {
                    score += 20;
                } else if (fuzzyMatch(invoiceCust, jobCust) > 0.5) {
                    score += 10;
                }
            }
            
            // Also check customer_name field
            if (invoiceData.customerName && job.customer_name) {
                const invoiceCust = invoiceData.customerName.toLowerCase();
                const jobCust = job.customer_name.toLowerCase();
                if (invoiceCust.includes(jobCust) || jobCust.includes(invoiceCust)) {
                    score += 15;
                }
            }
            
            // Date matching - invoice date should be near job dates
            if (invoiceData.invoiceDate && job.date_out) {
                const invDate = new Date(invoiceData.invoiceDate);
                const jobDate = new Date(job.date_out);
                const daysDiff = Math.abs((invDate - jobDate) / (1000 * 60 * 60 * 24));
                if (daysDiff <= 3) score += 15;
                else if (daysDiff <= 7) score += 10;
                else if (daysDiff <= 14) score += 5;
            }
            
            // Check if already has an invoice matched
            const { data: existingInvoice } = await supabase
                .from('qb_invoices')
                .select('id')
                .eq('matched_job_id', job.id)
                .eq('match_status', 'matched')
                .limit(1);
            
            if (existingInvoice && existingInvoice.length > 0) {
                score -= 50; // Penalize already-matched jobs
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = job;
            }
        }
        
        if (bestMatch && bestScore >= 50) {
            return {
                jobId: bestMatch.id,
                confidence: bestScore >= 70 ? 'high' : bestScore >= 50 ? 'medium' : 'low'
            };
        }
        
        return { jobId: null, confidence: null };
        
    } catch (err) {
        console.error('Error matching job:', err);
        return { jobId: null, confidence: null };
    }
}

// Normalize address for comparison
function normalizeAddress(addr) {
    return addr.toLowerCase()
        .replace(/\./g, '')
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\bstreet\b/g, 'st')
        .replace(/\bavenue\b/g, 'ave')
        .replace(/\bboulevard\b/g, 'blvd')
        .replace(/\bdrive\b/g, 'dr')
        .replace(/\broad\b/g, 'rd')
        .replace(/\blane\b/g, 'ln')
        .replace(/\bcourt\b/g, 'ct')
        .replace(/\bplace\b/g, 'pl')
        .trim();
}

// Simple fuzzy match (Jaccard similarity on words)
function fuzzyMatch(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}
