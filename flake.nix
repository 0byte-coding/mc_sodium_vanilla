{
  description = "Sodium Vanilla Minecraft Modpack Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # packwiz is available in nixpkgs
        packwiz = pkgs.packwiz;

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Bun runtime for TypeScript tooling
            bun

            # packwiz for modpack management
            packwiz

            # Git for version control
            git

            # Node.js (some tools might need it)
            nodejs_22

            # TypeScript
            typescript
          ];

          shellHook = ''
            echo "🚀 Sodium Vanilla Modpack Development Environment"
            echo "================================================"
            echo ""
            echo "Available tools:"
            echo "  - bun $(bun --version)"
            echo "  - packwiz (installed)"
            echo "  - git $(git --version | cut -d' ' -f3)"
            echo "  - node $(node --version)"
            echo ""
            echo "Quick start:"
            echo "  cd modpack_creator && bun install    # Install dependencies"
            echo "  cd modpack_creator && bun run dev    # Run modpack creator"
            echo "  packwiz refresh                      # Refresh packwiz index"
            echo ""
            echo "Common commands:"
            echo "  bun run check_and_test               # Run checks and tests"
            echo "  bun run dev_full                     # Create full modpack"
            echo "  bun run dev_safe                     # Create safe modpack"
            echo ""

            # Set up environment variables if .env exists
            if [ -f modpack_creator/.env ]; then
              echo "✓ Found modpack_creator/.env"
            else
              echo "⚠ No .env file found. Copy modpack_creator/.env.example to modpack_creator/.env"
            fi
            echo ""
          '';

          # Environment variables
          PACKWIZ_PATH = "${packwiz}/bin/packwiz";
        };
      }
    );
}
