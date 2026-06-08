{
  description = "Elo Leaderboard - Next.js app";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        vercel = pkgs.writeShellScriptBin "vercel" ''
          exec ${pkgs.pnpm_9}/bin/pnpx vercel "$@"
        '';
        supabase = pkgs.writeShellScriptBin "supabase" ''
          exec ${pkgs.pnpm_9}/bin/pnpx supabase "$@"
        '';
        toolchain = [
          pkgs.nodejs_22
          pkgs.pnpm_9
          vercel
          supabase
        ];
      in
      {
        devShells.default = pkgs.mkShellNoCC {
          packages = toolchain;
        };

        packages.toolchain = pkgs.buildEnv {
          name = "elo-leaderboard-toolchain";
          paths = toolchain;
        };
      }
    );
}
