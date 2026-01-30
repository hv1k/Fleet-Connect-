export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
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
                max_tokens: 1024,
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
                            text: `Analyze this rental/equipment invoice and extract the following information. Return ONLY a JSON object with these exact fields (use empty string if not found):

{
  "contractNumber": "the contract number",
  "poNumber": "the PO or purchase order number", 
  "jobSiteName": "the job site name or project name",
  "addressStreet": "the JOB SITE street address (not the rental company address)",
  "addressCity": "the JOB SITE city",
  "addressState": "the JOB SITE state (2 letter code)",
  "addressZip": "the JOB SITE zip code",
  "contactName": "the contact person name (often 'Ordered By')",
  "contactPhone": "the job site contact phone number",
  "equipment": [{"unitNumber": "equipment/unit number", "description": "equipment description"}]
}

Important: Extract the JOB SITE/DELIVERY address, NOT the rental company's store address. Look for fields labeled "Job Site", "Job Loc", "Deliver To", or similar.`
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
