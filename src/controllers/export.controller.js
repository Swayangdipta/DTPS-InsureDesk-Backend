const XLSX      = require('xlsx');
const PDFDocument = require('pdfkit');
const dayjs     = require('dayjs');
const Policy    = require('../models/Policy');
const { buildPolicyFilter } = require('../utils/filterBuilder');
const { logActivity }       = require('../utils/activityLogger');

// ── Fetch policies using the same filter as the list ──────
const fetchFiltered = async (query) => {
  const filter = { ...buildPolicyFilter(query), isActive: true };
  return Policy.find(filter)
    .populate('category',    'name')
    .populate('brokerHouse', 'name')
    .populate('company',     'name')
    .sort('-createdAt')
    .lean();
};

// ── Flatten a policy document into a plain row object ─────
const toRow = (p) => ({
  'SL No':               p.serialNumber        || '',
  'Policyholder':        p.policyHolderName,
  'Category':            p.category?.name      || '',
  'Broker House':        p.brokerHouse?.name   || '',
  'Company':             p.company?.name       || '',
  'Issued Month':        p.issuedMonth         || '',
  'Issue Date':          p.policyIssueDate ? dayjs(p.policyIssueDate).format('DD/MM/YYYY') : '',
  'Paid Date':           p.paidDate        ? dayjs(p.paidDate).format('DD/MM/YYYY')        : '',
  'DOC':                 p.doc             ? dayjs(p.doc).format('DD/MM/YYYY')             : '',
  'Next Renewal':        p.nextRenewalDate ? dayjs(p.nextRenewalDate).format('DD/MM/YYYY') : '',
  'Premium (no GST)':    p.premiumWithoutGST,
  'Premium (with GST)':  p.premiumWithGST,
  'Sum Assured':         p.sumAssured,
  'PPT':                 p.premiumPayingTerm ?? '',
  'PT':                  p.policyTerm        ?? '',
  'Bond Status':         p.bondStatus,
  'Payment Status':      p.paymentStatus,
  'Payout Status':       p.payoutStatus,
  'Sys Update Status':   p.systemUpdateStatus || '',
  'Advisor':             p.advisorName        || '',
  'ADV Level 3':         p.advisorLevel3      || '',
  'ADV Level 4':         p.advisorLevel4      || '',
  'Remarks':             p.remarks            || '',
});

// ── GET /api/export/excel ─────────────────────────────────
const exportExcel = async (req, res) => {
  const policies = await fetchFiltered(req.query);
  const rows     = policies.map(toRow);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  if (rows.length) {
    ws['!cols'] = Object.keys(rows[0]).map((key) => ({
      wch: Math.min(
        40,
        Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2
      ),
    }));
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Policies');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  await logActivity({
    userId:     req.user._id,
    action:     'EXPORT',
    entityType: 'Policy',
    details:    { format: 'excel', count: policies.length },
    ip:         req.ip,
  });

  const filename = `policies_${dayjs().format('YYYY-MM-DD')}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

// ── GET /api/export/csv ───────────────────────────────────
const exportCSV = async (req, res) => {
  const policies = await fetchFiltered(req.query);

  if (!policies.length) {
    return res.status(404).json({ success: false, message: 'No data to export' });
  }

  const rows    = policies.map(toRow);
  const headers = Object.keys(rows[0]);
  const escape  = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escape).join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');

  await logActivity({
    userId:     req.user._id,
    action:     'EXPORT',
    entityType: 'Policy',
    details:    { format: 'csv', count: policies.length },
    ip:         req.ip,
  });

  const filename = `policies_${dayjs().format('YYYY-MM-DD')}.csv`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.send(csv);
};

// ── GET /api/export/pdf ───────────────────────────────────
const exportPDF = async (req, res) => {
  const policies = await fetchFiltered(req.query);
  const filename = `policies_${dayjs().format('YYYY-MM-DD')}.pdf`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  // ── Title block ───────────────────────────────────────
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Insurance Policy Report', { align: 'center' });
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#555')
    .text(
      `Generated: ${dayjs().format('DD MMM YYYY, HH:mm')}   |   Total: ${policies.length} policies`,
      { align: 'center' }
    );
  doc.moveDown(0.8);

  // ── Table config ──────────────────────────────────────
  const cols = [
    { key: 'SL No',           w: 45 },
    { key: 'Policyholder',    w: 120 },
    { key: 'Category',        w: 65 },
    { key: 'Company',         w: 95 },
    { key: 'Paid Date',       w: 65 },
    { key: 'Premium (with GST)', w: 80 },
    { key: 'Payment Status',  w: 65 },
    { key: 'Next Renewal',    w: 65 },
  ];
  const ROW_H    = 18;
  const HEADER_H = 22;
  const LEFT     = doc.page.margins.left;

  // ── Header row ────────────────────────────────────────
  let y = doc.y;
  let x = LEFT;
  doc.rect(x, y, cols.reduce((a, c) => a + c.w, 0), HEADER_H).fill('#1e40af');
  doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
  cols.forEach((col) => {
    doc.text(col.key, x + 3, y + 7, { width: col.w - 6, ellipsis: true });
    x += col.w;
  });

  doc.fillColor('#111').font('Helvetica');

  // ── Data rows ─────────────────────────────────────────
  policies.slice(0, 300).forEach((p, idx) => {
    y = doc.y + 2;
    x = LEFT;

    // New page if needed
    if (y + ROW_H > doc.page.height - doc.page.margins.bottom) {
      doc.addPage({ layout: 'landscape' });
      y = doc.page.margins.top;
    }

    const bg = idx % 2 === 0 ? '#eef2ff' : '#ffffff';
    doc.rect(x, y, cols.reduce((a, c) => a + c.w, 0), ROW_H).fill(bg);
    doc.fillColor('#111').fontSize(7);

    const rowData = toRow(p);
    cols.forEach((col) => {
      doc.text(String(rowData[col.key] ?? ''), x + 3, y + 5, {
        width:    col.w - 6,
        ellipsis: true,
      });
      x += col.w;
    });

    doc.moveDown(0.1);
  });

  doc.end();

  await logActivity({
    userId:     req.user._id,
    action:     'EXPORT',
    entityType: 'Policy',
    details:    { format: 'pdf', count: policies.length },
    ip:         req.ip,
  });
};

module.exports = { exportExcel, exportCSV, exportPDF };
