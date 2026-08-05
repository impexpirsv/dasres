import { createPublishedContent, ICC_INCOTERMS_SOURCE, UNECE_TRADE_DOCUMENTS_SOURCE } from "./factory";

const jurisdictionCallout = `:::warning Confirm the contract and local requirements
Trade terms do not replace the sales contract, transport contract, insurance terms, payment terms, or laws that apply. Requirements and interpretations can vary by jurisdiction and transaction. Obtain qualified advice where needed.
:::`;

export const glossary = [
  createPublishedContent({
    id: "glossary-incoterms", slug: "incoterms", category: "glossary", title: "Incoterms",
    summary: "A practical introduction to the ICC rules used to describe selected delivery obligations, costs, and risk in contracts for the sale of goods.",
    excerpt: "Understand what Incoterms® rules address, what they do not address, and how to identify one precisely.",
    tags: ["Incoterms", "delivery terms", "contracts"], seoTitle: "Incoterms Explained | Trade Glossary",
    seoDescription: "Understand the role and limits of Incoterms rules in contracts for the international sale of goods.",
    relatedArticles: ["glossary-fob", "glossary-cif", "glossary-exw"], primarySources: [ICC_INCOTERMS_SOURCE],
    body: `## Meaning

Incoterms® are standardized rules published by the International Chamber of Commerce. When incorporated correctly into a sale contract, a selected rule helps the parties describe responsibilities associated with delivery, allocation of certain costs, and the point at which risk transfers from seller to buyer.

## How to state a rule

Identify the three-letter rule, the named place or port required by that rule, and the edition—for example, a formulation ending in “Incoterms® 2020.” The named location matters because it determines where an obligation or delivery point is performed.

## What the rules do not decide

Incoterms rules do not by themselves determine ownership of the goods, price or payment method, remedies for breach, governing law, sanctions compliance, or every document required for a shipment. Those matters belong in the wider contract and applicable legal framework.

${jurisdictionCallout}

## Practical use

Select a rule based on the actual transport plan, control over carriage, insurance needs, and ability of each party to perform formalities. Avoid choosing a familiar abbreviation without checking whether it fits the mode of transport and the named location.` }),

  createPublishedContent({
    id: "glossary-fob", slug: "fob", category: "glossary", title: "FOB",
    summary: "FOB means Free On Board, an Incoterms® rule intended for sea or inland waterway transport.",
    excerpt: "A concise explanation of FOB delivery, risk, costs, and common limitations.",
    tags: ["FOB", "Incoterms", "maritime trade"], seoTitle: "FOB Meaning | Trade Glossary",
    seoDescription: "Learn what FOB means under Incoterms rules and why the named port and transport method matter.",
    relatedArticles: ["glossary-incoterms", "glossary-cif", "glossary-bill-of-lading"], primarySources: [ICC_INCOTERMS_SOURCE],
    body: `## Meaning

FOB stands for Free On Board. Under the ICC Incoterms® 2020 framework, it is a rule for sea or inland waterway transport. The named port of shipment is essential to the term.

## Delivery and risk

At a high level, the seller delivers when the goods are placed on board the vessel nominated by the buyer at the named port of shipment. Risk then transfers according to the rule. The buyer generally arranges the main carriage, while the rule allocates specified obligations and costs between the parties.

## When to examine another rule

FOB may be a poor fit where goods are handed to a carrier before they are placed on board, as often occurs with container movements. Parties should assess the actual handover and transport arrangement rather than selecting FOB by habit.

${jurisdictionCallout}

## Contract checklist

- State “FOB,” the precise named port of shipment, and the chosen Incoterms edition.
- Align vessel nomination and shipment timing responsibilities.
- Confirm documentary, payment, inspection, and insurance arrangements separately.
- Check that operational teams and logistics providers understand the same delivery point.` }),

  createPublishedContent({
    id: "glossary-cif", slug: "cif", category: "glossary", title: "CIF",
    summary: "CIF means Cost, Insurance and Freight, an Incoterms® rule for sea or inland waterway transport.",
    excerpt: "Understand the separate delivery, risk, carriage, and insurance features of CIF.",
    tags: ["CIF", "Incoterms", "cargo insurance"], seoTitle: "CIF Meaning | Trade Glossary",
    seoDescription: "Learn the meaning of CIF and distinguish the risk-transfer point from carriage and insurance obligations.",
    relatedArticles: ["glossary-incoterms", "glossary-fob", "glossary-commercial-invoice"], primarySources: [ICC_INCOTERMS_SOURCE],
    body: `## Meaning

CIF stands for Cost, Insurance and Freight. It is an Incoterms® rule reserved for sea or inland waterway transport. The seller contracts for carriage to the named destination port and obtains the insurance coverage required by the rule.

## Risk and cost are different questions

The destination named after CIF describes the port to which carriage is arranged, but it should not be assumed to be the point where risk transfers. Delivery and risk transfer occur according to the rule at shipment. This distinction is central to understanding CIF.

## Insurance scope

The rule specifies a minimum insurance obligation, but the parties may need broader coverage for the goods, route, or commercial risk. The insurance contract and policy wording should be checked directly rather than inferred from the three-letter term.

${jurisdictionCallout}

## Contract checklist

- Name the destination port and Incoterms edition precisely.
- Confirm whether the required insurance is commercially adequate.
- Align transport and insurance documents with payment requirements.
- Ensure both parties understand the delivery and risk-transfer point.` }),

  createPublishedContent({
    id: "glossary-exw", slug: "exw", category: "glossary", title: "EXW",
    summary: "EXW means Ex Works, an Incoterms® rule that places a limited delivery obligation on the seller at a named place.",
    excerpt: "Learn the basic allocation under EXW and why operational feasibility must be checked.",
    tags: ["EXW", "Incoterms", "delivery"], seoTitle: "EXW Meaning | Trade Glossary",
    seoDescription: "Understand Ex Works delivery and the practical questions parties should resolve before choosing EXW.",
    relatedArticles: ["glossary-incoterms", "glossary-commercial-invoice", "glossary-packing-list"], primarySources: [ICC_INCOTERMS_SOURCE],
    body: `## Meaning

EXW stands for Ex Works. The seller makes the goods available to the buyer at the named place, commonly the seller’s premises or another specified location, under the conditions of the selected Incoterms rule.

## Operational implications

EXW places substantial transport and formalities responsibilities on the buyer. The parties should confirm whether the buyer can practically perform the required actions in the seller’s jurisdiction and whether the planned loading arrangement matches the rule.

## Name the place precisely

A warehouse name alone may be ambiguous. Include enough location detail for both parties and their logistics providers to identify where availability and collection are expected.

${jurisdictionCallout}

## Questions before selection

- Who will load the collecting vehicle?
- Can the buyer perform or arrange the relevant export formalities?
- What evidence will show that the goods were made available and collected?
- Would another rule better reflect the parties’ actual capabilities?

The answer should follow the real transaction, not a default term printed on an old template.` }),

  createPublishedContent({
    id: "glossary-bill-of-lading", slug: "bill-of-lading", category: "glossary", title: "Bill of Lading",
    summary: "A bill of lading is a transport document used in sea carriage, with functions that depend on its form and governing framework.",
    excerpt: "Understand the bill of lading as a receipt, evidence of carriage terms, and potentially a document of title.",
    tags: ["bill of lading", "shipping", "transport document"], seoTitle: "Bill of Lading Explained | Glossary",
    seoDescription: "Learn the core functions of a bill of lading and the details parties should verify before relying on it.",
    relatedArticles: ["glossary-fob", "glossary-commercial-invoice", "glossary-packing-list"],
    body: `## Meaning

A bill of lading is issued in connection with carriage of goods by sea. It commonly functions as a receipt for goods and evidence of the contract of carriage. Depending on its form and the applicable legal framework, it may also operate as a document of title.

## Information to review

Check the shipper and consignee details, vessel and voyage information, ports, goods description, package count, marks, weight, date, and statements about the apparent condition of the goods. Compare these details with the commercial invoice, packing list, and contractual instructions.

## Original and electronic handling

The consequences of an original, negotiable, non-negotiable, sea waybill, or electronic record differ. Release procedures and endorsement requirements must be confirmed with the carrier, bank where applicable, contract, and qualified advisers.

:::warning Do not treat every transport record alike
Document functions and legal effects vary by type, governing law, carriage terms, and jurisdiction. This overview is educational and does not determine whether a specific document transfers title or permits cargo release.
:::

## Good control practice

Use consistent references across documents, restrict changes after issuance, and resolve discrepancies promptly. A small difference in party names, quantities, or shipment dates can disrupt transport, payment, or clearance workflows.` }),

  createPublishedContent({
    id: "glossary-commercial-invoice", slug: "commercial-invoice", category: "glossary", title: "Commercial Invoice",
    summary: "A commercial invoice records the seller’s billing information and key data about a sale of goods.",
    excerpt: "Learn what a commercial invoice communicates and why consistency across trade documents matters.",
    tags: ["commercial invoice", "trade documents", "payment"], seoTitle: "Commercial Invoice Meaning | Glossary",
    seoDescription: "Understand the purpose and common data elements of a commercial invoice in an international goods transaction.",
    relatedArticles: ["customs-commercial-invoice", "glossary-packing-list", "glossary-letter-of-credit"], primarySources: [UNECE_TRADE_DOCUMENTS_SOURCE],
    body: `## Meaning

A commercial invoice is the seller’s document describing the goods sold, the parties, price, currency, and other commercial details. It supports payment and may provide data used by carriers, banks, customs authorities, and other participants.

## Common information

Typical fields include seller and buyer details, invoice number and date, purchase or contract reference, goods description, quantity, unit price, total amount, currency, delivery and payment terms, and relevant transport or package references.

## Consistency matters

Names, descriptions, quantities, values, currency, and references should align with the contract and other transaction records. The invoice should describe the actual transaction rather than being copied from an unrelated template.

:::warning Requirements vary
Customs, tax, currency, electronic invoicing, legalization, and language requirements differ by jurisdiction and transaction. Confirm current requirements with the relevant authority and qualified advisers.
:::

## Related documents

The invoice describes the commercial transaction; a packing list focuses on physical packing; and a transport document records carriage information. They serve different purposes even when some data appears in more than one document.` }),

  createPublishedContent({
    id: "glossary-packing-list", slug: "packing-list", category: "glossary", title: "Packing List",
    summary: "A packing list describes how goods are arranged across packages for handling, checking, and reconciliation.",
    excerpt: "Understand the packing list and how it complements invoices and transport documents.",
    tags: ["packing list", "packages", "trade documents"], seoTitle: "Packing List Meaning | Trade Glossary",
    seoDescription: "Learn the purpose and common fields of a packing list used in international goods movements.",
    relatedArticles: ["customs-packing-list", "glossary-commercial-invoice", "glossary-bill-of-lading"], primarySources: [UNECE_TRADE_DOCUMENTS_SOURCE],
    body: `## Meaning

A packing list describes the physical composition of a consignment. It helps the buyer, carrier, warehouse, inspector, and other authorized parties identify packages and reconcile their contents.

## Common information

It commonly includes seller and consignee references, package numbers and types, marks, item descriptions, quantities by package, dimensions, net weight, gross weight, and totals. The appropriate fields depend on the shipment.

## Relationship to the invoice

The commercial invoice focuses on the sale and value. The packing list focuses on how the goods are packed. Shared descriptions, quantities, and references should be consistent, while commercial values may not belong on the packing list.

:::warning No universal template
Required fields and acceptable formats vary by carrier, mode, contract, destination, authority, and commodity. Confirm the requirements for the actual movement.
:::

## Quality checks

Use unique package identifiers, verify totals mathematically, distinguish net from gross weight, and ensure units are explicit. Update the list if packing changes before dispatch and keep the final version aligned with package markings.` }),

  createPublishedContent({
    id: "glossary-letter-of-credit", slug: "letter-of-credit", category: "glossary", title: "Letter of Credit",
    summary: "A letter of credit is a bank undertaking to honor a complying presentation under stated terms and conditions.",
    excerpt: "Understand the parties, documentary focus, and discrepancy risk in a letter-of-credit transaction.",
    tags: ["letter of credit", "trade finance", "documents"], seoTitle: "Letter of Credit Explained | Glossary",
    seoDescription: "Learn the basic structure of a documentary letter of credit and why precise document compliance matters.",
    relatedArticles: ["glossary-commercial-invoice", "glossary-bill-of-lading", "glossary-cif"],
    body: `## Meaning

A documentary letter of credit is an undertaking issued by a bank at an applicant’s request in favor of a beneficiary. Payment or another form of honor depends on presentation of documents that comply with the credit’s terms and the rules incorporated into it.

## Main participants

The buyer is commonly the applicant, the seller the beneficiary, and the issuing bank provides the undertaking. Other banks may advise, confirm, nominate, negotiate, or reimburse depending on the structure.

## Documents, not the goods

Banks examine the presentation described by the credit. They do not ordinarily inspect the underlying goods. Commercial invoices, transport documents, insurance documents, certificates, and other required records therefore need careful preparation and internal consistency.

:::warning Specialist review is important
Banking rules, sanctions controls, governing law, deadlines, and document standards can materially affect a transaction. Obtain current guidance from the participating banks and qualified trade-finance advisers.
:::

## Reduce discrepancy risk

Review the credit immediately after issuance. Check names, amounts, dates, shipment terms, document wording, presentation period, and expiry details. Request necessary amendments early rather than expecting a bank to overlook a mismatch.` }),
] as const;
