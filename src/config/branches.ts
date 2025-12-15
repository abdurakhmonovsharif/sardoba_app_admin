type BranchDefinition = {
  label: string;
  value: string;
};

export const BRANCHES: BranchDefinition[] = [
  { label: "SARDOBA_GEOFIZIKA", value: "139235" },
  { label: "SARDOBA_GIDIVON", value: "157757" },
  { label: "SARDOBA_SEVERNIY", value: "139350" },
  { label: "SARDOBA_MK5", value: "139458" },
];

const branchLabelMap = new Map<string, string>();
BRANCHES.forEach((branch) => branchLabelMap.set(branch.value, branch.label));

export const getBranchLabel = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return undefined;
  const stringValue = typeof value === "number" ? value.toString() : value;
  return branchLabelMap.get(stringValue);
};
