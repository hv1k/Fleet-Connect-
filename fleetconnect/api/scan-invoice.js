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
                            text: `Analyze this document image. First, determine the document type:
- If it says "POWER PLUS" or "FIELD WORK TICKET" → it is a Power Plus Field Ticket
- If it says "SUNBELT RENTALS" or looks like a rental/equipment invoice → it is a Sunbelt Rental Invoice
- Otherwise → treat as a generic work order document

Return ONLY a JSON object. Use empty string "" for fields not found.

ALWAYS include these base fields:
{
  "documentType": "powerplus" or "sunbelt" or "other",
  "jobSiteName": "job/project name",
  "addressStreet": "job site street address",
  "addressCity": "city",
  "addressState": "state (2 letter code)",
  "addressZip": "zip code",
  "customerName": "customer/company name",
  "customerNumber": "customer account number",
  "contractNumber": "contract number or Contract ID",
  "poNumber": "P.O. number",
  "contactName": "contact person name",
  "contactPhone": "contact phone number",
  "dateOut": "scheduled/start date in YYYY-MM-DD format",
  "equipment": [{ "qty": 1, "unitNumber": "unit/equipment number", "description": "description" }]
}

IF documentType is "sunbelt", ALSO include:
{
  "orderId": "Order ID number",
  "jobNumber": "Job Number",
  "cNumber": "C# value (usually a phone number)",
  "jNumber": "J# value (usually a phone number)",
  "vendorNumber": "Vendor # in customer box",
  "rentalCompany": "rental company name and PC#",
  "salesman": "salesman name and ID",
  "timeOut": "time out in HH:MM 24hr format",
  "estReturn": "estimated return date YYYY-MM-DD",
  "timeReturn": "return time in HH:MM 24hr format"
}

IF documentType is "powerplus", ALSO include:
{
  "fieldTicketId": "Field Ticket ID number (top of form)",
  "unitId": "Unit ID (e.g. A0147)",
  "ticketType": "Ticket Type (e.g. SWAP, SERVICE, DELIVERY)",
  "area": "Area code (e.g. SAN, LA)",
  "ticketStatus": "Status (e.g. TENTATIVE, CONFIRMED)",
  "workPerformed": ["array of checked work types, e.g. Fuel Delivery, Swap, Service, Hour Check, Mechanic Inspection, etc."],
  "oldGenHour": "Old Gen Hour reading",
  "newGenId": "New Gen ID",
  "newGenHour": "New Gen Hour reading",
  "fuelGallons": "fuel gallons delivered",
  "defGallons": "DEF gallons delivered",
  "oil": "oil amount",
  "fuelFilter": "fuel filter info",
  "oilFilter": "oil filter info",
  "racorFilter": "racor filter info",
  "coolantFilter": "coolant filter info",
  "airFilterOuter": "air filter outer info",
  "airFilterInner": "air filter inner info",
  "otherBillableServices": "other billable services text",
  "genType": "Generator Type (e.g. 400 KVA GENERATOR)",
  "tankCapacity": "Tank Capacity number",
  "lastServiceDate": "Last Service Date in YYYY-MM-DD format",
  "lastServiceHour": "Last Service Hour reading",
  "unitDimensions": "Unit dimensions",
  "unitNotes": "Unit Notes text",
  "fuelFilterParts": "fuel filter part numbers",
  "oilFilterParts": "oil filter part numbers",
  "airFilterParts": "air filter part numbers",
  "racorFilterParts": "racor filter part numbers",
  "coolantFilterParts": "coolant filter part numbers",
  "beltPart": "belt part number",
  "otherPart": "other part numbers",
  "mechanicalNotes": "Mechanical Notes text (tires, battery, etc.)",
  "technicianName": "Technician Name"
}

IMPORTANT:
- For Power Plus tickets: Customer is top-left, Job/location is below it, ticket info (type, date, PO, area) is top-right.
- The Unit ID appears in both the header AND the ticket type box.
- Work Performed has checkboxes — only include the ones that are checked/marked.
- Generator Information is in a box near the bottom with Gen Type, Tank Capacity, filter counts and part numbers.
- Extract ALL part numbers from the generator information section and mechanical notes.
- Convert dates to YYYY-MM-DD format.
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
