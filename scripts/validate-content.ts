import { contentRecords } from "../data/content/records";
import { collectContentValidationIssues } from "../lib/content/validation";

const issues = collectContentValidationIssues(contentRecords);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`${issue.code}${issue.recordId ? ` [${issue.recordId}]` : ""}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Content repository is consistent (${contentRecords.length} records).`);
}
