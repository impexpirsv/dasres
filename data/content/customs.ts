import { createPublishedContent, UNECE_TRADE_DOCUMENTS_SOURCE, WCO_HS_SOURCE } from "./factory";

export const customsArticles = [
  createPublishedContent({
    id: "customs-what-is-hs-code", slug: "what-is-an-hs-code", category: "customs",
    title: "What is an HS Code?",
    summary: "Understand the Harmonized System, how six-digit classifications are structured, and why national tariff codes require jurisdiction-specific confirmation.",
    excerpt: "A concept-first guide to HS classification without guessing a product’s code.",
    tags: ["HS code", "classification", "customs"], seoTitle: "What Is an HS Code? | Customs Guide",
    seoDescription: "Learn how the Harmonized System organizes goods and why final tariff classification must be confirmed locally.",
    relatedArticles: ["customs-commercial-invoice", "customs-packing-list"], primarySources: [WCO_HS_SOURCE],
    body: `## The Harmonized System

The Harmonized Commodity Description and Coding System, usually called the HS, is an international nomenclature developed by the World Customs Organization. It organizes goods into sections, chapters, headings, and six-digit subheadings using interpretive rules and legal notes.

An HS code is not simply a keyword assigned to a product name. Classification depends on the goods’ objective characteristics and, where relevant, composition, function, condition, and presentation.

## International and national digits

The first six digits represent the international HS structure. Customs administrations may extend that structure with additional digits for national tariff, statistical, or regulatory purposes. A code that appears complete in one country may therefore be incomplete or different for another country’s declaration.

:::warning Do not infer a tariff from an HS heading
Duty rates, taxes, controls, preferences, documentation, and national code extensions vary by jurisdiction and can change. Consult the current tariff and guidance of the relevant customs authority or a qualified classification professional.
:::

## A responsible classification process

1. Describe the product precisely using technical information rather than a marketing name alone.
2. Identify potentially relevant headings in the applicable HS edition.
3. Apply the General Rules for Interpretation and all relevant section, chapter, and subheading notes.
4. Check authoritative explanatory material and classification decisions available for the jurisdiction.
5. Confirm the full national tariff code and retain the reasoning and evidence.

## Information worth collecting

Useful evidence may include material composition, manufacturing method, principal function, dimensions, technical drawings, product literature, and how components are presented together. When uncertainty is material, ask the relevant customs authority about available advance or binding classification mechanisms rather than relying on an unsupported guess.` }),

  createPublishedContent({
    id: "customs-commercial-invoice", slug: "commercial-invoice-explained", category: "customs",
    title: "Commercial Invoice explained",
    summary: "Learn how a commercial invoice communicates transaction data and how to prepare one for consistent cross-border documentation.",
    excerpt: "A field-by-field, jurisdiction-neutral guide to commercial invoices.",
    tags: ["commercial invoice", "customs documents", "valuation"], seoTitle: "Commercial Invoice Explained | Customs",
    seoDescription: "Learn the purpose, common fields, checks, and jurisdiction-specific limits of a commercial invoice.",
    relatedArticles: ["glossary-commercial-invoice", "customs-packing-list", "customs-what-is-hs-code"], primarySources: [UNECE_TRADE_DOCUMENTS_SOURCE],
    body: `## Purpose

The commercial invoice records the seller’s billing information and key facts about the sale. Its data may be used across payment, transport, customs, tax, statistics, and internal controls, but each participant uses it for a different purpose.

## Core data groups

| Group | Examples to verify |
| --- | --- |
| Parties | Seller, buyer, consignee, addresses, identifiers where required |
| Invoice | Unique number, issue date, contract or order reference |
| Goods | Clear description, quantity, unit, and classification where required |
| Value | Unit price, line total, currency, adjustments, total amount |
| Delivery | Agreed delivery term with named place, transport references |
| Payment | Agreed payment terms and authorized payment details |

This is a preparation checklist, not a universal list of mandatory fields.

## Write useful goods descriptions

Describe what the goods actually are. Avoid unexplained internal stock codes or generic phrases such as “parts” when a clearer description is available. Keep descriptions, quantities, and references consistent with the packing list, transport documents, and contract.

:::warning Jurisdiction-specific requirements apply
Required declarations, valuation adjustments, origin statements, tax identifiers, signatures, language, format, and electronic filing rules vary. Confirm current requirements with the relevant customs and tax authorities and qualified advisers.
:::

## Final review

Recalculate line extensions and totals, confirm the currency, distinguish buyer from consignee, and verify dates and reference numbers. Protect legitimate payment-detail changes with an independent verification process because an accurate-looking invoice can still be fraudulent.` }),

  createPublishedContent({
    id: "customs-packing-list", slug: "packing-list-explained", category: "customs",
    title: "Packing List explained",
    summary: "Prepare a packing list that lets authorized participants reconcile packages, contents, quantities, dimensions, and weights.",
    excerpt: "A practical explanation of packing-list structure and document consistency.",
    tags: ["packing list", "customs documents", "shipment"], seoTitle: "Packing List Explained | Customs Guide",
    seoDescription: "Learn how to structure and check a packing list for a cross-border shipment without assuming local rules.",
    relatedArticles: ["glossary-packing-list", "customs-commercial-invoice", "glossary-bill-of-lading"], primarySources: [UNECE_TRADE_DOCUMENTS_SOURCE],
    body: `## Purpose

A packing list maps the goods to their physical packages. It supports loading, warehousing, inspection, delivery checks, and reconciliation with other transaction documents. It is not a substitute for the commercial invoice or transport document.

## Build a package-level record

Give each package a stable identifier that matches its physical marking. For every package, record the package type, contents, item quantities, and applicable dimensions and weights. Show totals that can be reconciled with the complete consignment.

| Check | Question |
| --- | --- |
| Package marks | Can a handler match the row to the physical package? |
| Quantity | Do package-level quantities add to the shipment total? |
| Weight | Are net and gross weights clearly distinguished with units? |
| Dimensions | Are units and the order of dimensions unambiguous? |
| References | Do invoice, order, and transport references match? |

## Keep documents aligned

The packing list and commercial invoice may organize lines differently, but their goods and quantity totals should reconcile. Package count and weight should also agree with final transport instructions and records where those fields appear.

:::warning Requirements vary by shipment
Authorities, carriers, banks, buyers, commodities, and destinations may require different data or formats. Confirm the actual documentary requirements before dispatch and seek qualified advice for controlled or regulated goods.
:::

## Control the final version

Update the document after repacking, consolidation, or quantity changes. Mark revisions clearly and distribute the final version to authorized participants so an obsolete list is not used for clearance or delivery.` }),
] as const;
