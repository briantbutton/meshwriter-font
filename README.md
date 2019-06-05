# MeshWriter-Font

Generate fonts for BABYLON MeshWriter.&nbsp;
https://github.com/briantbutton/meshwriter

This repo is still "pre-release".&nbsp;
Contact the author for more information.

## Dependencies

MeshWriter-Font requires npm and webpack.&nbsp;
(Note to reader:  If you notice undocumented dependencies, let me know.)&nbsp;

## Recipe

Here is how the author builds a new font.&nbsp;

	Download the MeshWriter repo and the MeshWriter-Font repo on your machine
	Follow this directory structure and naming
	ParentDir
	  + meshwriter
	    + fonts
	    + earcut
	  + meshwriter-font
	    + fonts                        // Place .ttf and .otf files here
	    + opentype
	    + js

	Place your font file 'FooBar.ttf' in meshwriter-font/fonts
	Then in meshwriter-font, start node
	> require("./index")
	> convertFontFile({suffix:"ttf",name:"FooBar",compress:true})

	They should be 'sibling' directories, in the same parent directory
	Both directory names should be in lower-case
	$ copy the 
	$ cd meshwrit

