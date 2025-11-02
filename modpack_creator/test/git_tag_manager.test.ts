import { describe, expect, it } from "bun:test"
import { find_highest_global_version, increment_version, list_tags_for_version, parse_tag } from "../src/git_tag_manager"

describe("parse_tag", () => {
  it("should parse valid tag with major.minor MC version", () => {
    expect(parse_tag("1.14_0.1.0")).toEqual({
      mc_version: "1.14",
      modpack_version: "0.1.0"
    })
  })

  it("should parse valid tag with major.minor.patch MC version", () => {
    expect(parse_tag("1.21.10_0.1.0")).toEqual({
      mc_version: "1.21.10",
      modpack_version: "0.1.0"
    })
  })

  it("should parse tag with higher modpack version", () => {
    expect(parse_tag("1.21.10_0.1.5")).toEqual({
      mc_version: "1.21.10",
      modpack_version: "0.1.5"
    })
  })

  it("should return null for invalid tag formats", () => {
    expect(parse_tag("invalid")).toBeNull()
    expect(parse_tag("1.14")).toBeNull()
    expect(parse_tag("1.14_0.1")).toBeNull()
    expect(parse_tag("v1.14_0.1.0")).toBeNull()
    expect(parse_tag("1.14_v0.1.0")).toBeNull()
  })
})

describe("increment_version", () => {
  it("should increment patch version", () => {
    expect(increment_version("0.1.0")).toBe("0.1.1")
    expect(increment_version("0.1.5")).toBe("0.1.6")
    expect(increment_version("0.1.9")).toBe("0.1.10")
  })

  it("should handle double-digit patch versions", () => {
    expect(increment_version("0.1.10")).toBe("0.1.11")
    expect(increment_version("0.1.99")).toBe("0.1.100")
  })

  it("should handle different major/minor versions", () => {
    expect(increment_version("1.0.0")).toBe("1.0.1")
    expect(increment_version("2.5.3")).toBe("2.5.4")
  })
})

describe("list_tags_for_version", () => {
  it("should list tags for version 1.14", async () => {
    const tags = await list_tags_for_version("1.14")
    expect(tags).toBeInstanceOf(Array)
    // Should find at least the 1.14_0.1.0 tag that exists
    expect(tags.length).toBeGreaterThan(0)
    expect(tags).toContain("1.14_0.1.0")
  })

  it("should return empty array for non-existent version", async () => {
    const tags = await list_tags_for_version("99.99.99")
    expect(tags).toEqual([])
  })
})

describe("find_highest_global_version", () => {
  it("should find the highest modpack version across all tags", async () => {
    const highest = await find_highest_global_version()
    expect(typeof highest).toBe("string")
    // Should match semantic version format
    expect(highest).toMatch(/^\d+\.\d+\.\d+$/)
    // Should be at least 0.1.0 since we have tags in the repo
    expect(highest.split(".").map(Number)[1]).toBeGreaterThanOrEqual(1)
  })
})
