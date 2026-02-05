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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }
    
    try {
        const { image, mediaType } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
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
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType || 'image/jpeg',
                                data: image
                            }
                        },
                        {
                            type: 'text',
                            text: `Analyze this rental/equipment invoice and extract ALL information. Return ONLY a JSON object with these exact fields (use empty string "" if not found):

{
  "jobSiteName": "the job site name/project name (look for 'Job Site:' label in top-left box)",
  "addressStreet": "the JOB SITE street address (NOT the rental company store address)",
  "addressCity": "the JOB SITE city",
  "addressState": "the JOB SITE state (2 letter code)",
  "addressZip": "the JOB SITE zip code",
  "orderId": "the Order ID number (look for 'ORDER ID #' in the job site box)",
  "jobNumber": "the Job Number (look for 'Job No.' in the contract box)",
  "cNumber": "the C# value (look for 'C#:' in the job site box - this is usually a phone number)",
  "jNumber": "the J# value (look for 'J#:' after C# - this is usually a phone number)",
  "customerName": "the customer/company name (look for 'Customer:' box - e.g. SOUTHERN CALIFORNIA EDISON)",
  "customerNumber": "the customer account number (look for number next to 'Customer:' label)",
  "vendorNumber": "the vendor number (look for 'VENDOR #' in customer box)",
  "contractNumber": "the contract number (look for 'Contract #.' in top-right box)",
  "poNumber": "the P.O. number (look for 'P.O. #' in the contract box)",
  "contactName": "the person who ordered (look for 'Ordered By..' field)",
  "contactPhone": "the contact phone number (from C# field or job site box)",
  "rentalCompany": "the rental company name and PC# (e.g. 'SUNBELT RENTALS PC# 1388')",
  "salesman": "the salesman name and ID (look for 'Salesman:' field)",
  "dateOut": "the date out in YYYY-MM-DD format (look for 'Date out....' field)",
  "timeOut": "the time out in HH:MM format 24hr (look for time next to date out)",
  "estReturn": "the estimated return date in YYYY-MM-DD format (look for 'Est return.' field)",
  "timeReturn": "the return time in HH:MM format 24hr (look for time next to est return)",
  "equipment": [
    {
      "qty": 1,
      "unitNumber": "equipment/unit number (the number like 0090030)",
      "description": "equipment description (like 20KW DIESEL GENERATOR)"
    }
  ]
}

IMPORTANT NOTES:
- Extract the JOB SITE/DELIVERY address, NOT the rental company's store address.
- For Sunbelt Rentals invoices: the job site info is in the top-left box, customer info is in the left-middle box, and contract/schedule info is in the top-right box.
- The C# and J# fields are usually phone numbers found in the job site box after the address.
- Equipment is listed with QTY, an equipment number, and a description. Extract ALL equipment items.
- Convert dates to YYYY-MM-DD format (e.g. 12/30/25 becomes 2025-12-30).
- Convert times to 24hr HH:MM format (e.g. 7:00 AM becomes 07:00).
- Return ONLY the JSON object, no markdown, no explanation.`
                        }
                    ]
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ error: errorData.error?.message || 'API request failed' });
        }
        
        const data = await response.json();
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
