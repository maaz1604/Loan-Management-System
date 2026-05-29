export const runBusinessRuleEngine = (
  user: any,
): { passed: boolean; reason?: string } => {
  // 1. Age Check (23 to 50)
  const age = calculateAge(user.dob);
  if (age < 23 || age > 50) {
    return { passed: false, reason: "Age not between 23 and 50" };
  }

  // 2. Salary Check
  if (user.monthlySalary < 25000) {
    return { passed: false, reason: "Salary below 25,000/month" };
  }

  // 3. PAN Format Check
  const panRegex = /^([A-Z]{3})([PCHFTBGLJG])([A-Z])(\d{4})([A-Z])$/;
  if (!panRegex.test(user.pan)) {
    return { passed: false, reason: "Does not match valid PAN format" };
  }

  // 4. Employment Check
  if (user.employmentMode === "Unemployed") {
    return { passed: false, reason: "Applicant is Unemployed" };
  }

  return { passed: true };
};

// Helper function
function calculateAge(dob: Date) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}
