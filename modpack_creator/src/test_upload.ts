import { resolve } from "node:path"
import { config } from "./config"
import { upload_to_modrinth } from "./upload_to_modrinth"

const root_dir = resolve(__dirname, "../..")
const path = await resolve(root_dir, "Sodium Vanilla-1.21.10_0.1.6_full.mrpack")

const result = await upload_to_modrinth({
  file_path: path,
  version_number: `${config.app.mc_version}_safe`,
  version_title: `Sodium Vanilla ${config.app.mc_version} (Safe)`,
  changelog: `Safe to use version for servers for Minecraft ${config.app.mc_version}`,
  project_id: config.app.modrinth_project_id,
  game_versions: [config.app.mc_version],
  loaders: ["fabric"]
})
console.log(result)
