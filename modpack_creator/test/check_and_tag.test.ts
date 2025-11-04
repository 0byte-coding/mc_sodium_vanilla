import { afterEach, beforeEach, describe, expect, it, jest, spyOn } from "bun:test"
import * as check_and_tag_file from "../src/check_and_tag"
import * as export_modpack from "../src/export_modpack"
import * as git_tag_manager from "../src/git_tag_manager"
import * as install_mods from "../src/install_mods"
import type { ModInstallationState } from "../src/types"
import * as update_detector from "../src/update_detector"
import * as update_readme from "../src/update_readme"
import * as version_discovery from "../src/version_discovery"
import * as write_mod_list from "../src/write_mod_list"

const mock_installation_result: ModInstallationState = {
  successful: [{ method: "modrinth", identifier: "sodium", category: "optimization" }],
  failed: [],
  alternative_installed: []
}

beforeEach(() => {
  spyOn(check_and_tag_file, "check_mojang_service_availability").mockImplementation(async () => {})
  spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()
  spyOn(git_tag_manager, "push_local_git_tags").mockResolvedValue()
  spyOn(install_mods, "install_packwiz_content").mockResolvedValue(mock_installation_result)
  spyOn(export_modpack, "export_modpack").mockResolvedValue("mock_export_path.zip")
  spyOn(write_mod_list, "save_installation_state").mockResolvedValue()
  spyOn(update_readme, "update_readme").mockResolvedValue()
  spyOn(git_tag_manager, "push_tag").mockResolvedValue()
})

afterEach(() => {
  // Restore all spies after each test
  jest.restoreAllMocks()
})

describe("check_and_tag", () => {
  // Mock installation result
  const _mock_installation_result: ModInstallationState = {
    successful: [{ method: "modrinth", identifier: "sodium", category: "optimization" }],
    failed: [],
    alternative_installed: []
  }

  it("should return false when no changes detected and no new MC versions", async () => {
    // Mock get_current_minecraft_versions to return existing versions
    spyOn(version_discovery, "get_current_minecraft_versions").mockResolvedValue(["1.14", "1.14.1", "1.14.2"])

    // Mock find_latest_tag to return existing tags
    const find_latest_tag_spy = spyOn(git_tag_manager, "find_latest_tag")
    find_latest_tag_spy.mockImplementation(async (mc_version: string) => {
      return `${mc_version}_0.1.6`
    })

    // Mock find_highest_global_version
    spyOn(git_tag_manager, "find_highest_global_version").mockResolvedValue("0.1.6")

    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock needs_update to return false (no changes)
    spyOn(update_detector, "needs_update").mockResolvedValue(false)

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

    spyOn(git_tag_manager, "check_and_commit").mockResolvedValue({ had_changes: false, commit_hash: undefined })
    spyOn(git_tag_manager, "sync_local_head_to_remote").mockResolvedValue("abc123def456")

    // Execute
    const result = await check_and_tag_file.check_and_tag()

    // Verify
    expect(result).toBe(false)

    // Verify that no tags were created (create_tag_at_commit should not be called)
    expect(create_tag_spy).toHaveBeenCalledTimes(0)
  })

  it("should create tags even when no tags are present with version 0.1.0", async () => {
    // Mock get_current_minecraft_versions to return existing versions
    spyOn(version_discovery, "get_current_minecraft_versions").mockResolvedValue(["1.14", "1.14.1", "1.14.2"])

    // Mock find_latest_tag to return existing tags
    const find_latest_tag_spy = spyOn(git_tag_manager, "find_latest_tag")
    find_latest_tag_spy.mockImplementation(async (_mc_version: string) => {
      return null
    })

    // Mock find_highest_global_version
    spyOn(git_tag_manager, "find_highest_global_version").mockResolvedValue("0.0.0")

    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock needs_update to return true since they are all new
    spyOn(update_detector, "needs_update").mockResolvedValue(true)

    // Mock get_tag_commit_hash
    const spy_get_tag_commit_hash = spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

    spyOn(git_tag_manager, "check_and_commit").mockResolvedValue({ had_changes: true, commit_hash: "abc123def456" })
    spyOn(git_tag_manager, "sync_local_head_to_remote").mockResolvedValue("abc123def456")

    // Execute
    const result = await check_and_tag_file.check_and_tag()

    // Verify
    expect(result).toBe(true)

    // Verify that tags were created for all 3 new MC versions
    expect(create_tag_spy).toHaveBeenCalledTimes(3)
    expect(spy_get_tag_commit_hash).toHaveBeenCalledTimes(0)

    // Check that all versions got 0.1.0 tags
    const expected_tags = ["1.14_0.1.0", "1.14.1_0.1.0", "1.14.2_0.1.0"]

    for (const expected_tag of expected_tags) {
      expect(create_tag_spy).toHaveBeenCalledWith(expected_tag, expect.any(String), "abc123def456")
    }
  })

  it("should increment version to 0.1.7 when no changes but 2 new MC versions added", async () => {
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

    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock needs_update only for new versions
    spyOn(update_detector, "needs_update").mockImplementation(async (mc_version: string, _new_state: ModInstallationState) => {
      const latest_tag = await find_latest_tag_spy(mc_version)

      // If no tag exists, this is a new version - need to upload
      if (!latest_tag) {
        return true
      }
      return false // if not new, return false
    })

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

    spyOn(git_tag_manager, "check_and_commit").mockResolvedValue({ had_changes: false, commit_hash: undefined })
    spyOn(git_tag_manager, "sync_local_head_to_remote").mockResolvedValue("abc123def456")

    // Execute
    const result = await check_and_tag_file.check_and_tag()

    // Verify
    expect(result).toBe(true)

    // Verify that no tags were created (create_tag_at_commit should not be called)
    expect(create_tag_spy).toHaveBeenCalledTimes(5)

    // Check that all versions got 0.1.7 tags
    const expected_tags = ["1.14_0.1.7", "1.14.1_0.1.7", "1.14.2_0.1.7", "1.14.3_0.1.7", "1.14.4_0.1.7"]

    for (const expected_tag of expected_tags) {
      expect(create_tag_spy).toHaveBeenCalledWith(expected_tag, expect.any(String), "abc123def456")
    }
  })

  it("should increment version to 0.1.7 when changes detected and 2 new MC versions added", async () => {
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

    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock needs_update only for new versions
    spyOn(update_detector, "needs_update").mockImplementation(async (mc_version: string, _new_state: ModInstallationState) => {
      const latest_tag = await find_latest_tag_spy(mc_version)

      // If no tag exists, this is a new version - need to upload
      if (!latest_tag) {
        return true
      }
      // only detect changes simulate for version 1.14.1
      if (mc_version === "1.14.1") return true
      return false // if not new, return false
    })

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

    spyOn(git_tag_manager, "check_and_commit").mockResolvedValue({ had_changes: false, commit_hash: undefined })
    spyOn(git_tag_manager, "sync_local_head_to_remote").mockResolvedValue("abc123def456")

    // Execute
    const result = await check_and_tag_file.check_and_tag()

    // Verify
    expect(result).toBe(true)

    // Verify that no tags were created (create_tag_at_commit should not be called)
    expect(create_tag_spy).toHaveBeenCalledTimes(5)

    // Check that all versions got 0.1.7 tags
    const expected_tags = ["1.14_0.1.7", "1.14.1_0.1.7", "1.14.2_0.1.7", "1.14.3_0.1.7", "1.14.4_0.1.7"]

    for (const expected_tag of expected_tags) {
      expect(create_tag_spy).toHaveBeenCalledWith(expected_tag, expect.any(String), "abc123def456")
    }
  })

  it("should increment version to 0.1.7 when changes detected but no new mc version", async () => {
    // Mock get_current_minecraft_versions to return 2 new versions
    spyOn(version_discovery, "get_current_minecraft_versions").mockResolvedValue(["1.14", "1.14.1", "1.14.2"])

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

    const create_tag_spy = spyOn(git_tag_manager, "create_tag_at_commit").mockResolvedValue()

    // Mock needs_update only for new versions
    spyOn(update_detector, "needs_update").mockImplementation(async (mc_version: string, _new_state: ModInstallationState) => {
      // only detect changes simulate for version 1.14.1
      if (mc_version === "1.14.1") return true
      return false
    })

    // Mock get_tag_commit_hash
    spyOn(git_tag_manager, "get_tag_commit_hash").mockResolvedValue("abc123def456")

    spyOn(git_tag_manager, "check_and_commit").mockResolvedValue({ had_changes: false, commit_hash: undefined })
    spyOn(git_tag_manager, "sync_local_head_to_remote").mockResolvedValue("abc123def456")

    // Execute
    const result = await check_and_tag_file.check_and_tag()

    // Verify
    expect(result).toBe(true)

    // Verify that no tags were created (create_tag_at_commit should not be called)
    expect(create_tag_spy).toHaveBeenCalledTimes(3)

    // Check that all versions got 0.1.7 tags
    const expected_tags = ["1.14_0.1.7", "1.14.1_0.1.7", "1.14.2_0.1.7"]

    for (const expected_tag of expected_tags) {
      expect(create_tag_spy).toHaveBeenCalledWith(expected_tag, expect.any(String), "abc123def456")
    }
  })
})
