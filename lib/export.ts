import * as XLSX from 'xlsx'

interface InvestmentExportData {
  id: string
  investor_name: string
  principal_amount: number
  starting_date: string
  due_date: string
  category_id: string | null
  duration: string
  profit_rate: number
  commission_rate: number
  profit_amount: number
  commission_amount: number
  total_payout: number
  status: string
  is_shared: boolean
  notes: string
}

interface DebtExportData {
  id: string
  creditor_name: string
  debtor_name: string
  principal_amount: number
  interest_rate: number
  total_due: number
  issue_date: string
  due_date: string
  debt_type: string
  status: string
  amount_paid: number
  remaining_amount: number
  notes?: string
}

export function exportInvestmentsToExcel(investments: InvestmentExportData[]) {
  const workbook = XLSX.utils.book_new()

  // Main data sheet
  const mainData = investments.map((inv) => ({
    'Investor Name': inv.investor_name,
    'Principal Amount': inv.principal_amount,
    'Start Date': inv.starting_date,
    'Due Date': inv.due_date,
    'Category': inv.category_id || '',
    'Duration': inv.duration.replace('_', ' '),
    'Profit Rate (%)': (inv.profit_rate * 100).toFixed(2),
    'Commission Rate (%)': (inv.commission_rate * 100).toFixed(2),
    'Profit Amount': inv.profit_amount,
    'Commission Amount': inv.commission_amount,
    'Total Payout': inv.total_payout,
    'Status': inv.status,
    'Shared': inv.is_shared ? 'Yes' : 'No',
    'Notes': inv.notes || '',
  }))

  const mainSheet = XLSX.utils.json_to_sheet(mainData)

  // Set column widths
  mainSheet['!cols'] = [
    { wch: 20 }, // Investor Name
    { wch: 15 }, // Principal
    { wch: 12 }, // Start Date
    { wch: 12 }, // Due Date
    { wch: 15 }, // Category
    { wch: 12 }, // Duration
    { wch: 12 }, // Profit Rate
    { wch: 15 }, // Commission Rate
    { wch: 15 }, // Profit Amount
    { wch: 18 }, // Commission Amount
    { wch: 15 }, // Total Payout
    { wch: 10 }, // Status
    { wch: 8 },  // Shared
    { wch: 25 }, // Notes
  ]

  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Investments')

  // Summary sheet
  const activeInvestments = investments.filter(i => i.status === 'active')
  const summaryData = [
    { 'Metric': 'Total Investments', 'Value': investments.length },
    { 'Metric': 'Active Investments', 'Value': activeInvestments.length },
    { 'Metric': 'Matured Investments', 'Value': investments.filter(i => i.status === 'matured').length },
    { 'Metric': 'Total Principal (All)', 'Value': investments.reduce((sum, i) => sum + i.principal_amount, 0) },
    { 'Metric': 'Total Principal (Active)', 'Value': activeInvestments.reduce((sum, i) => sum + i.principal_amount, 0) },
    { 'Metric': 'Total Expected Profits', 'Value': investments.reduce((sum, i) => sum + i.profit_amount, 0) },
    { 'Metric': 'Total Commissions', 'Value': investments.reduce((sum, i) => sum + i.commission_amount, 0) },
    { 'Metric': 'Total Payouts', 'Value': investments.reduce((sum, i) => sum + i.total_payout, 0) },
    { 'Metric': 'Shared Investments', 'Value': investments.filter(i => i.is_shared).length },
    { 'Metric': 'Export Date', 'Value': new Date().toISOString().split('T')[0] },
  ]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `Portfolio_Export_${dateStr}.xlsx`

  XLSX.writeFile(workbook, filename)
}

export function exportDebtsToExcel(debts: DebtExportData[]) {
  const workbook = XLSX.utils.book_new()

  // Main data sheet
  const mainData = debts.map((debt) => ({
    'Creditor': debt.creditor_name,
    'Debtor': debt.debtor_name,
    'Principal Amount': debt.principal_amount,
    'Interest Rate (%)': debt.interest_rate ? (debt.interest_rate * 100).toFixed(2) : 'N/A',
    'Total Due': debt.total_due,
    'Issue Date': debt.issue_date,
    'Due Date': debt.due_date,
    'Type': debt.debt_type,
    'Status': debt.status,
    'Amount Paid': debt.amount_paid,
    'Remaining': debt.remaining_amount,
    'Notes': debt.notes || '',
  }))

  const mainSheet = XLSX.utils.json_to_sheet(mainData)
  mainSheet['!cols'] = [
    { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Debts')

  // Summary sheet
  const summaryData = [
    { 'Metric': 'Total Debts', 'Value': debts.length },
    { 'Metric': 'Pending Debts', 'Value': debts.filter(d => d.status === 'pending').length },
    { 'Metric': 'Partial Payments', 'Value': debts.filter(d => d.status === 'partial').length },
    { 'Metric': 'Paid Debts', 'Value': debts.filter(d => d.status === 'paid').length },
    { 'Metric': 'Defaulted Debts', 'Value': debts.filter(d => d.status === 'defaulted').length },
    { 'Metric': 'Total Principal', 'Value': debts.reduce((sum, d) => sum + d.principal_amount, 0) },
    { 'Metric': 'Total Due', 'Value': debts.reduce((sum, d) => sum + d.total_due, 0) },
    { 'Metric': 'Total Paid', 'Value': debts.reduce((sum, d) => sum + d.amount_paid, 0) },
    { 'Metric': 'Total Remaining', 'Value': debts.reduce((sum, d) => sum + d.remaining_amount, 0) },
    { 'Metric': 'Export Date', 'Value': new Date().toISOString().split('T')[0] },
  ]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `Debts_Export_${dateStr}.xlsx`

  XLSX.writeFile(workbook, filename)
}
