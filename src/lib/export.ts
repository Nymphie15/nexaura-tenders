/**
 * Export Utilities
 * CSV, Excel (via CSV), and PDF export functions
 */

// ============================================
// Types
// ============================================

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: unknown) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
}

// ============================================
// CSV Export
// ============================================

export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data } = options;

  // Build header row
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Build data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
      // Escape quotes and wrap in quotes
      return `"${formatted.replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Combine
  const csvContent = [headers, ...rows].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, `${filename}.csv`);
}

// ============================================
// Excel Export (via CSV with Excel-friendly format)
// ============================================

export function exportToExcel(options: ExportOptions): void {
  // Excel can open CSV files, so we use CSV with Excel-friendly formatting
  exportToCSV({
    ...options,
    filename: options.filename.replace('.csv', ''),
  });
}

// ============================================
// PDF Export (basic HTML to PDF via print)
// ============================================

export function exportToPDF(options: ExportOptions): void {
  const { filename, columns, data, title, subtitle } = options;

  // Create printable HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
        }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 24px; font-weight: normal; }
        table { 
          width: 100%; 
          border-collapse: collapse;
          font-size: 12px;
        }
        th, td { 
          padding: 12px 8px; 
          text-align: left; 
          border-bottom: 1px solid #e5e5e5;
        }
        th { 
          background: #f5f5f5; 
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        tr:nth-child(even) { background: #fafafa; }
        tr:hover { background: #f0f0f0; }
        .footer {
          margin-top: 24px;
          font-size: 11px;
          color: #999;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      ${title ? `<h1>${title}</h1>` : ''}
      ${subtitle ? `<h2>${subtitle}</h2>` : ''}
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                const value = row[col.key];
                const formatted = col.formatter ? col.formatter(value) : String(value ?? '');
                return `<td>${formatted}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleDateString('fr-FR')} at ${new Date().toLocaleTimeString('fr-FR')}
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ============================================
// JSON Export
// ============================================

export function exportToJSON(options: Omit<ExportOptions, 'columns'>): void {
  const { filename, data } = options;
  
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  
  downloadBlob(blob, `${filename}.json`);
}

// ============================================
// Utility Functions
// ============================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Common Formatters
// ============================================

export const formatters = {
  currency: (value: unknown) => {
    const num = Number(value);
    return isNaN(num) ? '' : new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
  },
  
  percentage: (value: unknown) => {
    const num = Number(value);
    return isNaN(num) ? '' : `${num.toFixed(1)}%`;
  },
  
  number: (value: unknown) => {
    const num = Number(value);
    return isNaN(num) ? '' : new Intl.NumberFormat('fr-FR').format(num);
  },
  
  date: (value: unknown) => {
    if (!value) return '';
    const date = new Date(value as string | number | Date);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
  },
  
  datetime: (value: unknown) => {
    if (!value) return '';
    const date = new Date(value as string | number | Date);
    return isNaN(date.getTime()) ? '' : date.toLocaleString('fr-FR');
  },
  
  boolean: (value: unknown) => {
    return value ? 'Oui' : 'Non';
  },
};
