import { classifyIssue } from "./aiRouter";

describe("aiRouter", () => {
  it("falls back to deterministic classifier when external endpoint is not configured", async () => {
    const result = await classifyIssue({
      title: "Dangerous pothole near school",
      description: "There is a road pothole causing accidents and danger at night",
    });

    expect(result.model).toBe("fallback");
    expect(result.category).toBe("Road Damage");
    expect(result.department).toBe("Public Works");
    expect(result.predictedPriority).toBe("HIGH");
  });
});
