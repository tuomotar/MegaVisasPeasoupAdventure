/* USES pixi.js and howler.js */
var tabOn 		= true;

function onBlur() {
	tabOn = false;
};
function onFocus(){
	tabOn = true;
};

if (/*@cc_on!@*/false) { // check for Internet Explorer
	document.onfocusin = onFocus;
	document.onfocusout = onBlur;
} else {
	window.onfocus = onFocus;
	window.onblur = onBlur;
}

(function(tt, $) {

var tempCounter = 0;

	//Center loader container
	$(".loaderContainer").css("left", window.innerWidth / 2 + "px"); 

	//Set global object
	var g = { 
		"gameState": "init html", 
		"sprites": {}, 
		"time": {},
		"points": 0,
		"loadedAssets": {}, 
		"mainUrl": "http://localhos:8888/rocket/", 
		"jsonUrl": "http://localhost:8888/rocket/settings.json",
		"current": {"time": {}},
		"stage" : { 
			"mainRendererId": "rendererContainer",
			"helperCanvas": document.createElement('canvas'),
			"mainRenderer": {},
			"rendererContainer": {},
			"rendererGraphicsObjects": [],
			"mainRendererTransparent": true
		 },
		 "tmp": 
		 {
		 	"texture": {}
		 },
		 "oArrays":
		 {
		 	"texts": [],
		 	"collisions": [],
		 	"physics": [],
		 	"audios": []
		 },
		 "soundOn": true
	};

	//Hide main renderer
	$("#" + g.stage.mainRendererId).css("display", "none !imporant;");

	//Helper canvas for bitmap-manipulations
	g.stage.helperCanvasContext 					= g.stage.helperCanvas.getContext("2d");
	g.stage.helperCanvas.id     					= "helperCanvas";
	g.stage.helperCanvas.style.position 			= "absolute";
	document.body.appendChild(g.stage.helperCanvas);
	g.stage.helperCanvas.style.visibility			= "hidden";	


	$(window).load(function()       
	{ 
		//DEBUG
		g.gameState = "HTML loaded. Loading settings-json.";

		// 1. Load settings json
        $.getJSON(g.jsonUrl, function(json) {
        	g.s 		= json;
        	g.gameState = g.s.GAME_STATES.SETTINGS_JSON_LOADED;

        	g.stage.helperCanvas.width 	= g.s.designDim.w;
        	g.stage.helperCanvas.height = g.s.designDim.h;

			//SET MAIN RENDERER BUT DON'T SHOW IT YET
			g.stage.rendererContainer 		= new PIXI.Stage(0xFF0000);
			g.stage.mainRenderer 			= new PIXI.autoDetectRenderer(g.s.designDim.w, g.s.designDim.h, {transparent: g.stage.mainRendererTransparent});
			document.getElementById(g.stage.mainRendererId).appendChild(g.stage.mainRenderer.view);
        	g.mainRendererDim 				= ttScalingManager.initRendererDimensions(g.stage.mainRenderer, g.s.designDim.w, g.s.designDim.h, g.stage.mainRendererId, g.s.nonGameArea.w, g.s.nonGameArea.h);

        	g.gameState = g.s.GAME_STATES.LOADING_SPRITES;
        	ttAssetManager.loadSprites();
        	document.addEventListener('allSpritesCreated', 
        	function (e) 
        	{ 

	        	//CREATE SOUND OBJECTS
	        	g.oArrays.audios = ttAudioManager.loadAudios(g.s.audios);

	        	//CREATE SOUND SEQUENCERS
	        	ttAudioManager.createAudioSequencer(g.s.seq);

	        	//PUT STUFF ON STAGE
	        	ttAssetManager.setSpritesOnStage();

	        	//THIS SHOULD BE DONE AFTER EVERYTHING IS ON STAGE!!!!
	        	ttScalingManager.scaleRenderer();

	        	//RUN
	        	ttMain.initMainLoopAndRun();

        	}, false);
        	

        });
	});


	$(window).resize(function()     
	{ 		 
		ttScalingManager.scaleRenderer();

		//Keep background gradient updated
		//$("body").css("background", "#ffffff");
		$("body").css("background", "-moz-linear-gradient(top,  #FCFBE3,  #000000)");
		$("body").css("background", "-webkit-gradient(linear, left top, left bottom, from(#FCFBE3), to(#000000))");
		$("body").css("filter", "progid:DXImageTransform.Microsoft.gradient(startColorstr='#FCFBE3', endColorstr='#000000'");
		$("body").css("background", "-o-linear-gradient(rgb(252,251,227),rgb(255,255,255))");
	});


	// ASSET MANAGER
	(function(ttAssetManager, $ ) {

		ttAssetManager.loadSprites = function()
		{
			var assetLoader = createPixiLoader();
			function onProgressCallback(e)
			{
				$("#loaderData").html(Math.round(e.progress));
			}			
			assetLoader.on('progress', onProgressCallback).load(function (loader, resources) {

		        $("#loaderData").html(Math.round(loader.progress));
		        $(".loaderContainer").css("display", "none");

		        //Load spritesheet
				for(var i in g.s.assets_bitmap_spritesheet)	  
				{      
					for (var j in g.s.assets_bitmap_spritesheet[i].sprites)
					{
						g.sprites[g.s.assets_bitmap_spritesheet[i].sprites[j].spriteName] 		= PIXI.Sprite.fromFrame(g.s.assets_bitmap_spritesheet[i].sprites[j].fileName);
						g.sprites[g.s.assets_bitmap_spritesheet[i].sprites[j].spriteName].name 	= g.s.assets_bitmap_spritesheet[i].sprites[j].spriteName;
						setSpriteMetadata(g.sprites[g.s.assets_bitmap_spritesheet[i].sprites[j].spriteName], g.s.assets_bitmap_spritesheet[i].sprites[j]);
					}		
				}

				//Set frame metadata for each bitmap in spritesheet
				$.getJSON(g.s.urls.assets + g.s.assets_bitmap_spritesheet.mainSpriteSheet.filename_json, function(json_spritesheet) {
				for(var q in json_spritesheet.frames)
				{
					for(var i in g.s.assets_bitmap_spritesheet)	  
					{      
						for (var j in g.s.assets_bitmap_spritesheet[i].sprites)
						{
							if(q == g.s.assets_bitmap_spritesheet[i].sprites[j].fileName)
							{
								g.s.assets_bitmap_spritesheet[i].sprites[j].frameData = json_spritesheet.frames[q].frame;
							}
						}		
					}
				}
				
				//Roller (PIXI movieclip, has to be loaded separately)
				var frames 	= ["g1.png", "g2.png", "g3.png", "g4.png", "g5.png", "g6.png", "g7.png", "g8.png", "g9.png", "g10.png", "g11.png", "g12.png", "g13.png", "g14.png", "g15.png", "g16.png", "g17.png", "g18.png", "g19.png", "g20.png", "g21.png", "g22.png", "g23.png", "g24.png", "g25.png", "g26.png", "g27.png", "g28.png", "g29.png", "g30.png", "g31.png", "g32.png", "g33.png", "g34.png", "g35.png", "g36.png"];
				g.sprites[g.s.assets_pixi_animated_spritesheet.roller.spriteName] 		= PIXI.extras.MovieClip.fromFrames(frames);
				g.sprites[g.s.assets_pixi_animated_spritesheet.roller.spriteName].name 		= g.s.assets_pixi_animated_spritesheet.roller.spriteName;				
				setSpriteMetadata(g.sprites[g.s.assets_pixi_animated_spritesheet.roller.spriteName], g.s.assets_pixi_animated_spritesheet.roller);					
						

				document.dispatchEvent(new CustomEvent( "allSpritesCreated", { detail: { "temp": "temp" }, bubbles: true, cancelable: true }));
			});	        
		});
		}

		ttAssetManager.setSpritesOnStage = function()
		{
			//THIS HAS TO BE DONE BEFORE THE FIRST SCALING!!!! (everything in design dimensions first!)

			//Add sprites to renderer container
			for(var w in g.sprites)
			{
				g.stage.rendererContainer.addChild(g.sprites[w]);					
			}

			//Create texts and add them to renderer container
			ttTextManager.createTextObjectsFromJson();
		
			for(var w in g.oArrays.texts)
			{
				g.stage.rendererContainer.addChild(g.oArrays.texts[w]);					
			}	

	        //Load highscores
	        ttHighScoreManager.loadTop10();


			//Create textures for different spaceship appearances (spaceship looks like Visa)
			g.sprites["spaceship"].texture01 	= PIXI.Texture.fromFrame('visa1.png');		
			g.sprites["spaceship"].texture02  	= PIXI.Texture.fromFrame('visa3.png');
			g.sprites["spaceship"].texture03  	= PIXI.Texture.fromFrame('visa2.png');

			g.sprites["spaceship"].checkVisualAsset = function()
			{
				if(g.sprites["spaceship"].velocity.x < -0.00001)
				{
					g.sprites["spaceship"].texture = g.sprites["spaceship"].texture02;
				}
				else if(g.sprites["spaceship"].velocity.x > 0.00001)
				{
					g.sprites["spaceship"].texture = g.sprites["spaceship"].texture03;
				}
				else
				{
					g.sprites["spaceship"].texture = g.sprites["spaceship"].texture01;
				}
			}

			//Sound on / off click
			g.sprites["sound_on"].interactive = true;
			g.sprites["sound_off"].interactive = true;

			keyN.press = function(data) {	
				//g.soundOn = true;
				g.sprites["sound_on"].visible 	= false;
				g.sprites["sound_off"].visible 	= true;
				Howler.unmute();
			}	

			keyM.press = function(data) {	
				//g.soundOn = false;
				g.sprites["sound_on"].visible 	= true;
				g.sprites["sound_off"].visible 	= false;
				Howler.mute();
			}	

			//Start positions
			g.sprites["spaceship"].setStartPoint = g.sprites["level250"].setStartPoint = g.sprites["roller"].setStartPoint = g.sprites["arrowUp"].setStartPoint = g.sprites["arrowDown"].setStartPoint = g.sprites["arrowLeft"].setStartPoint = g.sprites["arrowRight"].setStartPoint = g.sprites["sound_off"].setStartPoint  = g.sprites["sound_on"].setStartPoint  = function()
			{
				if(this.stageEnter.position.random == true)
				{
					this.position.x = Math.floor(Math.random() * (this.stageEnter.position.xPixMax - this.stageEnter.position.xPixMin)) + this.stageEnter.position.xPixMin;
					this.position.y = Math.floor(Math.random() * (this.stageEnter.position.yPixMax - this.stageEnter.position.yPixMin)) + this.stageEnter.position.yPixMin;
				}
				else
				{
					this.position.x = this.stageEnter.position.xPixMin;
					this.position.y = this.stageEnter.position.yPixMin;
				}				
			}
			
			//Start velocity
			g.sprites["roller"].setStartVel = g.sprites["spaceship"].setStartVel = function()
			{
				var self = this;
				var tmp;
				var multiplierX 	= 1;
				var multiplierDirection = 1;
				
				if(self.stageEnter.velocity.random == true)
				{
					tmp = new Vector(Math.floor(Math.random() * (self.stageEnter.velocity.xPixMax - self.stageEnter.velocity.xPixMin)) + self.stageEnter.velocity.xPixMin, Math.floor(Math.random() * (self.stageEnter.velocity.yPixMax - self.stageEnter.velocity.yPixMin)) + self.stageEnter.velocity.yPixMin);
				}
				else
				{
					if(self === g.sprites["roller"]) 
					{ 
						multiplierDirection =  Math.floor(Math.random() * 2) + 1;
						multiplierX = g.points * 0.2 + 1; 
						if(multiplierDirection < 2) 
						{ 
							multiplierDirection = -1;
						}
						else
						{
							multiplierDirection = 1;
						}					
					}
					tmp = new Vector(self.stageEnter.velocity.xPixMin * multiplierX * multiplierDirection, self.stageEnter.velocity.yPixMin);
				}		
				self.velocity = tmp;
			}	
			
			g.sprites["spaceship"].levelUp = function()
			{
				g.points++;
				g.sprites["roller"].die();				
				g.sprites["spaceship"].setStartVel();
				g.sprites["spaceship"].setStartPoint();	
				g.oArrays.texts["score"].text = g.points;	
				g.oArrays.audios["slurp"].audio.play();
			}

			g.sprites["roller"].die = function()
			{
				g.sprites["roller"].platformHitPlayed 	= false;
				g.sprites["roller"].onSurface			= false;
				g.sprites["roller"].affectedByGravity 	= false;				
				g.sprites["roller"].position.x 			= g.s.designDim.w / 2;
				g.sprites["roller"].position.y 			= 100;
				g.sprites["roller"].acceleration 		= new Vector(0, 0);
				g.sprites["roller"].velocity 			= new Vector(0, 0);

				setTimeout(function () 
				{ 
					g.sprites["roller"].affectedByGravity = true;	
				}, (Math.floor(Math.random() * 50)) + 10 * (1 / (g.points + 1)) * 1000);
			}

			//USER CONTROL STUFF
			g.sprites["bg1"].mousedown = g.sprites["bg1"].touchstart = function(mouseData)
			{
			   g.gameState = g.s.GAME_STATES.START_GAME;
			}
			
			if(g.sprites["spaceship"].userControl.userControlOn == true)
			{
				keyUp.press = keyW.press = function(data) {	

					keysDown["up"] = true;
					g.sprites["arrowUp"].alpha = 0.5;

					//TEMPORARY VELOCITY IMPULSE FORWARD (calculate components!!!!)
					g.sprites["spaceship"].temporaryAccelerationImpulseY = -1 * g.sprites["spaceship"].userControl.keys.keyUpDown.accBurst;
					g.oArrays.audios["engine"].audio.fadeIn(0.7, 50);
				}

				keyUp.release = keyW.release = function(data) {	
					keysDown["up"] = false;
					g.sprites["arrowUp"].alpha = 1;
					g.oArrays.audios["engine"].audio.fadeOut(0.0, 50);
				}

				keyDown.press = keyS.press = function(data) {	
					keysDown["down"] = true;				
					if(!this.onSurface)
					{
						g.sprites["spaceship"].resetVelocityX();
						g.sprites["spaceship"].velocity = new Vector(g.sprites["spaceship"].velocity.x, g.sprites["spaceship"].velocity.y * 0.6);
						//g.sprites["spaceship"].resetVelocity();
						if(this.resetAccelerationX) 
						{ 
							this.resetAccelerationX; 
						}
					}
					g.sprites["arrowDown"].alpha = 0.5;
				}

				keyDown.release = keyS.release = function(data) {	
					keysDown["down"] = false;
					g.sprites["arrowDown"].alpha = 1;
				}

				keyRight.press = keyD.press = function(data) {	
					if(!g.sprites["spaceship"].onSurface) 
					{
						if(keysDown["up"] == true) { keyUp.press(); }
						keysDown["right"] = true;
						if(!g.sprites["spaceship"].onSurface) { g.sprites["spaceship"].rotation += Math.PI / 180 * 5; }	
					}
					else
					{
						g.sprites["spaceship"].velocity.x = g.sprites["spaceship"].velocity.x  + 0.02;
					}
					g.sprites["arrowRight"].alpha = 0.5;
				}		

				keyRight.release = keyD.release = function(data) {
					g.sprites["arrowRight"].alpha = 1;
				}

				keyLeft.press = keyA.press = function(data) {	
					if(!g.sprites["spaceship"].onSurface) 
					{
						if(keysDown["up"] == true) { keyUp.press(); }
						keysDown["left"] = true;
						if(!g.sprites["spaceship"].onSurface) { g.sprites["spaceship"].rotation -= Math.PI / 180 * 5;}
					}
					else
					{
						g.sprites["spaceship"].velocity.x = g.sprites["spaceship"].velocity.x  - 0.02;
					}
					g.sprites["arrowLeft"].alpha = 0.5;
				}		

				keyLeft.release = keyA.release = function(data) {	
					g.sprites["arrowLeft"].alpha = 1;
				}	

				

			}

			g.sprites["spaceship"].checkGameAreaBorders = g.sprites["roller"].checkGameAreaBorders = function()
			{
				//Right
				if(this.position.x + (this.getBounds().width / 2) >= g.s.designDim.w)
				{
					if(this === g.sprites["roller"])
					{
						if(this.getBounds().y < g.s.nonGameArea.y - this.getBounds().width - 10)
						{
							this.velocity.x = -1 * this.velocity.x;
							this.position.x = g.s.designDim.w - (this.getBounds().width/ 2);	
						}
					}
					else
					{
						this.velocity.x = -1 * this.velocity.x;
						this.position.x = g.s.designDim.w - (this.getBounds().width/ 2);
					}
				}
				
				//Left
				if(this.position.x - (this.getBounds().width / 2) <= 0)
				{
					if(this === g.sprites["roller"])
					{
						if(this.getBounds().y < g.s.nonGameArea.y - this.getBounds().width - 10)
						{
							this.velocity.x = -1 * this.velocity.x;
							this.position.x = (this.getBounds().width / 2);	
						}
					}
					else
					{				
						this.velocity.x = -1 * this.velocity.x;
						this.position.x = (this.getBounds().width / 2);
					}
				}
				
				//Top
				if(this.position.y - (this.getBounds().height / 2) <= 0)
				{
					this.velocity.y = -1 * this.velocity.y;
					this.position.y = (this.getBounds().height / 2);
				}

				//Check roller death
				if(this === g.sprites["roller"])
				{
					if(this.x < 0 || this.x > g.s.designDim.w) { this.die(); }
				}
				
			}
			
			//Roller specific
			g.sprites["roller"].visible 		= false;
			g.sprites["roller"].loop 		= true;
			g.sprites["roller"].animationSpeed 	= 0.5;
			g.sprites["roller"].setDirectionAndAnimationSpeed = function()
			{
				if(this.velocity.x == 0)  	{ if(this.animationSpeed != 0) 	{ this.animationSpeed = 0; } }
				if(this.velocity.x < 0) 	{ this.animationSpeed = -1.8 * Math.abs(this.velocity.x); }
				if(this.velocity.x > 0) 	{ this.animationSpeed = 1.8 * Math.abs(this.velocity.x); }				
			}

			var theStep;
			var theStepMultiplier = 1;			
			
			//Level250 specific
			g.sprites["level250"].kinematicMove = function()
			{
				var mulX = g.points;
				if(g.sprites["level250"].stageEnter.kinematicMotion.direction == "horizontal")
				{
					if(g.sprites["level250"].stageEnter.kinematicMotion.randomVelocity != true)
					{
						theStep = g.sprites["level250"].stageEnter.kinematicMotion.velXMin * 0.02 * (mulX);
						if(this.position.x + theStep >= g.sprites["level250"].stageEnter.kinematicMotion.locXMax) { theStepMultiplier = -1; }
						if(this.position.x - theStep <= g.sprites["level250"].stageEnter.kinematicMotion.locXMin) { theStepMultiplier = 1; }
						this.position.x = this.position.x + g.time.timeDiffNowMs * theStep * theStepMultiplier;						
					}
					this.velocity = new Vector(theStep, 0);
				}		
				g.sprites["hernekeitto"].position.x = g.sprites["level250"].position.x;	
				g.sprites["hernekeitto"].position.y = g.sprites["level250"].position.y - g.sprites["hernekeitto"].height / 2 - g.sprites["level250"].height / 2 - 2;			
			}
			
			//Key assets
			g.sprites["arrowUp"].interactive 		= true;
			g.sprites["arrowDown"].interactive 		= true;
			g.sprites["arrowLeft"].interactive 		= true;
			g.sprites["arrowRight"].interactive 	= true;
			
			g.sprites["arrowUp"].mousedown 		= g.sprites["arrowUp"].touchstart 		= keyUp.press;
			g.sprites["arrowUp"].mouseup 		= g.sprites["arrowUp"].touchend 		= keyUp.release;
			g.sprites["arrowDown"].mousedown 	= g.sprites["arrowDown"].touchstart 	= keyDown.press;
			g.sprites["arrowDown"].mouseup 		= g.sprites["arrowDown"].touchend 		= keyDown.release;
			g.sprites["arrowLeft"].mousedown 	= g.sprites["arrowLeft"].touchstart 	= keyLeft.press;
			g.sprites["arrowLeft"].mouseup 		= g.sprites["arrowLeft"].touchend 		= keyLeft.release;
			g.sprites["arrowRight"].mousedown 	= g.sprites["arrowRight"].touchstart 	= keyRight.press;
			g.sprites["arrowRight"].mouseup 	= g.sprites["arrowRight"].touchend 		= keyRight.release;	
			g.sprites["sound_on"].mousedown 	= g.sprites["sound_on"].touchstart 		= keyN.press; 
			g.sprites["sound_off"].mousedown 	= g.sprites["sound_off"].touchstart 	= keyM.press; 	
		}

		function setSpriteMetadata(sprite, theMetaData)
		{
			for(var j in theMetaData.properties)
			{
				sprite[j] = theMetaData.properties[j];
				if(j == "stageEnter")
				{
					sprite.anchor.x = theMetaData.properties.stageEnter.anchor.x;
					sprite.anchor.y = theMetaData.properties.stageEnter.anchor.y;
				}
			}
		}

		function createPixiLoader()
		{
			var retVal 		= new PIXI.loaders.Loader();
			retVal.baseUrl 	= g.s.urls.assets;

			for(var j in g.s.assets_bitmap_spritesheet)
			{
				retVal.add(g.s.urls.assets + g.s.assets_bitmap_spritesheet[j].filename_image, g.s.urls.assets + g.s.assets_bitmap_spritesheet[j].filename_json);
			}
			
			//Roller
			retVal.add(g.s.urls.assets + g.s.assets_pixi_animated_spritesheet.roller.filename_image, g.s.urls.assets + g.s.assets_pixi_animated_spritesheet.roller.filename_json);
			
			return retVal;
    	}		
	}( window.ttAssetManager = window.ttAssetManager || {}, jQuery ));

	//Main
	(function(ttMain, $) {	

		document.addEventListener('nextRoller', 
		function (e) 
		{ 
			g.sprites["roller"].affectedByGravity = true;
			g.sprites["roller"].setStartVel();	
		}, false);		
		
		ttMain.initMainLoopAndRun = function()
		{
			//Set the game state
			g.gameState = g.s.GAME_STATES.START_START_SCREEN;

			//Run main loop
			ttMain.runMainLoop();
		}

		ttMain.loopCalculateTime = function()
		{
			if(tabOn)
			{
				g.time.timeNowMs         					= new Date().getTime();
				g.time.timeDiffNowMs     					= g.time.timeNowMs - g.time.timePast1Ms;
				g.time.timeDiffNowMs     					= g.time.timeNowMs - g.time.timePast1Ms;
				if(g.time.timeDiffNowMs > 1384410000000)    			{ g.time.timeDiffNowMs = 1; }
				
				//Limit time step
				if(g.time.timeDiffNowMs > g.s.physics.deltaTMax)	{ g.time.timeDiffNowMs = g.s.physics.deltaTMax;	}
				if(g.time.timeDiffNowMs < g.s.physics.deltaTMin)	{ g.time.timeDiffNowMs = g.s.physics.deltaTMin; }
			}


			g.time.timePast1Ms                         = g.time.timeNowMs;             //FOR CALCULATING HOW LONG THIS FRAME TOOK (in next frame)
			g.time.finalCountdownCounterMs             = g.time.finalCountdownCounterMs + g.time.timeDiffNowMs;   
			g.time.timeNowAsSeconds                    = Math.round(g.time.finalCountdownCounterMs / 1000);
			g.time.currentFrameRate                    = Math.round(1000 / g.time.timeDiffNowMs);
			g.time.framerateUpdateCounterMs            = g.time.framerateUpdateCounterMs + g.time.timeDiffNowMs;
			

		}	
		
		ttMain.doPhysicsPart1 = function()
		{
			if(tabOn)
			{
				//Check BB collisions by using Minkowski difference (and if minkowski, then pixel perfect check)
				
				//Physics
				g.sprites["spaceship"].calculatePhysics();
				g.sprites["roller"].calculatePhysics();
				
				//Object to object collisions
				g.sprites["spaceship"].checkIfCollision(g.sprites["roller"]);
				g.sprites["spaceship"].checkIfCollision(g.sprites["level250"]);
				g.sprites["roller"].checkIfCollision(g.sprites["level250"]);
				
			}
		
		}	

		ttMain.doPhysicsPart2 = function()
		{
			if(tabOn)
			{
				//Check ground hit, left, right, top and show right texture of the sprite (ie. left, right and so on)

				//Bottom hit
				g.sprites["spaceship"].checkBottomHit();
				if(!g.sprites["roller"].onSurface)
				{
					g.sprites["roller"].checkBottomHit();
				}
				//Game area border
				g.sprites["spaceship"].checkGameAreaBorders();
				g.sprites["roller"].checkGameAreaBorders();		

				//Kinematic movement
				g.sprites["level250"].kinematicMove();
				
				//After physics
				g.sprites["roller"].setDirectionAndAnimationSpeed();
			}
		}			


		ttMain.runStartStartScreen = function()
		{
			g.oArrays.texts["score"].visible 				= false;
			g.oArrays.texts["top10_1"].visible 				= true;
			g.oArrays.texts["top10_2"].visible 				= true;
			g.oArrays.texts["top10_3"].visible 				= true;
			g.oArrays.texts["top10_4"].visible 				= true;
			g.oArrays.texts["top10_5"].visible 				= true;
			g.oArrays.texts["top10_6"].visible 				= true;
			g.oArrays.texts["top10_7"].visible 				= true;
			g.oArrays.texts["top10_8"].visible 				= true;
			g.oArrays.texts["top10_9"].visible 				= true;
			g.oArrays.texts["top10_10"].visible 			= true;																								
			g.sprites["level250"].visible 					= false;
			g.sprites["bg1"].visible 						= true;
			g.sprites["bg2"].visible 						= false;
			g.sprites["arrowUp"].visible 					= false;
			g.sprites["arrowRight"].visible 				= false;
			g.sprites["arrowDown"].visible 					= false;	
			g.sprites["arrowLeft"].visible 					= false;	
			g.sprites["spaceship"].visible 					= false;
			g.sprites["roller"].visible 					= false;
			g.sprites["hernekeitto"].visible 				= false;				
			g.oArrays.texts["score"].visible 				= false;			
			g.oArrays.texts["score"].position.x 			= g.s.designDim.w / 10  - g.oArrays.texts["score"].width / 2;
			g.oArrays.texts["score"].position.y 			= g.s.designDim.h / 22  - g.oArrays.texts["score"].width / 2;	
			g.oArrays.texts["score"].text 					= 0	

			g.sprites["spaceship"].setStartVel();
			g.sprites["spaceship"].setStartPoint();

			g.sprites["sound_off"].setStartPoint();					
			g.sprites["sound_on"].setStartPoint();	

			ttAudioManager.seq.parts["part1"].playing = true;
			ttAudioManager.seq.parts["part2"].playing = false;

			g.gameState = g.s.GAME_STATES.START_SCREEN;								
		}

		ttMain.runStartScreen = function()
		{
			//g.gameState = g.s.GAME_STATES.START_GAME;
		}

		ttMain.runStartGame = function()
		{
			g.sprites["roller"].die();
			g.oArrays.texts["score"].visible 				= true;
			g.oArrays.texts["top10_1"].visible 				= false;
			g.oArrays.texts["top10_2"].visible 				= false;
			g.oArrays.texts["top10_3"].visible 				= false;
			g.oArrays.texts["top10_4"].visible 				= false;
			g.oArrays.texts["top10_5"].visible 				= false;
			g.oArrays.texts["top10_6"].visible 				= false;
			g.oArrays.texts["top10_7"].visible 				= false;
			g.oArrays.texts["top10_8"].visible 				= false;
			g.oArrays.texts["top10_9"].visible 				= false;
			g.oArrays.texts["top10_10"].visible 			= false;
			g.sprites["level250"].visible 					= true;
			g.sprites["bg1"].visible 						= false;
			g.sprites["bg2"].visible 						= true;
			g.sprites["arrowUp"].visible 					= true;
			g.sprites["arrowRight"].visible 				= true;
			g.sprites["arrowDown"].visible 					= true;	
			g.sprites["arrowLeft"].visible 					= true;	
			g.sprites["spaceship"].visible 					= true;	
			g.sprites["roller"].visible 					= true;		
			g.sprites["hernekeitto"].visible 				= true;	
			g.sprites["roller"].play();
			g.sprites["spaceship"].velocity = new Vector(0,0);
			//g.sprites["roller"].setStartVel();

			//Set start points for certain sprites
			g.sprites["level250"].setStartPoint();
			g.sprites["spaceship"].setStartPoint();
			g.sprites["arrowUp"].setStartPoint();
			g.sprites["arrowDown"].setStartPoint();
			g.sprites["arrowLeft"].setStartPoint();
			g.sprites["arrowRight"].setStartPoint();
			//g.sprites["roller"].setStartPoint();	

			ttAudioManager.seq.parts["part1"].playing = true;
			ttAudioManager.seq.parts["part2"].playing = true;			

			//Zero points
			g.points = 0;
			
			//g.sprites["spaceship"].velocity = new Vector(0, 0);
			g.oArrays.audios["gameStart"].audio.play();
			g.gameState = g.s.GAME_STATES.GAME_ON;
		}

		ttMain.runGameFrame = function()
		{
			if(tabOn)
			{
				if(g.time.timeDiffNowMs > 0)
				{
					//Calculate new positions
					ttMain.doPhysicsPart1();

					//Check collisions and do position and velocity corrections
					ttMain.doPhysicsPart2();	

					g.sprites["spaceship"].checkVisualAsset();
				}
			}			
		}										
		
		ttMain.runMainLoop = function()
		{
			if(tabOn)
			{
				function queue()        { window.requestAnimationFrame(loop); }   
				function loop()
				{
					ttMain.loopCalculateTime();		//THIS HAS TO BE IN THE BEGINNING OF THE LOOP!!!

					//START START_SCREEN (1 frame)
					if(g.gameState == g.s.GAME_STATES.START_START_SCREEN) { ttMain.runStartStartScreen(); }

					//START_SCREEN
					if(g.gameState == g.s.GAME_STATES.START_SCREEN) { ttMain.runStartScreen(); }

					//START GAME (1 frame)
					if(g.gameState == g.s.GAME_STATES.START_GAME) { ttMain.runStartGame(); }				

					//GAME ON
					if(g.gameState == g.s.GAME_STATES.GAME_ON) { ttMain.runGameFrame(); }

					//RENDER
					g.stage.mainRenderer.render(g.stage.rendererContainer);
					ttAudioManager.runSequencer();					
				
					queue();
				}		

				/* Main loop function definitions end here! */
				loop();	//1st call of the loop!
			}
		}			

	}( window.ttMain = window.ttMain || {}, jQuery ));


	// SCALING MANAGER 
	(function(ttScalingManager, $ ) {

		ttScalingManager.mainRenderer;
		ttScalingManager.windowDim 					= { "w": 0, "h": 0 };
		ttScalingManager.gameArea 					= { "w": 0, "h": 0, "l": 0, "r": 0, "t": 0, "b": 0 };
		ttScalingManager.designDim 					= { "w": 0, "h": 0 };
		ttScalingManager.renderObjectId 			= "not_defined";  
		ttScalingManager.scalingFactor	 			= 1; 
		ttScalingManager.nonGameArea 				= { "w": 0, "h": 0}

		ttScalingManager.initRendererDimensions = function(mainRendererTmp, designDimW, designDimH, renderObjectIdTmp, nonGameAreaW, nonGameAreaH)
		{

			//SET ONLY ONCE IN THE BEGINNING
			ttScalingManager.mainRenderer 		= mainRendererTmp;
			ttScalingManager.designDim.w 		= designDimW;
			ttScalingManager.designDim.h 		= designDimH;
			ttScalingManager.renderObjectId 	= renderObjectIdTmp;
			ttScalingManager.nonGameArea.w 		= nonGameAreaW;
			ttScalingManager.nonGameArea.h 		= nonGameAreaH;			

			ttScalingManager.calculateRendererDimensions();
			ttScalingManager.scalingFactor = ttScalingManager.gameArea.w / ttScalingManager.designDim.w;	
	
			return {"w": ttScalingManager.gameArea.w, "h": ttScalingManager.gameArea.h, "l": ttScalingManager.gameArea.l, "r": ttScalingManager.gameArea.r, "t": ttScalingManager.gameArea.t, "b": ttScalingManager.gameArea.b, "scalingFactor": ttScalingManager.scalingFactor};

		}

		ttScalingManager.calculateRendererDimensions = function()
		{		
			ttScalingManager.windowDim.w 	= window.innerWidth;
			ttScalingManager.windowDim.h 	= window.innerHeight;


			if((ttScalingManager.windowDim.h / ttScalingManager.designDim.h) >= 1)
			{
				ttScalingManager.gameArea.h = ttScalingManager.designDim.h;
			}
			else
			{
				ttScalingManager.gameArea.h = ttScalingManager.windowDim.h;
			}

			ttScalingManager.gameArea.w = (ttScalingManager.designDim.w / ttScalingManager.designDim.h) * ttScalingManager.gameArea.h;
			
			//Keep right size and centered
			document.getElementById(ttScalingManager.renderObjectId).setAttribute("style", "width:" + ttScalingManager.gameArea.w + "px; height:" + ttScalingManager.gameArea.h + "px; position:absolute;");
			ttScalingManager.gameArea.l 	= (ttScalingManager.windowDim.w / 2) - (ttScalingManager.gameArea.w / 2);
			ttScalingManager.gameArea.r 	= ttScalingManager.gameArea.l  + ttScalingManager.gameArea.w;
			ttScalingManager.gameArea.t		= 0;
			ttScalingManager.gameArea.b 	= ttScalingManager.gameArea.t + ttScalingManager.gameArea.h;			
			document.getElementById(ttScalingManager.renderObjectId).style.left = ttScalingManager.gameArea.l;				
		}


		ttScalingManager.scaleRenderer = function()
		{
			//Scale the renderer
			ttScalingManager.calculateRendererDimensions();
			g.stage.mainRenderer.view.style.width 			= ttScalingManager.gameArea.w + "px";
			g.stage.mainRenderer.view.style.height 			= ttScalingManager.gameArea.h + "px";
			
		}

	}( window.ttScalingManager = window.ttScalingManager || {}, jQuery ));

	//AUDIO MANAGER
	(function( ttAudioManager, $) {

		ttAudioManager.seq = 
		{
			parts: []
		}

		ttAudioManager.createAudioSequencer = function(seqData)
		{
			for(var i in seqData)
			{
				ttAudioManager.seq.parts[i] 				= seqData[i];
				ttAudioManager.seq.parts[i].soundsPlaying 	= [];
			}

		}

		ttAudioManager.runSequencer = function()
		{
			for(var i in ttAudioManager.seq.parts)
			{
				if(ttAudioManager.seq.parts[i].playing)
				{
					if(ttAudioManager.seq.parts[i].counter < ttAudioManager.seq.parts[i].triggerNewSoundsIntervalMS)
					{
						ttAudioManager.seq.parts[i].counter = ttAudioManager.seq.parts[i].counter + g.time.timeDiffNowMs;
					}
					else
					{
						if(ttAudioManager.seq.parts[i].soundsPlaying.length < ttAudioManager.seq.parts[i].soundsPlayingLimit)
						{
							var temp = Math.floor(Math.random() * ttAudioManager.seq.parts[i].data.length);

							//Trigger new sound and make note that it's playing
							g.oArrays.audios[ttAudioManager.seq.parts[i].data[temp].handle].audio.play(function(soundId){
								ttAudioManager.seq.parts[i].soundsPlaying.push(soundId);
							}).partId = i;
						}

						//Zero counter
						ttAudioManager.seq.parts[i].counter = 0;

					}
				}
			}
		}

	    ttAudioManager.loadAudios = function(audiosDataArray)
	    {

	    	ttAudioManager.assocAudiosPlaying 		= [];	

	        var audiosLoaderCounter  	= 0;
	        var audiosCounter       	= 0;
	        var loadedAudiosArray 		= new Array();
	        for(var i in audiosDataArray)
	        {   
	            loadedAudiosArray[audiosDataArray[i].handle]             	= new Object();
	            loadedAudiosArray[audiosDataArray[i].handle].handle 		= audiosDataArray[i].handle;
				audiosCounter++;
	            loadedAudiosArray[audiosDataArray[i].handle].audio       	= new Howl({urls: [audiosDataArray[i].path], loop: audiosDataArray[i].data.loop, volume: audiosDataArray[i].data.volume, format: audiosDataArray[i].data.format});
				loadedAudiosArray[audiosDataArray[i].handle].audio.handle 	= audiosDataArray[i].handle;
				loadedAudiosArray[audiosDataArray[i].handle].isPlaying 		= false;
				loadedAudiosArray[audiosDataArray[i].handle].audio.on('play', function()
				{
					ttAudioManager.assocAudiosPlaying[this.handle] = true;
				});
				
				loadedAudiosArray[audiosDataArray[i].handle].audio.on('end', function(soundId)
				{
					ttAudioManager.assocAudiosPlaying[this.handle] = false;

					if(typeof ttAudioManager.seq.parts[this.partId] != "undefined")
					{
						var index = ttAudioManager.seq.parts[this.partId].soundsPlaying.indexOf(soundId);
						if (index > -1) { ttAudioManager.seq.parts[this.partId].soundsPlaying.splice(index, 1); }
					}
				});
				

				audiosLoaderCounter++;
	        }
			return loadedAudiosArray;
	    }

	}( window.ttAudioManager = window.ttAudioManager || {}, jQuery ));	


	//TEXT MANAGER
	(function(ttTextManager, $) {

		ttTextManager.createText = function(textParams)
		{
			return new PIXI.Text(textParams.stageEnter.text, { font : textParams.font.sizePx + 'px ' + textParams.font.name , dropShadow: textParams.font.dropShadow, dropShadowDistance: textParams.font.dropShadowDistance, dropShadowColor: parseInt(textParams.font.dropShadowColor), stroke: parseInt(textParams.font.strokeColor), strokeThickness: textParams.font.strokeThickness, fill : parseInt(textParams.font.fillColor), align : textParams.font.align});
		}

		ttTextManager.createTextObjectsFromJson = function()
		{
			for(var i in g.s.texts)
			{
				g.oArrays.texts[g.s.texts[i].name] 		= ttTextManager.createText(g.s.texts[i]);
				g.oArrays.texts[g.s.texts[i].name].x 	= g.s.texts[i].stageEnter.xPixMin;
				g.oArrays.texts[g.s.texts[i].name].y 	= g.s.texts[i].stageEnter.yPixMin;
			}
		}


	}( window.ttTextManager = window.ttTextManager || {}, jQuery ));		

	/* HIGH SCORE MANAGER*/
	(function( ttHighScoreManager, $) {

		ttHighScoreManager.highScoreTexts = [];

		ttHighScoreManager.loadTop10 = function()
	    {
					var ajax = $.getJSON(g.s.urls.top10ajax + "?get_top_10=true", function(data) {
					});
	                ajax.fail(function(data){
	                    console.log("Ajax fail.");
	                }) ;
	                ajax.done(function(data){
				    	for(var i in data)
				    	{
				    		ttHighScoreManager.highScoreTexts[i] = { "points": data[i][1] , "nick": data[i][0] }
				    	}		
				    	ttHighScoreManager.setHighScores();
	                });		

		}

	    ttHighScoreManager.setHighScores = function()
	    {
			g.oArrays.texts["top10_1"].text = ttHighScoreManager.highScoreTexts[0].nick + " " + ttHighScoreManager.highScoreTexts[0].points;   	
			g.oArrays.texts["top10_2"].text = ttHighScoreManager.highScoreTexts[1].nick + " " + ttHighScoreManager.highScoreTexts[1].points;   	
			g.oArrays.texts["top10_3"].text = ttHighScoreManager.highScoreTexts[2].nick + " " + ttHighScoreManager.highScoreTexts[2].points;   	
			g.oArrays.texts["top10_4"].text = ttHighScoreManager.highScoreTexts[3].nick + " " + ttHighScoreManager.highScoreTexts[3].points;   	
			g.oArrays.texts["top10_5"].text = ttHighScoreManager.highScoreTexts[4].nick + " " + ttHighScoreManager.highScoreTexts[4].points;   	
			g.oArrays.texts["top10_6"].text = ttHighScoreManager.highScoreTexts[5].nick + " " + ttHighScoreManager.highScoreTexts[5].points;   	
			g.oArrays.texts["top10_7"].text = ttHighScoreManager.highScoreTexts[6].nick + " " + ttHighScoreManager.highScoreTexts[6].points;   	
			g.oArrays.texts["top10_8"].text = ttHighScoreManager.highScoreTexts[7].nick + " " + ttHighScoreManager.highScoreTexts[7].points;   	
			g.oArrays.texts["top10_9"].text = ttHighScoreManager.highScoreTexts[8].nick + " " + ttHighScoreManager.highScoreTexts[8].points;   	
			g.oArrays.texts["top10_10"].text = ttHighScoreManager.highScoreTexts[9].nick + " " + ttHighScoreManager.highScoreTexts[9].points;   	
	    	g.oArrays.texts["top10_1"].x = g.s.designDim.w / 2 - g.oArrays.texts["top10_1"].width / 2;
	    	g.oArrays.texts["top10_2"].x = g.s.designDim.w / 2 - g.oArrays.texts["top10_2"].width / 2;
	    	g.oArrays.texts["top10_3"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_3"].width / 2;
	    	g.oArrays.texts["top10_4"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_4"].width / 2;
	    	g.oArrays.texts["top10_5"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_5"].width / 2;
	    	g.oArrays.texts["top10_6"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_6"].width / 2;
	    	g.oArrays.texts["top10_7"].x = g.s.designDim.w / 2 - g.oArrays.texts["top10_7"].width / 2;
	    	g.oArrays.texts["top10_8"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_8"].width / 2;
	    	g.oArrays.texts["top10_9"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_9"].width / 2;
	    	g.oArrays.texts["top10_10"].x = g.s.designDim.w / 2  - g.oArrays.texts["top10_10"].width / 2;
	    }

		ttHighScoreManager.saveTop10 = function(score)
	    {
	    	if(score > ttHighScoreManager.highScoreTexts[9].points)
	    	{
				var userDataLength = 5;
				var nick = "ABC";
				
				while(userDataLength > 3 && nick != null)
				{
					nick = prompt("Pääsit Top 10 -listalle. Anna nimimerkki jonka pituus on 1 - 3 merkkiä.", nick);
					if(nick != null)
					{
					  userDataLength = nick.length;
					}
					else
					{
						nick = "ABC";
						userDataLength = nick.length;
					}
					if(userDataLength < 1) { userDataLength = 5; }
				}
				if (nick != null) {
				
		                var ajax = jQuery.ajax({
		                    method : 'POST',
		                    url : g.s.urls.top10ajax,
		                    data : { 'save_top_10' : score, 'nick' : nick }
		                });
		                ajax.fail(function(data){
		                    console.log("Ajax fail.");
		                }) ;
		                ajax.done(function(data){
		                	var dataJson = eval(data);
					    	for(var i in dataJson)
					    	{
								ttHighScoreManager.highScoreTexts[i] = { "points": dataJson[i][1] , "nick": dataJson[i][0] }
					    	}		
					    	ttHighScoreManager.setHighScores();
		                }) ;	
				}
				else
				{
					//Do not save
				}
			}
		}

	}( window.ttHighScoreManager = window.ttHighScoreManager || {}, jQuery ));	

	//Keyboard commands
	var keyLeft 		= keyboard(37);
	var keyUp 			= keyboard(38);				
	var keyRight 		= keyboard(39);	
	var keyDown			= keyboard(40);	
	var keyW 			= keyboard(87);
	var keyA 			= keyboard(65);
	var keyS 			= keyboard(83);	
	var keyD 			= keyboard(68);		
	var keyU			= keyboard(85);		
	var keyN 			= keyboard(51);
	var keyM 			= keyboard(52);
	var keySpace		= keyboard(32);	
	var keysDown		= [];

	function keyboard(keyCode) 
	{
	  var key = {};
	  key.code = keyCode;
	  key.isDown = false;
	  key.isUp = true;
	  key.press = undefined;
	  key.release = undefined;
	  //The `downHandler`
	  key.downHandler = function(event) {
	    if (event.keyCode === key.code) {
	    	if(key.press) { key.press(); }
	    }
	    event.preventDefault();
	  };

	  //The `upHandler`
	  key.upHandler = function(event) {
	    if (event.keyCode === key.code) {
	    	if(key.release) { key.release(); }
	    }
	    event.preventDefault();
	  };

	  //Attach event listeners
	  window.addEventListener(
	    "keydown", key.downHandler.bind(key), false
	  );
	  window.addEventListener(
	    "keyup", key.upHandler.bind(key), false
	  );
	  return key;
	}

	/* Helper keys */	
	keyU.press = keySpace.press = function(data) {	
			g.gameState = g.s.GAME_STATES.START_GAME;
	}

	keyU.release = keySpace.release = function(data) {	
	}			

	/* Vector */
	function Vector(x, y)                           { this.x = x || 0; this.y = y || 0; }
	Vector.prototype.add = function(vector)         { this.x += vector.x; this.y += vector.y; } 
	Vector.prototype.substract = function(vector)   { this.x -= vector.x; this.y -= vector.y; } 
	Vector.prototype.multiply = function(theScalar) { this.x = theScalar * this.x; this.y = theScalar * this.y; }
	Vector.prototype.getMagnitude = function ()     { return Math.sqrt(this.x * this.x + this.y * this.y); };
	Vector.prototype.getAngle = function ()         { return Math.atan2(this.y,this.x); };
	Vector.fromAngle = function (angle, magnitude)  { return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle)); };

	/* Extend PIXI Sprite */
	PIXI.Sprite.prototype.name 								= "";
	PIXI.Sprite.prototype.acceleration 						= new Vector(0, 0); 
	PIXI.Sprite.prototype.pastAcceleration 					= new Vector(0, 0); 
	PIXI.Sprite.prototype.velocity 							= new Vector(0, 0); 
	PIXI.Sprite.prototype.pastVelocity 						= new Vector(0, 0);
	PIXI.Sprite.prototype.pastPosition 						= new Vector(0, 0); 
	PIXI.Sprite.prototype.temporaryAccelerationImpulseX		= 0;
	PIXI.Sprite.prototype.temporaryAccelerationImpulseY		= 0;
	PIXI.Sprite.prototype.temporaryVelocityImpulseX			= 0;
	PIXI.Sprite.prototype.temporaryVelocityImpulseY			= 0;
	PIXI.Sprite.prototype.onSurface							= false;
	PIXI.Sprite.prototype.affectedByGravity 				= false;
	PIXI.Sprite.prototype.bounce 							= 0;
	PIXI.Sprite.prototype.staticInCollision					= false; 
	
	PIXI.Sprite.prototype.getMinVector = function()		{ return new Vector(this.position.x - (this.width / 2), this.position.y - (this.height / 2)); }
	PIXI.Sprite.prototype.getMaxVector = function()		{ return new Vector(this.position.x + (this.width / 2), this.position.y + (this.height / 2));	}	
	PIXI.Sprite.prototype.getSizeVector = function()	{ return new Vector(this.width, this.height); }	

	var bitmapData1;
	var bitmapData2;
	PIXI.Sprite.prototype.checkIfCollision = function(otherSprite)
	{
		var md 		= false;
		var minTmp;
		var maxTmp;
			
				if((this === g.sprites["roller"] && otherSprite === g.sprites["level250"]) || (otherSprite === g.sprites["roller"] && this === g.sprites["level250"]))
				{
					var circle 	= {x: g.sprites["roller"].position.x, y: g.sprites["roller"].position.y, r: g.sprites["roller"].width / 4};
					var rect 	= {x: g.sprites["level250"].position.x - g.sprites["level250"].width / 2 , y: g.sprites["level250"].position.y - g.sprites["level250"].width / 2, w: g.sprites["level250"].width, h: g.sprites["level250"].height};
					
					if(!g.sprites["roller"].onSurface)
					{
						if(rectCircleColliding(circle,rect))
						{
							if(g.sprites["roller"].position.y <= g.sprites["level250"].position.y - (g.sprites["level250"].height / 2) && g.sprites["roller"].velocity.y > 0) 
							{
								//From above						
								g.sprites["roller"].checkPlatformHit(g.sprites["level250"]); 
							}
							else
							{
								if(!g.sprites["roller"].onSurface)
								{
									if(g.sprites["roller"].position.x < g.sprites["level250"].position.x && g.sprites["roller"].velocity.x > 0) { if(!top_bottom) { g.sprites["roller"].position.x = g.sprites["level250"].position.x - g.sprites["level250"].width / 2 - g.sprites["roller"].width / 2; } }
									if(g.sprites["roller"].position.x > g.sprites["level250"].position.x && g.sprites["roller"].velocity.x < 0) { if(!top_bottom) { g.sprites["roller"].position.x = g.sprites["level250"].position.x + g.sprites["level250"].width / 2 + g.sprites["roller"].width / 2; } }
								}
							}
						}	
					}

					//When on platform and over the border, onSurface = false
					if(g.sprites["roller"].onSurface)
					{
						if(g.sprites["roller"].position.y < g.sprites["level250"].position.y)
						{
							//On platform
							if(g.sprites["roller"].position.x < g.sprites["level250"].position.x - g.sprites["level250"].width / 2 || g.sprites["roller"].position.x > g.sprites["level250"].position.x + g.sprites["level250"].width / 2 )
							{
								g.sprites["roller"].onSurface = false;
							}
						}
						
					}
					
					
				}
				
				if((this === g.sprites["spaceship"] && otherSprite === g.sprites["level250"]) || (otherSprite === g.sprites["spaceship"] && this === g.sprites["level250"]))
				{	
					if(g.sprites["spaceship"].onSurface)
					{
						if(Math.abs(g.sprites["spaceship"].velocity.y) > 0) { g.sprites["spaceship"].onSurface = false; }	
						if(g.sprites["spaceship"].position.y < g.s.designDim.h / 2)
						{
							//CHECK IF LANDED
							if(Math.abs(g.sprites["spaceship"].velocity.x) < 0.01) 
							{ 
								g.gameState = g.s.GAME_STATES.GAME_PAUSED;
								setTimeout(function () 
								{ 
									g.gameState = g.s.GAME_STATES.GAME_ON;
									g.sprites["spaceship"].levelUp();
								}, 700);
							}	
							
							//NOT GROUND
							if(g.sprites["spaceship"].position.x - (g.sprites["spaceship"].getBounds().width / 2) < g.sprites["level250"].position.x - g.sprites["level250"].width / 2) { g.sprites["spaceship"].onSurface = false;  }
							if(g.sprites["spaceship"].position.x + (g.sprites["spaceship"].getBounds().width / 2) > g.sprites["level250"].position.x + g.sprites["level250"].width / 2) { g.sprites["spaceship"].onSurface = false;  } 
						}
						
						
					}
				
					md 		= this.minkowskiDifference(otherSprite);
					minTmp 	= new Vector(md.position.x - (md.width / 2), md.position.y - (md.height / 2));
					maxTmp 	= new Vector(md.position.x + (md.width / 2), md.position.y + (md.height / 2));
					
					//If minkowski difference overlaps origin, bounding boxes collide
					if (minTmp.x <= 0 && maxTmp.x >= 0 && minTmp.y <= 0 && maxTmp.y >= 0)
					{
						g.stage.helperCanvasContext.clearRect(0, 0, g.stage.helperCanvas.width, g.stage.helperCanvas.height);
						g.stage.helperCanvasContext.drawImage(this.texture.baseTexture.source, 0, 0);
						
						bitmapData1 = g.stage.helperCanvasContext.getImageData(0, 0, this.getBounds().width, this.getBounds().height);
						
						g.stage.helperCanvasContext.clearRect(0, 0, g.stage.helperCanvas.width, g.stage.helperCanvas.height);
						g.stage.helperCanvasContext.drawImage(otherSprite.texture.baseTexture.source, 0, 0);
						
						bitmapData2 = g.stage.helperCanvasContext.getImageData(0, 0, otherSprite.getBounds().width, otherSprite.getBounds().height);

						if(isPixelCollision(bitmapData1, this.x,  this.y, bitmapData2, otherSprite.x, otherSprite.y, true))
						{
							
							if((this === g.sprites["spaceship"] && otherSprite === g.sprites["level250"]) || (this === g.sprites["level250"] && otherSprite === g.sprites["spaceship"]))
							{
									g.sprites["spaceship"].checkPlatformHit(g.sprites["level250"]);
							}
						}
					}
				}	
				
				if(this === g.sprites["spaceship"] && otherSprite === g.sprites["roller"])
				{
					md 		= this.minkowskiDifference(otherSprite);
					minTmp 	= new Vector(md.position.x - (md.width / 2), md.position.y - (md.height / 2));
					maxTmp 	= new Vector(md.position.x + (md.width / 2), md.position.y + (md.height / 2));
					
					//If minkowski difference overlaps origin, bounding boxes collide
					if (minTmp.x <= 0 && maxTmp.x >= 0 && minTmp.y <= 0 && maxTmp.y >= 0)
					{
						g.stage.helperCanvasContext.clearRect(0, 0, g.stage.helperCanvas.width, g.stage.helperCanvas.height);
						g.stage.helperCanvasContext.drawImage(this.texture.baseTexture.source, 0, 0);
						
						bitmapData1 = g.stage.helperCanvasContext.getImageData(0, 0, this.getBounds().width, this.getBounds().height);
						
						g.stage.helperCanvasContext.clearRect(0, 0, g.stage.helperCanvas.width, g.stage.helperCanvas.height);
						g.stage.helperCanvasContext.drawImage(otherSprite.texture.baseTexture.source, 0, 0);
						
						bitmapData2 = g.stage.helperCanvasContext.getImageData(0, 0, otherSprite.getBounds().width, otherSprite.getBounds().height);

						if(isPixelCollision(bitmapData1, this.x,  this.y, bitmapData2, otherSprite.x, otherSprite.y, true))
						{
							if((this === g.sprites["spaceship"] && otherSprite === g.sprites["roller"]))
							{
								ttHighScoreManager.saveTop10(g.points);
								g.gameState = g.s.GAME_STATES.START_START_SCREEN;
								g.oArrays.audios["gameOver"].audio.play();
							}
						}
						
					}					
				}
	}	
	
 	PIXI.Sprite.prototype.calculateAcceleration = function () 
	{
        

		var totalAccelerationX = 0;
		var totalAccelerationY = 0;
	     
		if(this.affectedByGravity == true)
		{
	        if(!this.onSurface)
			{
				if(this.gravityFactor)
				{
					totalAccelerationY += g.s.physics.gravityOrig * this.gravityFactor;
				}
				else
				{
					totalAccelerationY += g.s.physics.gravityOrig;

				}	
			}
		}

		//Acceleration impulse (= force)
		if(this.temporaryAccelerationImpulseX != 0) 	{ totalAccelerationX += this.temporaryAccelerationImpulseX; this.temporaryAccelerationImpulseX = 0; }
		if(this.temporaryAccelerationImpulseY != 0) 	
		{ 
			totalAccelerationY += this.temporaryAccelerationImpulseY * Math.cos(this.rotation); 
			totalAccelerationX += this.temporaryAccelerationImpulseY * -2 * Math.sin(this.rotation);
			this.temporaryAccelerationImpulseY = 0; 
		}         
		
		//Change the acceleration
		this.acceleration = new Vector(this.acceleration.x + totalAccelerationX * g.time.timeDiffNowMs , this.acceleration.y + totalAccelerationY * g.time.timeDiffNowMs); 
			
		//Check limits     
		if(this.acceleration.x > g.s.physics.limitAccelerationXMax) 	{ this.acceleration = new Vector(g.s.physics.limitAccelerationXMax, this.acceleration.y); }
		if(this.acceleration.x < g.s.physics.limitAccelerationXMin) 	{ this.acceleration = new Vector(g.s.physics.limitAccelerationXMin, this.acceleration.y); }
		if(this.acceleration.y > g.s.physics.limitAccelerationYMax) 	{ this.acceleration = new Vector(this.acceleration.x, g.s.physics.limitAccelerationYMax); }        
		if(this.acceleration.y < g.s.physics.limitAccelerationYMin) 	{ this.acceleration = new Vector(this.acceleration.x, g.s.physics.limitAccelerationYMin); }         
	}

 	PIXI.Sprite.prototype.calculateVelocity = function()
	{ 
		var userAdditionX = 0;
		var userAdditionY = 0;

		if(this.temporaryVelocityImpulseX != 0) 	{ userAdditionX = this.temporaryVelocityImpulseX; } 
		if(this.temporaryVelocityImpulseY != 0) 	{ userAdditionY = this.temporaryVelocityImpulseY; }  		

		this.velocity.add(new Vector(this.acceleration.x * g.time.timeDiffNowMs + userAdditionX, this.acceleration.y * g.time.timeDiffNowMs + userAdditionY));
		this.acceleration = new Vector(0, this.acceleration.y);

		if(this.tempVelocityImpulseY != 0) 			{ userAdditionY = 0; this.temporaryVelocityImpulseY = 0; }
		if(this.tempVelocityImpulseX != 0)  		{ userAdditionX = 0; this.temporaryVelocityImpulseX = 0; } 

		if(this.velocity.x > g.s.physics.limitVelocityX)            { this.velocity = new Vector(g.s.physics.limitVelocityX, this.velocity.y); }
		if(this.velocity.x < (-1 * g.s.physics.limitVelocityX))     { this.velocity = new Vector((-1 * g.s.physics.limitVelocityX), this.velocity.y); }
		if(this.velocity.y > g.s.physics.limitVelocityY)            { this.velocity = new Vector(this.velocity.x, g.s.physics.limitVelocityY); }
		if(this.velocity.y < (-1 * g.s.physics.limitVelocityY))     { this.velocity = new Vector(this.velocity.x, (-1 * g.s.physics.limitVelocityY)); }
		if(this === g.sprites["roller"]) 
		{ 
			if(Math.abs(this.velocity.x) < 0.2) 
			{ 
				if(this.velocity.x < 0)
				{
					this.velocity = new Vector(-0.2, this.velocity.y); 
				}
				else
				{
					this.velocity = new Vector(0.2, this.velocity.y);
				}
			} 
		}
	}  

	PIXI.Sprite.prototype.resetAccelerationX 	= function() { this.acceleration.x = new Vector(0, this.acceleration.y); }
	PIXI.Sprite.prototype.resetAccelerationY	= function() { this.acceleration.y = new Vector(this.acceleration.x, 0);}
	PIXI.Sprite.prototype.resetAcceleration 	= function() { this.resetAccelerationX(); this.resetAccelerationY(); }

	PIXI.Sprite.prototype.resetVelocityX 	= function() { this.velocity = new Vector(0, this.velocity.y); }
	PIXI.Sprite.prototype.resetVelocityY	= function() { this.velocity = new Vector(this.velocity.x, 0);}
	PIXI.Sprite.prototype.resetVelocity 	= function() { this.resetVelocityX(); this.resetVelocityY(); }

 	PIXI.Sprite.prototype.calculatePhysics = function()
	{
		//Calculate
		this.pastAcceleration = new Vector(this.acceleration.x, this.acceleration.y);
		this.calculateAcceleration();
		this.pastVelocity = new Vector(this.velocity.x, this.velocity.y);
		this.calculateVelocity();
		this.pastPosition = new Vector(this.position.x, this.position.y);
		this.setPhysicsCalculatedPosition(new Vector(this.position.x + this.velocity.x * g.time.timeDiffNowMs, this.position.y + this.velocity.y * g.time.timeDiffNowMs));
	}

 	PIXI.Sprite.prototype.setPhysicsCalculatedPosition =  function(positionTmp)
	{
		this.position.x = positionTmp.x;
		this.position.y = positionTmp.y;
	} 

	PIXI.Sprite.prototype.minkowskiDifference = function(otherSprite)
	{
		if(otherSprite !== this)
		{
			//MIN 1
			var tempVect1 	= new Vector(this.position.x - (this.width / 2), this.position.y - (this.height / 2));
			
			//MAX 2
			var tempVect2 	= new Vector(otherSprite.position.x + (otherSprite.width / 2), otherSprite.position.y + (otherSprite.height / 2));
			
			//AREA 1
			var tempVect3 	= new Vector(this.width, this.height);
			
			//AREA 2
			var tempVect4 	= new Vector(otherSprite.width, otherSprite.height);
			
			var topLeft 	= new Vector(tempVect1.x - tempVect2.x, tempVect1.y - tempVect2.y);
			var fullSize   	= new Vector(tempVect3.x + tempVect4.x, tempVect3.y + tempVect4.y);

			var res 	= new PIXI.Sprite();
			res.width	= fullSize.x;
			res.height 	= fullSize.y;
			res.position.x 	= topLeft.x + res.width / 2;
			res.position.y 	= topLeft.y + res.height / 2;

			
			return res;
		}
	}		

	PIXI.Sprite.prototype.checkPlatformHit = function(platform)
	{
		var test = {};	
		if(this.bounce == 10000) { this.bounce = 0; }
		if(this === g.sprites["roller"])
		{	
			if(g.sprites["roller"].position.y + g.sprites["roller"].height / 2 >= g.sprites["level250"].position.y - g.sprites["level250"].height / 2)
			{
					if(!this.onSurface)
					{		
						if(g.sprites["roller"].position.x > g.sprites["level250"].position.x - g.sprites["level250"].width / 2 && g.sprites["roller"].position.x < g.sprites["level250"].position.x + g.sprites["level250"].width / 2)
						{
							g.sprites["roller"].position.x  		= g.sprites["roller"].position.x;
							g.sprites["roller"].position.y  		= g.sprites["level250"].y - g.sprites["level250"].height / 2 - (g.sprites["roller"].getBounds().height/ 2);	
							g.sprites["roller"].onSurface 			= true;
							g.sprites["roller"].acceleration 		= new Vector(g.sprites["roller"].acceleration.x, 0);
							g.sprites["roller"].velocity 			= new Vector(g.sprites["roller"].velocity.x, 0); 
						}
						else
						{
							if(g.sprites["roller"].position.x < g.sprites["level250"].position.x - g.sprites["level250"].width / 2)
							{
								//LEFT SIDE
								g.sprites["roller"].position = new Vector(g.sprites["roller"].position.x,  g.sprites["level250"].position.y - g.sprites["level250"].height / 2 - g.sprites["roller"].height / 2);
								g.sprites["roller"].velocity = new Vector(-1 * (Math.abs(g.sprites["roller"].velocity.x) + 0.0001), 0);
							}
							if(g.sprites["roller"].position.x > g.sprites["level250"].position.x + g.sprites["level250"].width / 2)
							{
								//RIGHT SIDE
								g.sprites["roller"].position = new Vector(g.sprites["roller"].position.x, g.sprites["level250"].position.y - g.sprites["level250"].height / 2 - g.sprites["roller"].height / 2);
								g.sprites["roller"].velocity = new Vector(1 * (Math.abs(g.sprites["roller"].velocity.x) + 0.0001), 0);
							}	
						}						
						if(!g.sprites["roller"].platformHitPlayed) 
						{
							g.oArrays.audios["gPomp"].audio.play();
							g.sprites["roller"].platformHitPlayed = true;
						}

					}		
			}
		}
		if(this === g.sprites["spaceship"])
		{
			if(g.sprites["spaceship"].bounce == 0)
			{
				g.sprites["spaceship"].position.x  		= g.sprites["spaceship"].position.x;
				g.sprites["spaceship"].position.y  		= g.sprites["level250"].position.y - g.sprites["level250"].height / 2 - (g.sprites["spaceship"].height / 2) - 0.1;					
				g.sprites["spaceship"].onSurface 		= true;
				g.sprites["spaceship"].acceleration 	= new Vector(g.sprites["spaceship"].acceleration.x, 0);
				g.sprites["spaceship"].velocity 		= new Vector(g.sprites["spaceship"].velocity.x, 0);
			}
			else
			{
				g.sprites["spaceship"].velocity = new Vector(g.sprites["spaceship"].velocity.x, -1 * g.sprites["spaceship"].bounce * g.sprites["spaceship"].velocity.y);
				g.sprites["spaceship"].rotation = 0;
				if(g.sprites["spaceship"].position.y < g.sprites["level250"].position.y - g.sprites["level250"].height / 2)
				{
					//Tason yläpuolelta
					g.sprites["spaceship"].position.y  = g.sprites["level250"].position.y - g.sprites["level250"].height / 2 - (g.sprites["spaceship"].height / 2) - 0.1;	
					if(Math.abs(g.sprites["spaceship"].velocity.y) < 0.1) 
					{ 					
						g.sprites["spaceship"].position.x  		= g.sprites["spaceship"].position.x;
						g.sprites["spaceship"].onSurface 		= true;
						g.sprites["spaceship"].acceleration 	= new Vector(g.sprites["spaceship"].acceleration.x, 0);
						g.sprites["spaceship"].velocity 		= new Vector(g.sprites["spaceship"].velocity.x, 0);							
					}
					else
					{
						g.sprites["spaceship"].rotation = 0;
					}
				}
				else
				{
					//Tason alapuolelta
					g.sprites["spaceship"].position.y  = g.sprites["level250"].position.y + g.sprites["level250"].height / 2 + (g.sprites["spaceship"].height / 2) + 0.1;
				}
			}		
		}		
	}
	
 	PIXI.Sprite.prototype.checkBottomHit = function (platform) 
	{	
		var test = {};		
		if(this.bounce == 10000) { this.bounce = 0; }
		

		test = g.s.nonGameArea;
		test.x = g.s.nonGameArea.x;
		test.y = g.s.nonGameArea.y;
		test.w = g.s.designDim.w;
		test.h = g.s.designDim.h - g.s.nonGameArea.h;			
		
		if(this.position.y + this.getBounds().height / 2 >= test.y)
		{
			if(this.rotation > 0 && this.rotation < Math.PI / 180 * 45)
			{
				//Do nothing
				this.rotation = 0;
			}
			
			if(this.rotation < 0 && this.rotation > Math.PI / 180 * -45)
			{
				//Do nothing
				this.rotation = 0;
			}			
			
			
			if(this.rotation > Math.PI / 180 * 60 && this.rotation < Math.PI / 180 * 180)
			{
				this.rotation = Math.PI / 180 * 60;
			}

			if(this.rotation < Math.PI / 180 * -60 && this.rotation > Math.PI / 180 * -180)
			{
				this.rotation = Math.PI / 180 * -60;
			}	
						
			if(!this.onSurface)
			{		

				this.position.x  	= this.position.x;
				this.position.y  	= test.y - Math.floor(this.height / 2);

				this.velocity 		= new Vector(this.velocity.x, -1 * this.bounce * this.velocity.y);					
				if(this.bounce == 0)
				{
					this.onSurface 		= true;
					this.acceleration 	= new Vector(this.acceleration.x, 0);
					this.velocity 		= new Vector(this.velocity.x, 0);
				}
				else
				{
					if(Math.abs(this.velocity.y) < 0.1) 
					{ 

						this.onSurface 			= true;
						this.acceleration 		= new Vector(this.acceleration.x, 0);
						this.velocity 			= new Vector(this.velocity.x, 0); 
						this.rotation 			= 0;						
					}
				}
				if(this === g.sprites["roller"])
				{
					g.oArrays.audios["gPomp"].audio.play();
				}
			}
			else
			{
				this.position.y = test.y - (this.height/ 2) - 0.1;
			}
		}	
	}

	function rectCircleColliding(circle,rect){
	    var distX = Math.abs(circle.x - rect.x-rect.w/2);
	    var distY = Math.abs(circle.y - rect.y-rect.h/2);

	    if (distX > (rect.w/2 + circle.r)) { return false; }
	    if (distY > (rect.h/2 + circle.r)) { return false; }

	    if (distX <= (rect.w/2)) { return true; } 
	    if (distY <= (rect.h/2)) { return true; }

	    var dx=distX-rect.w/2;
	    var dy=distY-rect.h/2;
	    return (dx*dx+dy*dy<=(circle.r*circle.r));
	}	
	
	function isPixelCollision( first, x, y, other, x2, y2, isCentred )
	{
	    x  = Math.round( x );
	    y  = Math.round( y );
	    x2 = Math.round( x2 );
	    y2 = Math.round( y2 );

	    var w  = first.width,
	        h  = first.height,
	        w2 = other.width,
	        h2 = other.height ;

	    if ( isCentred ) {
	        x  -= ( w/2 + 0.5) << 0
	        y  -= ( h/2 + 0.5) << 0
	        x2 -= (w2/2 + 0.5) << 0
	        y2 -= (h2/2 + 0.5) << 0
	    }

	    var xMin = Math.max( x, x2 ),
	        yMin = Math.max( y, y2 ),
	        xMax = Math.min( x+w, x2+w2 ),
	        yMax = Math.min( y+h, y2+h2 );

	    if ( xMin >= xMax || yMin >= yMax ) {
	        return false;
	    }

	    var xDiff = xMax - xMin,
	        yDiff = yMax - yMin;

	    var pixels  = first.data,
	        pixels2 = other.data;

	    if ( xDiff < 4 && yDiff < 4 ) {
	        for ( var pixelX = xMin; pixelX < xMax; pixelX++ ) {
	            for ( var pixelY = yMin; pixelY < yMax; pixelY++ ) {
	                if (
	                        ( pixels [ ((pixelX-x ) + (pixelY-y )*w )*4 + 3 ] !== 0 ) &&
	                        ( pixels2[ ((pixelX-x2) + (pixelY-y2)*w2)*4 + 3 ] !== 0 )
	                ) {
	                    return true;
	                }
	            }
	        }
	    } else {
	        var incX = xDiff / 3.0,
	            incY = yDiff / 3.0;
	        incX = (~~incX === incX) ? incX : (incX+1 | 0);
	        incY = (~~incY === incY) ? incY : (incY+1 | 0);

	        for ( var offsetY = 0; offsetY < incY; offsetY++ ) {
	            for ( var offsetX = 0; offsetX < incX; offsetX++ ) {
	                for ( var pixelY = yMin+offsetY; pixelY < yMax; pixelY += incY ) {
	                    for ( var pixelX = xMin+offsetX; pixelX < xMax; pixelX += incX ) {
	                        if (
	                                ( pixels [ ((pixelX-x ) + (pixelY-y )*w )*4 + 3 ] !== 0 ) &&
	                                ( pixels2[ ((pixelX-x2) + (pixelY-y2)*w2)*4 + 3 ] !== 0 )
	                        ) {
	                            return true;
	                        }
	                    }
	                }
	            }
	        }
	    }

	    return false;
	}	

}( window.tt = window.tt || {}, jQuery ));  