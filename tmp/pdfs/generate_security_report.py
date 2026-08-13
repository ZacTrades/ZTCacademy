from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.pdfbase.pdfmetrics import stringWidth
from datetime import date

OUTPUT = "output/pdf/zactrades-security-work-report.pdf"

accent = colors.HexColor("#0EA5E9")
gold = colors.HexColor("#F4B63D")
dark = colors.HexColor("#07111F")
muted = colors.HexColor("#526174")
border = colors.HexColor("#D7DEE8")
soft = colors.HexColor("#F4F8FC")
green = colors.HexColor("#059669")
red = colors.HexColor("#DC2626")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="TitleHero",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=26,
    leading=31,
    textColor=dark,
    alignment=TA_CENTER,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Subtitle",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=muted,
    alignment=TA_CENTER,
    spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="Section",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=19,
    textColor=dark,
    spaceBefore=12,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="SubSection",
    parent=styles["Heading3"],
    fontName="Helvetica-Bold",
    fontSize=11.5,
    leading=15,
    textColor=dark,
    spaceBefore=8,
    spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.6,
    leading=14,
    textColor=colors.HexColor("#243246"),
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Small",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=12,
    textColor=muted,
))
styles.add(ParagraphStyle(
    name="Cell",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.2,
    leading=11,
    textColor=colors.HexColor("#243246"),
))
styles.add(ParagraphStyle(
    name="CellBold",
    parent=styles["Cell"],
    fontName="Helvetica-Bold",
    textColor=dark,
))
styles.add(ParagraphStyle(
    name="HeaderCell",
    parent=styles["CellBold"],
    fontSize=8,
    leading=10,
    textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="Badge",
    parent=styles["BodyText"],
    fontName="Helvetica-Bold",
    fontSize=8.2,
    leading=10,
    textColor=colors.white,
    alignment=TA_CENTER,
))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def bullet(items):
    rows = []
    for item in items:
        rows.append([Paragraph("-", styles["Body"]), p(item)])
    table = Table(rows, colWidths=[0.35*cm, 16.1*cm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    return table


def badge(text, color):
    t = Table([[Paragraph(text, styles["Badge"])]], colWidths=[2.45*cm], rowHeights=[0.55*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("BOX", (0,0), (-1,-1), 0, color),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
    ]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(border)
    canvas.line(doc.leftMargin, 1.45*cm, A4[0] - doc.rightMargin, 1.45*cm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(muted)
    canvas.drawString(doc.leftMargin, 1.05*cm, "ZacTrades security work report")
    canvas.drawRightString(A4[0] - doc.rightMargin, 1.05*cm, f"Page {doc.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=1.55*cm,
    leftMargin=1.55*cm,
    topMargin=1.5*cm,
    bottomMargin=1.8*cm,
)

story = []

story.append(p("ZacTrades Security Work Report", "TitleHero"))
story.append(p("Summary of completed hardening work, edited files, verification results, and remaining actions. Generated 2026-07-30 for /Users/yassine/Downloads/mentor-market-flow-main-1.", "Subtitle"))

summary_cards = [
    [badge("COMPLETED", green), p("Removed insecure local payment confirmation paths and raw card collection from checkout.", "Cell")],
    [badge("ADDED", accent), p("NOWPayments IPN endpoint with HMAC verification, event idempotency, and amount/currency validation.", "Cell")],
    [badge("STILL TODO", gold), p("Run the Supabase migration, rotate pasted NOWPayments secrets, configure production env vars, and add a card-provider webhook.", "Cell")],
]
summary = Table(summary_cards, colWidths=[3.0*cm, 13.5*cm], hAlign="LEFT")
summary.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), soft),
    ("BOX", (0,0), (-1,-1), 0.5, border),
    ("INNERGRID", (0,0), (-1,-1), 0.25, border),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
story.append(summary)
story.append(Spacer(1, 0.35*cm))

story.append(p("1. Steps Completed", "Section"))
story.append(bullet([
    "Inspected the project architecture, payment flow, Supabase schema, checkout UI, server entry, and environment handling.",
    "Created SECURITY_AUDIT.md before making security changes, documenting critical and high-priority findings.",
    "Removed local paid-access fallback behavior so the browser can no longer cause paid access without provider confirmation.",
    "Removed raw card number, expiry, and CVC inputs from the checkout dialog and replaced them with a hosted-checkout notice.",
    "Changed checkout server functions so the server computes product price and duration from trusted product records instead of browser-submitted labels.",
    "Added a NOWPayments IPN endpoint at /api/nowpayments/ipn with HMAC SHA-512 verification and idempotent event storage.",
    "Added a Supabase migration for payment_webhook_events, provider checkout uniqueness, and revoking local payment confirmation functions.",
    "Added baseline browser security headers, including CSP, HSTS, Referrer-Policy, X-Content-Type-Options, and Permissions-Policy.",
    "Hardened .env handling and documented which variables are browser-safe versus server-only.",
    "Added a PDF upload size limit and randomized uploaded PDF object names.",
    "Ran formatter, build, lint, dependency audit, and frontend secret scans.",
]))

story.append(p("2. Verification Results", "Section"))
verification = [
    [p("Check", "HeaderCell"), p("Result", "HeaderCell")],
    [p("npm run build", "CellBold"), p("Passed. Client and SSR production builds completed successfully.", "Cell")],
    [p("npm run lint", "CellBold"), p("Passed with 6 existing Fast Refresh warnings in reusable UI helper files. No lint errors.", "Cell")],
    [p("npm audit --omit=dev", "CellBold"), p("Passed after safe npm audit fix. Final result: 0 vulnerabilities.", "Cell")],
    [p("Frontend secret scan", "CellBold"), p("No matches for server-only secret names or previously pasted secret fragments in dist/client.", "Cell")],
    [p("Insecure checkout scan", "CellBold"), p("No old local_paid, paymentReference, setCard, setCvc, raw card-number, or crypto-reference confirmation paths found. Only safe explanatory CVC text remains.", "Cell")],
]
vt = Table(verification, colWidths=[4.3*cm, 12.2*cm], repeatRows=1, hAlign="LEFT")
vt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), dark),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("BACKGROUND", (0,1), (-1,-1), colors.white),
    ("BOX", (0,0), (-1,-1), 0.5, border),
    ("INNERGRID", (0,0), (-1,-1), 0.25, border),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("RIGHTPADDING", (0,0), (-1,-1), 7),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
]))
story.append(vt)
story.append(PageBreak())

story.append(p("3. Files Edited", "Section"))
files = [
    (".env.example", "Documented browser-safe and server-only environment variables, including NOWPayments callback settings."),
    (".gitignore", "Added protection for .env and .env.* files while keeping .env.example tracked."),
    ("package-lock.json", "Updated by npm audit fix to resolve production dependency vulnerabilities."),
    ("src/components/site/AuthDialog.tsx", "Formatted by Prettier as part of lint cleanup from previous UI edits."),
    ("src/components/site/CheckoutDialog.tsx", "Removed raw card fields and local paid success branches; sends only product slugs/payment method to server."),
    ("src/lib/payment-server.ts", "Reworked checkout authority, provider checkout creation, NOWPayments invoice creation, and IPN webhook handling."),
    ("src/routes/admin.tsx", "Added PDF upload size limit/randomized upload path and formatted admin changes."),
    ("src/routes/blog.tsx", "Formatted by Prettier after earlier blog route changes."),
    ("src/routes/blog_.$slug.tsx", "Formatted by Prettier after earlier blog detail/PDF reader changes."),
    ("src/routes/live-trading.tsx", "Formatted by Prettier after earlier live-trading page changes."),
    ("src/routes/news.tsx", "Formatted by Prettier after earlier news-page changes."),
    ("src/server.ts", "Added security headers and /api/nowpayments/ipn routing."),
    ("supabase/auth-schema.sql", "Appended security hardening SQL block for new database installs."),
    ("supabase/migrations/202607300001_security_hardening.sql", "New migration for webhook events, unique indexes, and revoking local payment confirmation functions."),
    ("SECURITY_AUDIT.md", "New audit report with findings, fixes, verification, and remaining risks."),
    ("SECURITY_IMPLEMENTATION.md", "New implementation notes with payment design, env vars, manual actions, and deployment checklist."),
]
file_rows = [[p("File", "HeaderCell"), p("What changed", "HeaderCell")]]
for name, desc in files:
    file_rows.append([p(name, "CellBold"), p(desc, "Cell")])
ft = Table(file_rows, colWidths=[6.2*cm, 10.3*cm], repeatRows=1, hAlign="LEFT")
ft.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), dark),
    ("BOX", (0,0), (-1,-1), 0.5, border),
    ("INNERGRID", (0,0), (-1,-1), 0.25, border),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, soft]),
]))
story.append(ft)
story.append(PageBreak())

story.append(p("4. Payment Security Design", "Section"))
story.append(p("Card payments", "SubSection"))
story.append(bullet([
    "The site no longer collects card number, expiry, or CVC. This keeps the application out of the raw card-data path.",
    "A card checkout can only continue through a hosted provider URL configured server-side.",
    "Paid access should be granted only after the chosen card provider sends a verified webhook.",
]))
story.append(p("Crypto payments with NOWPayments", "SubSection"))
story.append(bullet([
    "The server creates a hosted NOWPayments invoice using trusted server-side product price and metadata.",
    "NOWPayments IPN events are accepted only with a valid x-nowpayments-sig HMAC signature.",
    "The webhook stores each event uniquely before fulfillment to protect against duplicate delivery.",
    "The webhook checks local checkout reference, expected amount, and expected USD currency before marking access paid.",
]))

story.append(p("5. Database Changes To Run", "Section"))
story.append(p("Run this file in the Supabase SQL editor:", "Body"))
story.append(p("supabase/migrations/202607300001_security_hardening.sql", "CellBold"))
story.append(Spacer(1, 0.15*cm))
story.append(bullet([
    "Creates public.payment_webhook_events for provider webhook idempotency.",
    "Adds unique provider checkout indexes on membership, live trading, and news subscription tables.",
    "Revokes execute permission on local confirm_local_* functions from public, anon, and authenticated roles.",
    "If unique indexes fail, clean duplicate provider_checkout_id records first, then rerun the migration.",
]))

story.append(p("6. What Still Should Be Edited After", "Section"))
remaining = [
    ("Required", "Rotate the NOWPayments API key and IPN secret that were pasted in chat before production."),
    ("Required", "Add the rotated server-only secrets to hosting environment variables, not to git or VITE_* variables."),
    ("Required", "Configure NOWPayments IPN callback URL to https://your-domain.com/api/nowpayments/ipn."),
    ("Required", "Run the Supabase security hardening migration on the live database."),
    ("Required", "Test one low-value or sandbox crypto payment and confirm access changes only after the IPN arrives."),
    ("Important", "Choose the real card-payment provider and add its signed webhook before enabling automated card access."),
    ("Important", "Decide whether blog PDFs are public or private. If private, move the bucket private and use signed URLs."),
    ("Important", "Move sensitive admin actions, such as manual paid access and role edits, to audited server functions."),
    ("Optional", "Resolve existing Fast Refresh lint warnings in reusable UI files if you want completely warning-free lint output."),
]
rem_rows = [[p("Priority", "HeaderCell"), p("Action", "HeaderCell")]]
for pri, action in remaining:
    rem_rows.append([p(pri, "CellBold"), p(action, "Cell")])
rt = Table(rem_rows, colWidths=[3.0*cm, 13.5*cm], repeatRows=1, hAlign="LEFT")
rt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), dark),
    ("BOX", (0,0), (-1,-1), 0.5, border),
    ("INNERGRID", (0,0), (-1,-1), 0.25, border),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, soft]),
]))
story.append(rt)

story.append(PageBreak())
story.append(p("7. Safe Deployment Checklist", "Section"))
story.append(bullet([
    "Confirm npm run build passes before deployment.",
    "Confirm npm run lint has no errors.",
    "Confirm npm audit --omit=dev reports zero vulnerabilities.",
    "Confirm dist/client does not contain server-only secret names or secret fragments.",
    "Apply the Supabase migration before testing paid access.",
    "Set NOWPayments and Supabase service-role variables as server-only hosting secrets.",
    "Make sure /api/nowpayments/ipn is publicly reachable over HTTPS.",
    "Do not commit .env, .env.local, dist/server/.dev.vars, or any real provider secrets.",
]))

story.append(Spacer(1, 0.25*cm))
story.append(p("Report files in the project: SECURITY_AUDIT.md and SECURITY_IMPLEMENTATION.md contain the detailed written record behind this PDF.", "Small"))

doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
