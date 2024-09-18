{ pkgs }: {
	deps = [
		pkgs.ffmpeg.bin
<<<<<<< HEAD
  pkgs.nodejs-16_x
        pkgs.nodePackages.typescript-language-server
        pkgs.yarn
        pkgs.replitPackages.jest
	];
=======
    pkgs.nodejs-18_x
    pkgs.libuuid
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
	];
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.libuuid];
  };
>>>>>>> non-fork/live-version
}