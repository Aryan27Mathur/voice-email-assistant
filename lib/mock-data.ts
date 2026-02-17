import type { Email, EmailThread } from "./types"

export const mockEmails: Email[] = [
  {
    id: "1",
    from: "Sarah Chen",
    fromEmail: "sarah.chen@acme.com",
    subject: "Q4 Revenue Report - Final Review",
    snippet:
      "Hi, please find attached the final Q4 revenue report. The numbers look strong with a 23% increase...",
    body: "Hi,\n\nPlease find attached the final Q4 revenue report. The numbers look strong with a 23% increase over Q3. Key highlights:\n\n- Total revenue: $4.2M\n- New customer acquisition: 156 accounts\n- Churn rate decreased to 2.1%\n\nLet me know if you have any questions before the board meeting on Thursday.\n\nBest,\nSarah",
    date: "2026-02-14T09:30:00Z",
    read: false,
    starred: true,
    labels: ["Finance", "Important"],
    attachments: [
      {
        id: "a1",
        filename: "Q4_Revenue_Report_2025.pdf",
        contentType: "application/pdf",
        size: 2450000,
      },
      {
        id: "a2",
        filename: "revenue_data.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 890000,
      },
    ],
  },
  {
    id: "2",
    from: "Marcus Johnson",
    fromEmail: "marcus@designlabs.io",
    subject: "Updated Brand Guidelines",
    snippet:
      "Hey! The new brand guidelines are ready. I've incorporated all the feedback from last week's...",
    body: "Hey!\n\nThe new brand guidelines are ready. I've incorporated all the feedback from last week's design review. Major changes include:\n\n- Updated color palette with better accessibility scores\n- New typography scale for mobile\n- Revised logo usage guidelines\n\nThe Figma file is also updated. Let me know your thoughts!\n\nCheers,\nMarcus",
    date: "2026-02-14T08:15:00Z",
    read: false,
    starred: false,
    labels: ["Design"],
    attachments: [
      {
        id: "a3",
        filename: "Brand_Guidelines_v3.pdf",
        contentType: "application/pdf",
        size: 15200000,
      },
    ],
  },
  {
    id: "3",
    from: "Emily Rodriguez",
    fromEmail: "emily.r@techstart.co",
    subject: "Partnership Proposal - TechStart x Your Company",
    snippet:
      "Dear Team, I'm reaching out regarding a potential strategic partnership between our organizations...",
    body: "Dear Team,\n\nI'm reaching out regarding a potential strategic partnership between our organizations. TechStart has been following your growth and we believe there's a strong synergy between our platforms.\n\nProposal highlights:\n- Joint go-to-market strategy for enterprise clients\n- Shared API integration for seamless user experience\n- Co-branded marketing campaigns\n\nI'd love to schedule a call to discuss this further. Would next Tuesday at 2 PM work?\n\nBest regards,\nEmily Rodriguez\nVP of Partnerships, TechStart",
    date: "2026-02-13T16:45:00Z",
    read: true,
    starred: true,
    labels: ["Partnerships"],
    attachments: [
      {
        id: "a4",
        filename: "TechStart_Partnership_Proposal.pdf",
        contentType: "application/pdf",
        size: 3400000,
      },
      {
        id: "a5",
        filename: "market_analysis.pptx",
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        size: 7800000,
      },
    ],
  },
  {
    id: "4",
    from: "DevOps Bot",
    fromEmail: "alerts@monitoring.internal",
    subject: "Production Deploy: v2.14.0 Successful",
    snippet:
      "Deployment v2.14.0 has been successfully rolled out to production. All health checks passing...",
    body: "Deployment Summary\n\nVersion: v2.14.0\nEnvironment: Production\nStatus: Successful\nDeploy Time: 3m 24s\n\nChanges:\n- feat: New email template engine\n- fix: Resolved memory leak in worker processes\n- chore: Updated dependencies\n\nAll health checks passing. No rollback required.\n\nMonitoring dashboard: https://monitoring.internal/deploy/v2.14.0",
    date: "2026-02-13T14:20:00Z",
    read: true,
    starred: false,
    labels: ["Engineering"],
    attachments: [],
  },
  {
    id: "5",
    from: "Lisa Park",
    fromEmail: "lisa.park@legal.co",
    subject: "NDA Review - Urgent",
    snippet:
      "Hi, the NDA for the Apex deal needs your review by end of day. I've flagged two clauses that...",
    body: "Hi,\n\nThe NDA for the Apex deal needs your review by end of day. I've flagged two clauses that need attention:\n\n1. Section 4.2 - Non-compete scope seems overly broad\n2. Section 7.1 - Termination clause needs a 30-day notice period\n\nI've attached the redlined version with my comments. Please review and let me know if you agree with the suggested changes.\n\nUrgent - they need this signed by Friday.\n\nThanks,\nLisa",
    date: "2026-02-13T11:00:00Z",
    read: true,
    starred: true,
    labels: ["Legal", "Urgent"],
    attachments: [
      {
        id: "a6",
        filename: "NDA_Apex_Redlined.docx",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 450000,
      },
    ],
  },
  {
    id: "6",
    from: "Team Calendar",
    fromEmail: "calendar@workspace.com",
    subject: "Reminder: All-Hands Meeting Tomorrow at 10 AM",
    snippet:
      "This is a reminder for the All-Hands meeting scheduled for tomorrow. Agenda includes Q1 planning...",
    body: "Reminder: All-Hands Meeting\n\nDate: Tomorrow, 10:00 AM - 11:30 AM\nLocation: Main Conference Room / Zoom\n\nAgenda:\n1. Q1 Planning & OKRs\n2. New Product Roadmap Preview\n3. Team Updates\n4. Open Q&A\n\nPlease review the pre-read materials shared last week. See you there!",
    date: "2026-02-12T17:00:00Z",
    read: true,
    starred: false,
    labels: ["Calendar"],
    attachments: [],
  },
  {
    id: "7",
    from: "Alex Kim",
    fromEmail: "alex.kim@vendortech.com",
    subject: "Invoice #INV-2026-0214",
    snippet:
      "Please find attached the invoice for February services. Payment terms are net 30...",
    body: "Hi,\n\nPlease find attached the invoice for February services rendered.\n\nInvoice Details:\n- Invoice #: INV-2026-0214\n- Amount: $12,500.00\n- Due Date: March 16, 2026\n- Payment Terms: Net 30\n\nPlease process at your earliest convenience. Wire transfer details are included in the PDF.\n\nThank you for your continued partnership.\n\nBest,\nAlex Kim\nAccounts Receivable, VendorTech",
    date: "2026-02-12T10:30:00Z",
    read: true,
    starred: false,
    labels: ["Finance"],
    attachments: [
      {
        id: "a7",
        filename: "INV-2026-0214.pdf",
        contentType: "application/pdf",
        size: 180000,
      },
    ],
  },
]

/** Mock threads for demo when Nylas is not connected. Each email becomes a single-message thread. */
export const mockThreads: EmailThread[] = mockEmails.map((e, i) => ({
  id: `thread-${e.id}`,
  subject: e.subject,
  snippet: e.snippet,
  messageIds: [e.id],
  unread: !e.read,
  starred: e.starred,
  latestMessageReceivedDate: new Date(e.date).getTime() / 1000,
  latestMessageSentDate: undefined,
  participants: [{ name: e.from, email: e.fromEmail }],
  hasAttachments: e.attachments.length > 0,
  needsReply: false,
}))
