import { describe, expect, it } from "vitest";
import { ageAt, formatAge, formatPartialDate, isValidPartialDate, lifeSpan } from "./dates";
import { can } from "./permissions";
import type { PartialDate } from "./types";

const d = (year: number, month: number | null = null, day: number | null = null, circa = false): PartialDate => ({
  year,
  month,
  day,
  circa,
});

describe("dates", () => {
  it("formats dates at the precision they are known", () => {
    expect(formatPartialDate(d(1974, 6, 22))).toBe("22 June 1974");
    expect(formatPartialDate(d(1974, 6))).toBe("June 1974");
    expect(formatPartialDate(d(1962, null, null, true))).toBe("around 1962");
  });

  it("rejects impossible dates", () => {
    expect(isValidPartialDate(d(2023, 2, 29))).toBe(false);
    expect(isValidPartialDate(d(2024, 2, 29))).toBe(true);
    expect(isValidPartialDate(d(1990, null, 4))).toBe(false);
  });

  it("works out age, and admits when it is approximate", () => {
    const birth = d(1951, 3, 14);
    expect(ageAt(birth, d(1974, 6, 22))).toEqual({ years: 23, approximate: false });
    expect(ageAt(birth, d(1974, 3, 13))).toEqual({ years: 22, approximate: false });
    expect(ageAt(birth, d(1974, 3))).toEqual({ years: 23, approximate: true });
    expect(ageAt(birth, d(1962))).toEqual({ years: 11, approximate: true });
    expect(ageAt(birth, d(1950))).toBeNull();
    expect(formatAge(ageAt(birth, d(1951, 8)))).toBe("In the first year");
    expect(formatAge({ years: 11, approximate: true })).toBe("Aged 11 or so");
  });

  it("describes a life span", () => {
    expect(lifeSpan(d(1951), null)).toBe("1951 –");
    expect(lifeSpan(d(1946), d(2019))).toBe("1946 – 2019");
  });
});

describe("permissions", () => {
  const own = { status: "pending" as const, contributorId: "me" };
  const published = { status: "published" as const, contributorId: "me" };

  it("lets contributors edit only their own unpublished moments", () => {
    expect(can.editMoment("contributor", "me", own)).toBe(true);
    expect(can.editMoment("contributor", "me", published)).toBe(false);
    expect(can.editMoment("contributor", "someone-else", own)).toBe(false);
    expect(can.editMoment("editor", "someone-else", published)).toBe(true);
  });

  it("hides unpublished moments from readers", () => {
    expect(can.seeMoment("viewer", "x", own)).toBe(false);
    expect(can.seeMoment("viewer", "x", published)).toBe(true);
    expect(can.seeMoment(null, "x", published)).toBe(false);
  });

  it("only lets the keeper appoint editors", () => {
    expect(can.assignableRoles("owner")).toContain("editor");
    expect(can.assignableRoles("editor")).not.toContain("editor");
    expect(can.assignableRoles("contributor")).toEqual([]);
    expect(can.manageMember("editor", "editor")).toBe(false);
    expect(can.manageMember("owner", "owner")).toBe(false);
  });
});
