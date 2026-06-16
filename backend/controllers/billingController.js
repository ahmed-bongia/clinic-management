const { successResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

const MOCK_INVOICES = [
  {
    id: 'inv-3',
    invoice_number: 'INV-#003',
    patient_name: 'Robert Johnson',
    details: 'Neurological consult + blood work',
    items: 'Glucose Comprehensive Blood Lab ($100), Neurologist consult ($120)',
    total_amount: 220.00,
    status: 'Paid',
    due_date: '2026-06-05'
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-#002',
    patient_name: 'Alice Smith',
    details: 'Pediatric Wellness Visit',
    items: 'General Consultation ($95)',
    total_amount: 95.00,
    status: 'Paid',
    due_date: '2026-06-10'
  },
  {
    id: 'inv-1',
    invoice_number: 'INV-#001',
    patient_name: 'John Doe',
    details: 'Cardiology Consultation & ECG Report',
    items: 'ECG Scan ($75), Professional Consultation ($75)',
    total_amount: 150.00,
    status: 'Paid',
    due_date: '2026-06-15'
  }
];

/**
 * Get all invoices
 */
const getAllInvoices = async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('invoices').select('*');
      if (!error && data && data.length > 0) {
        return successResponse(res, 'Invoices retrieved from database', data);
      }
    }
    return successResponse(res, 'Invoices retrieved (demo mode)', MOCK_INVOICES);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInvoices
};
