# MeshWriter-Font

Generate fonts for BABYLON MeshWriter.&nbsp;
(https://github.com/briantbutton/meshwriter)

## Dependencies

Converting new font with MeshWriter-Font requires **nodejs**.&nbsp;
Making a new minified build of MeshWriter with custom font collections also requires **npm** and **webpack**.&nbsp;
(Note to reader:  If you notice undocumented dependencies, let me know.)&nbsp;

## Recipe

Here is how the author builds a new font.&nbsp;

### Set up directories

Download the MeshWriter repo and MeshWriter-Font repo side by side onto your dev machine.

	Follow this directory structure and naming
	(Note that both directories use lowercase letters.  Naming matters.)

	ParentDir
	   |
	   + - - meshwriter
	   |   + - fonts                        // MeshWriter font files will be written here
	   |   + - earcut
	   |
	   + - - meshwriter-font
	       + - fonts                        // You will be placing .ttf/.otf files here
	       + - opentype
	       + - js

All done with setup.

### Place new font files

Place a font file, hypothetically called 'FooBar-Book.ttf', into /meshwriter-font/fonts.&nbsp;

### Select glyph coverage

Open config.js.&nbsp;
Do you like the default-coverage list?&nbsp;
If so, you are done.&nbsp;
Otherwise, put coverage for your font into config.js.&nbsp;
Like this:

	"foobar-book"   : [	
	  "a","b","c","A","B","C","1","2","3"
	],

### Start node, load meshwriter-font and run it

From the directory, /meshwriter-font, invoke **node**:

	> require("./index")
	{}
	> convertFontFile({suffix:"ttf",name:"FooBar-Book",compress:true})
	[ 
	  'a', 'b', 'c',
	  'A', 'B', 'C',
	  '1', '2', '3'
	]
	undefined
	Wrote MeshWriter font file to '../meshwriter/fonts/foobar-book.js'

That's it!  

### Packaging MeshWriter with your new fonts

At this point, the action returns to the /meshwriter directory.&nbsp;
The instructions for making a new build are found here:  https://github.com/briantbutton/meshwriter/tree/master/fonts

