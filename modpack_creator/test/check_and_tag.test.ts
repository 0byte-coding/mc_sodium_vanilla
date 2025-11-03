import { afterEach, beforeEach, describe, expect, it, jest, spyOn } from "bun:test"
import { check_and_tag } from "../src/check_and_tag"
import * as export_modpack from "../src/export_modpack"
import * as fetch_with_retry from "../src/fetch_with_retry"
import * as git_tag_manager from "../src/git_tag_manager"
import * as install_mods from "../src/install_mods"
import type { ModInstallationState } from "../src/types"
import * as update_detector from "../src/update_detector"
import * as update_readme from "../src/update_readme"
import * as version_discovery from "../src/version_discovery"
import * as write_mod_list from "../src/write_mod_list"

describe("check_and_tag", () => {
  // Mock installation result
  const mock_installation_result: ModInstallationState = {
    successful: [{ method: "modrinth", identifier: "sodium", category: "optimization" }],
    failed: [],
    alternative_installed: []
  }

  // Store original console methods
  let original_log: typeof console.log
  let original_error: typeof console.error

  beforeEach(() => {
    // Mock console to suppress output during tests
    original_log = console.log
    original_error = console.error
    console.log = () => {}
    console.error = () => {}
  })

  afterEach(() => {
    // Restore console
    console.log = original_log
    console.error = original_error

		// Restore all spies after each test
		jest.restoreAllMocks()
  })

  it("should return false when no changes detected and no new MC versions", async () => {
    // Mock Mojang service check
    spyOn(fetch_with_retry, "fetch_with_retry").mockResolvedValue({
      ok: true,
      status: 200
    } as Response)

    // Mock get_current_minecraft_versions to return existing versions
    spyOn(version_discovery, "get_current_minecraft_versions").mockResolvedValue(["1.14", "1.14.1", "1.14.2"])

    // Mock find_latest_tag to return existing tags
    const find_latest_tag_spy = spyOn(git_tag_manager, "find_latest_tag")
    find_latest_tag_spy.mockImplementation(async (mc_version: string) => {
      return `${mc_version}_0.1.6`
    })

    // Mock find_highest_global_version
    spyOn(git_tag_manager, "find_highest_global_version").mockResolvedValue("0.1.6")

    // Mock install_packwiz_content
    spyOn(install_mods, "install_packwiz_content").mockResolvedValue(mock_installation_result)

    // Mock export_modpack
    spyOn(export_modpack, "export_modpack").mockResolvedValue("mock_export_path.zip")

    // Mock save_installation_state
    spyOn(write_mod_list, "save_installation_state").mockResolvedValue()

    // Mock update_readme
    spyOn(update_readme, "update_readme").mockResolvedValue()

    // Mock needs_update to return false (no changes)
    spyOn(update_detector, "needs_update").mockResolvedValue(false)

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

		const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockImplementation(async () => {})

    // Execute
    const result = await check_and_tag()

    // Verify
    expect(result).toBe(false)

    // Verify that no tags were created (create_tag_at_commit should not be called)
    expect(create_tag_spy).toHaveBeenCalledTimes(0)
  })

  it("should increment version to 0.1.7 when no changes but 2 new MC versions added", async () => {
    // Mock Mojang service check
    spyOn(fetch_with_retry, "fetch_with_retry").mockResolvedValue({
      ok: true,
      status: 200
    } as Response)

    // Mock get_current_minecraft_versions to return 2 new versions
    spyOn(version_discovery, "get_current_minecraft_versions").mockResolvedValue(["1.14", "1.14.1", "1.14.2", "1.14.3", "1.14.4"])

    // Mock find_latest_tag - existing versions have tags, new ones don't
    const find_latest_tag_spy = spyOn(git_tag_manager, "find_latest_tag")
    find_latest_tag_spy.mockImplementation(async (mc_version: string) => {
      if (["1.14", "1.14.1", "1.14.2"].includes(mc_version)) {
        return `${mc_version}_0.1.6`
      }
      return null // New versions don't have tags
    })

    // Mock find_highest_global_version
    spyOn(git_tag_manager, "find_highest_global_version").mockResolvedValue("0.1.6")

    // Mock increment_version
    spyOn(git_tag_manager, "increment_version").mockReturnValue("0.1.7")

    // Mock install_packwiz_content
    spyOn(install_mods, "install_packwiz_content").mockResolvedValue(mock_installation_result)

    // Mock export_modpack
    spyOn(export_modpack, "export_modpack").mockResolvedValue("mock_export_path.zip")

    // Mock save_installation_state
    spyOn(write_mod_list, "save_installation_state").mockResolvedValue()

    // Mock update_readme
    spyOn(update_readme, "update_readme").mockResolvedValue()

    // Mock needs_update to return false (no changes)
    spyOn(update_detector, "needs_update").mockResolvedValue(false)

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

    // Mock create_tag_at_commit
    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock parse_tag
    spyOn(git_tag_manager, "parse_tag").mockImplementation((tag: string) => {
      const match = tag.match(/^(\d+\.\d+(?:\.\d+)?)_(\d+\.\d+\.\d+)$/)
      if (match?.[1] && match[2]) {
        return {
          mc_version: match[1],
          modpack_version: match[2]
        }
      }
      return null
    })

    // Mock compare_versions
    spyOn(version_discovery, "compare_versions").mockReturnValue(0)

    // Mock Bun.$ for git commands
    const git_push_mock = spyOn(globalThis, "$" as any).mockImplementation(() => ({
      quiet: () => Promise.resolve({ text: () => Promise.resolve("") })
    }))

    // Execute
    const result = await check_and_tag()

    // Verify
    expect(result).toBe(true)

    // Verify that tags were created for all 5 versions with version 0.1.7
    expect(create_tag_spy).toHaveBeenCalledTimes(5)

    // Check that all versions got 0.1.7 tags
    const expected_tags = ["1.14_0.1.7", "1.14.1_0.1.7", "1.14.2_0.1.7", "1.14.3_0.1.7", "1.14.4_0.1.7"]

    for (const expected_tag of expected_tags) {
      expect(create_tag_spy).toHaveBeenCalledWith(expected_tag, expect.any(String), "abc123def456")
    }

    // Clean up
    git_push_mock.mockRestore()
  })

  it("should increment version to 0.1.7 when changes detected and 2 new MC versions added", async () => {
    // Mock Mojang service check
    spyOn(fetch_with_retry, "fetch_with_retry").mockResolvedValue({
      ok: true,
      status: 200
    } as Response)

    // Mock get_current_minecraft_versions to return 2 new versions
    spyOn(version_discovery, "get_current_minecraft_versions").mockResolvedValue(["1.14", "1.14.1", "1.14.2", "1.14.3", "1.14.4"])

    // Mock find_latest_tag - existing versions have tags, new ones don't
    const find_latest_tag_spy = spyOn(git_tag_manager, "find_latest_tag")
    find_latest_tag_spy.mockImplementation(async (mc_version: string) => {
      if (["1.14", "1.14.1", "1.14.2"].includes(mc_version)) {
        return `${mc_version}_0.1.6`
      }
      return null // New versions don't have tags
    })

    // Mock find_highest_global_version
    spyOn(git_tag_manager, "find_highest_global_version").mockResolvedValue("0.1.6")

    // Mock increment_version
    spyOn(git_tag_manager, "increment_version").mockReturnValue("0.1.7")

    // Mock install_packwiz_content
    spyOn(install_mods, "install_packwiz_content").mockResolvedValue(mock_installation_result)

    // Mock export_modpack
    spyOn(export_modpack, "export_modpack").mockResolvedValue("mock_export_path.zip")

    // Mock save_installation_state
    spyOn(write_mod_list, "save_installation_state").mockResolvedValue()

    // Mock update_readme
    spyOn(update_readme, "update_readme").mockResolvedValue()

    // Mock needs_update - simulate changes detected for version 1.14.1
    const needs_update_spy = spyOn(update_detector, "needs_update")
    needs_update_spy.mockImplementation(async (mc_version: string) => {
      return mc_version === "1.14.1" // Only 1.14.1 has changes
    })

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("old_commit_hash")

    // Mock create_tag_at_commit
    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock parse_tag
    spyOn(git_tag_manager, "parse_tag").mockImplementation((tag: string) => {
      const match = tag.match(/^(\d+\.\d+(?:\.\d+)?)_(\d+\.\d+\.\d+)$/)
      if (match?.[1] && match[2]) {
        return {
          mc_version: match[1],
          modpack_version: match[2]
        }
      }
      return null
    })

    // Mock compare_versions
    spyOn(version_discovery, "compare_versions").mockImplementation((v1: string, v2: string) => {
      if (v1 === v2) return 0
      return v1 > v2 ? 1 : -1
    })

    // Mock Bun.$ for git commands
    const git_commands: Record<string, string> = {
      "git status --porcelain": "M modpack_creator/src/mod_list.ts\n", // Changes for 1.14.1
      "git rev-parse HEAD": "new_commit_hash",
      "git rev-parse origin/main": "remote_commit_hash"
    }

    const git_mock = spyOn(globalThis, "$" as any).mockImplementation((strings: TemplateStringsArray) => {
      const command = (strings[0] || "").trim()
      return {
        quiet: () =>
          Promise.resolve({
            text: () => Promise.resolve(git_commands[command] || "")
          }),
        text: () => Promise.resolve(git_commands[command] || "")
      }
    })

    // Execute
    const result = await check_and_tag()

    // Verify
    expect(result).toBe(true)

    // Verify that tags were created
    // - 1 changed version (1.14.1) should have commit + tag
    // - 4 unchanged versions (1.14, 1.14.2, 1.14.3, 1.14.4) should only get tags
    // Total: 5 tag creations
    expect(create_tag_spy).toHaveBeenCalledTimes(5)

    // Check that all versions got 0.1.7 tags
    const expected_tags = ["1.14_0.1.7", "1.14.1_0.1.7", "1.14.2_0.1.7", "1.14.3_0.1.7", "1.14.4_0.1.7"]

    for (const expected_tag of expected_tags) {
      expect(create_tag_spy).toHaveBeenCalledWith(expected_tag, expect.any(String), expect.any(String))
    }

    // Verify that git commit was called for the changed version
    expect(git_mock).toHaveBeenCalledWith(expect.arrayContaining(["git commit -m "]))

    // Clean up
    git_mock.mockRestore()
  })
})
