
        // ==================== CONFIGURATION ====================
        const CONFIG = {
            MAP_WIDTH: 12,  // Start smaller, grows with waves
            MAP_HEIGHT: 12,
            TILE_SIZE: 40,
            PATH_COLOR: '#8B4513',
            TERRAIN_COLOR: '#654321',
            BASE_ENERGY: 80,
            BASE_LIVES: 15,
            ENERGY_REGEN: 1,
            MAX_ENERGY: 80,
            PREPARATION_TIME: 45
        };

        // Wave scaling formula
        function calculateWaveDifficulty(waveNumber) {
            const baseDifficulty = 10;
            const waveFactor = Math.pow(1.15, waveNumber);
            const bossFactor = waveNumber % 5 === 0 ? 2.5 : 1;
            return Math.floor(baseDifficulty * waveFactor * bossFactor);
        }

        function calculateEnemyCount(waveNumber) {
            return Math.min(40, 10 + Math.floor(waveNumber * 1.5));
        }

        function calculatePathLength(wave) {
            return Math.min(30, 10 + Math.floor(wave * 1.2));
        }

        const TOWER_TYPES = {
            BASIC: { name: 'Basic Tower', cost: 20, damage: 5, range: 7, color: '#ff6b6b', icon: '🔵', fireRate: 800 },
            SNIPER: { name: 'Sniper', cost: 40, damage: 15, range: 18, color: '#4ecdc4', icon: '🎯', fireRate: 2000 },
            CANNON: { name: 'Cannon', cost: 60, damage: 8, range: 6, area: 4, color: '#ffe66d', icon: '💥', fireRate: 1500 },
            TRAP: { name: 'Trap', cost: 35, damage: 30, range: 3, oneTime: true, color: '#ff8787', icon: '💣', fireRate: 999999 },
            SLOW: { name: 'Slow', cost: 45, damage: 2, range: 8, slowFactor: 0.5, color: '#74c0fc', icon: '❄️', fireRate: 500 }
        };

        function updateCameraPosition() {
            const centerX = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE / 2;
            const centerZ = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE / 2;
            const baseDist = 500;
            const baseHeight = 350;
            
            const dist = baseDist * gameState.cameraZoom;
            const height = baseHeight * gameState.cameraZoom;
            
            const angle = gameState.cameraAngle;
            camera.position.set(
                centerX + Math.sin(angle) * dist,
                height,
                centerZ + Math.cos(angle) * dist
            );
            camera.lookAt(centerX, 0, centerZ);
        }

        // ==================== GAME STATE ====================
        let gameState = {
            energy: CONFIG.BASE_ENERGY,
            lives: CONFIG.BASE_LIVES,
            wave: 1,
            gamePhase: 'PREPARATION', // 'PREPARATION' | 'WAVE_ACTIVE' | 'GAME_OVER'
            preparationTimer: CONFIG.PREPARATION_TIME,
            towers: [],
            enemies: [],
            projectiles: [],
            particles: [],
            gameOver: false,
            gameStarted: false,
            selectedTower: null,
            waveActive: false,
            pathGrid: [],
            maxWaveReached: 0,
            totalKills: 0,
            pathChanges: 0,
            bossesDefeated: 0,
            cameraAngle: 0,
            cameraZoom: 1
        };

	let camera, scene, renderer;
	let clouds = [];
	let ambientParticles = [];
	let pathSegments = [];
	let debrisParticles = [];

	// ==================== PATH GENERATOR ====================
	class PathGenerator {
		static createPath(waveNumber) {
			const pathTypes = ['STRAIGHT', 'WINDING', 'BRANCHING', 'MAZE'];
			const pathType = pathTypes[waveNumber % 4];
			const pathLength = calculatePathLength(waveNumber);
			
			switch(pathType) {
				case 'STRAIGHT':
					return this.generateStraightPath(pathLength);
				case 'WINDING':
					return this.generateWindingPath(pathLength);
				case 'BRANCHING':
					return this.generateBranchingPath(pathLength);
				case 'MAZE':
					return this.generateMazePath(pathLength);
				default:
					return this.generateWindingPath(pathLength);
			}
		}
		
		static generateStraightPath(length) {
			const path = [];
			const y = 5 + Math.floor(Math.random() * 10);
			for (let x = 0; x < Math.min(length, CONFIG.MAP_WIDTH); x++) {
				path.push({ x: x, y: y });
			}
			return path;
		}
		
		static generateWindingPath(length) {
			const path = [];
			let x = 0;
			let y = 5 + Math.floor(Math.random() * 10);
			const direction = Math.random() > 0.5 ? 1 : -1;
			
			while (x < Math.min(length, CONFIG.MAP_WIDTH)) {
				path.push({ x: x, y: y });
				x++;
				
				if (Math.random() < 0.3 && y + direction > 4 && y + direction < 15) {
					y += direction;
				}
			}
			return path;
		}
		
		static generateBranchingPath(length) {
			const path = [];
			let x = 0;
			let y = 10;
			
			while (x < Math.min(length, CONFIG.MAP_WIDTH)) {
				path.push({ x: x, y: y });
				x++;
				
				if (Math.random() < 0.2) {
					y = Math.max(5, Math.min(14, y + (Math.random() > 0.5 ? 2 : -2)));
				}
			}
			return path;
		}
		
		static generateMazePath(length) {
			const path = [];
			let x = 0;
			let y = 10;
			let lastDir = 0;
			
			while (x < Math.min(length, CONFIG.MAP_WIDTH)) {
				path.push({ x: x, y: y });
				
				const rand = Math.random();
				if (rand < 0.4) {
					x++;
				} else if (rand < 0.6 && y > 5) {
					y--;
				} else if (rand < 0.8 && y < 14) {
					y++;
				} else {
					x++;
				}
				
				if (x >= CONFIG.MAP_WIDTH) break;
			}
			return path;
		}
		
		static validatePath(path) {
			if (!path || path.length < 5) return false;
			if (path[0].x !== 0) return false;
			if (path[path.length - 1].x < CONFIG.MAP_WIDTH - 1) return false;
			
			for (let i = 1; i < path.length; i++) {
				const dx = Math.abs(path[i].x - path[i-1].x);
				const dy = Math.abs(path[i].y - path[i-1].y);
				if (dx + dy > 2) return false;
			}
			return true;
		}
	}

	// ==================== WAVE GENERATOR ====================
	function generateWaveEnemies(waveNum) {
		const enemies = [];
		const count = calculateEnemyCount(waveNum);
		const difficulty = calculateWaveDifficulty(waveNum);
		
		const enemyTypes = ['basic', 'fast', 'tank', 'sniper'];
		const spawnRate = Math.max(400, 1200 - waveNum * 30);
		
		for (let i = 0; i < count; i++) {
			let type = enemyTypes[Math.floor(Math.random() * Math.min(4, Math.floor(waveNum / 3) + 1))];
			let variant = 'normal';
			
			if (waveNum >= 5 && Math.random() < 0.1) type = 'burrowing';
			if (waveNum >= 10 && Math.random() < 0.05) type = 'spawner';
			
			if (waveNum % 5 === 0 && i === 0) {
				type = 'boss';
				variant = 'elite';
			}
			
			enemies.push({ type: type, variant: variant, spawnDelay: spawnRate });
		}
		
		return { enemies, spawnDelay: spawnRate };
	}

	// Dynamic path - generated each wave
	let currentPath = [];
	
	// Legacy path reference for compatibility
	const pathOptions = {
		mainPath: currentPath
	};

	// ==================== WAVE GENERATION ====================
	function selectPathForWave(waveNum) {
		// Generate new path for each wave
		let attempts = 0;
		while (attempts < 10) {
			const path = PathGenerator.createPath(waveNum + attempts);
			if (PathGenerator.validatePath(path)) {
				currentPath = path;
				pathOptions.mainPath = path;
				return path;
			}
			attempts++;
		}
		// Fallback to default winding path
		currentPath = PathGenerator.generateWindingPath(15);
		pathOptions.mainPath = currentPath;
		return currentPath;
	}

	// Get waypoint at index from a path
	function getWaypointAt(index, pathName) {
		const path = pathOptions[pathName];
		if (!path || !path[index]) return null;
		return { x: path[index].x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
		         y: path[index].y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 };
	}

	// Get total waypoints in a path
	function getPathLength(pathName) {
		const path = pathOptions[pathName];
		return path ? path.length : 0;
	}

	// End of initialization code
	function init() {
            console.log('Initializing game...');
            
            // Setup Three.js scene first
            scene = new THREE.Scene();
            
            // Sky gradient using a large sphere - sunset/sunrise colors
            const skyGeo = new THREE.SphereGeometry(900, 32, 32);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: {
                    topColor: { value: new THREE.Color(0x1e90ff) }, // Deep blue
                    midColor: { value: new THREE.Color(0x87CEEB) }, // Sky blue
                    bottomColor: { value: new THREE.Color(0xffecd2) }, // Warm horizon
                    offset: { value: 400 },
                    exponent: { value: 0.6 }
                },
                vertexShader: `
                    varying vec3 vWorldPosition;
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform vec3 topColor;
                    uniform vec3 midColor;
                    uniform vec3 bottomColor;
                    uniform float offset;
                    uniform float exponent;
                    varying vec3 vWorldPosition;
                    void main() {
                        float h = normalize(vWorldPosition + offset).y;
                        vec3 color;
                        if (h > 0.3) {
                            color = mix(midColor, topColor, (h - 0.3) / 0.7);
                        } else {
                            color = mix(bottomColor, midColor, h / 0.3);
                        }
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
                side: THREE.BackSide
            });
            const sky = new THREE.Mesh(skyGeo, skyMat);
            scene.add(sky);
            console.log('Sky gradient created');
            
            // Add fluffy clouds
            const cloudGeo = new THREE.SphereGeometry(1, 8, 8);
            const cloudMat = new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9
            });
            
            for (let i = 0; i < 25; i++) {
                const cloudGroup = new THREE.Group();
                const clusterSize = 3 + Math.floor(Math.random() * 4);
                
                for (let j = 0; j < clusterSize; j++) {
                    const cloudPuff = new THREE.Mesh(cloudGeo, cloudMat.clone());
                    cloudPuff.scale.set(
                        15 + Math.random() * 20,
                        8 + Math.random() * 10,
                        10 + Math.random() * 15
                    );
                    cloudPuff.position.set(
                        (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 8,
                        (Math.random() - 0.5) * 20
                    );
                    cloudGroup.add(cloudPuff);
                }
                
                const startX = Math.random() * CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
                const startZ = Math.random() * CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;
                cloudGroup.position.set(
                    startX,
                    80 + Math.random() * 40,
                    startZ
                );
                scene.add(cloudGroup);
                
                // Store cloud for animation
                clouds.push({
                    group: cloudGroup,
                    speed: 0.2 + Math.random() * 0.3,
                    startX: startX,
                    startZ: startZ,
                    phase: Math.random() * Math.PI * 2
                });
            }

            // Top-down isometric camera
            camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
            const centerX = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE / 2;
            const centerZ = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE / 2;
            // Position for 20x20 grid at 36px tiles = 720x720 world
            camera.position.set(centerX, 500, centerZ + 250);
            camera.lookAt(centerX, 0, centerZ);
            console.log('Camera positioned at', camera.position.x, camera.position.y, camera.position.z);

            // Lighting - enhanced for richer atmosphere
            const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.5); // Warm ambient
            scene.add(ambientLight);

            // Main sun light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
            directionalLight.position.set(100, 200, 50);
            directionalLight.castShadow = true;
            scene.add(directionalLight);
            
            // Secondary fill light (cooler tone for depth)
            const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
            fillLight.position.set(-50, 100, -50);
            scene.add(fillLight);
            
            // Ground bounce light (warm reflection)
            const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
            scene.add(hemiLight);

            // Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x87CEEB, 1);
            renderer.shadowMap.enabled = true;
            document.getElementById('game-container').appendChild(renderer.domElement);
            console.log('Renderer added, scene children:', scene.children.length);

            // Build map
            buildMap();
            createAmbientParticles();
            
            // Initialize first path for display
            currentPath = PathGenerator.generateWindingPath(15);
            pathOptions.mainPath = currentPath;
            drawPath(currentPath);

            // Create UI elements
            createUI();

            // Setup event listeners
            setupEventListeners();
            
            // Setup login and main menu handlers
            setupLoginScreen();
            
            // Start game loop
            animate();
        }
        
        function setupLoginScreen() {
            const loginScreen = document.getElementById('login-screen');
            const mainMenu = document.getElementById('main-menu');
            const usernameInput = document.getElementById('username-input');
            const loginBtn = document.getElementById('login-btn');
            const playBtn = document.getElementById('play-btn');
            const leaderboardBtn = document.getElementById('leaderboard-btn');
            const achievementsBtn = document.getElementById('achievements-btn');
            const welcomeText = document.getElementById('welcome-text');
            
            // Check for saved username
            const savedUsername = localStorage.getItem('finalTowerUsername');
            if (savedUsername) {
                usernameInput.value = savedUsername;
            }
            
            // Login button click
            loginBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim() || 'Player';
                localStorage.setItem('finalTowerUsername', username);
                welcomeText.textContent = 'Welcome, ' + username + '!';
                loginScreen.classList.add('hidden');
                mainMenu.classList.remove('hidden');
            });
            
            // Allow Enter key to login
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
            
            // Play button - start the game
            playBtn.addEventListener('click', () => {
                mainMenu.classList.add('hidden');
                document.getElementById('game-ui').classList.remove('hidden');
                document.getElementById('wave-controls').style.display = 'block';
                gameState.gameStarted = true;
                gameState.gamePhase = 'PREPARATION';
                gameState.preparationTimer = CONFIG.PREPARATION_TIME;
                preparationStartTime = Date.now();
                generateNewPath();
                clearPathTiles();
                drawPath(currentPath);
                createAmbientParticles();
                updateUI();
                const startBtn = document.getElementById('start-wave-btn');
                startBtn.textContent = 'START WAVE';
            });
            
            // Leaderboard button - show simple alert for now
            leaderboardBtn.addEventListener('click', () => {
                alert('Leaderboard coming soon!');
            });
            
            // Achievements button - show simple alert for now
            achievementsBtn.addEventListener('click', () => {
                alert('Achievements coming soon!');
            });
        }

        function buildMap() {
            // Minecraft-style voxel terrain (blocky cubes)
            const blockSize = CONFIG.TILE_SIZE;
            
            // Enhanced color palette with more variation
            const dirtColors = [0x8B4513, 0xA0522D, 0x6B4423, 0x5D3A1A, 0x704214];
            const stoneColors = [0x696969, 0x787878, 0x505050, 0x5a5a5a, 0x4a4a4a];
            // Muted, earthy grass colors - less saturated
            const grassColors = [
                0x556B2F, 0x6B8E23, 0x3d5a27, 0x4a6b32, 0x2f4f2f,  // Dark olive greens
                0x4f6b3f, 0x3a5a2a, 0x5a7a42, 0x3f5a38, 0x4a6832   // Muted forest
            ];
            const grassHighlightColors = [0x8FBC8F, 0x9ACD32, 0x6B8E23]; // Subtle highlights
            const grassShadowColors = [0x2d4a1a, 0x1d3a10, 0x2a4a20]; // Dark shadows
            
            // Create voxel blocks for terrain with height variation
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
                for (let z = 0; z < CONFIG.MAP_HEIGHT; z++) {
                    const worldX = x * blockSize + blockSize / 2;
                    const worldZ = z * blockSize + blockSize / 2;
                    
                    // Height variation - some tiles slightly raised
                    const heightVar = Math.random() > 0.85 ? 1 : 0;
                    
                    // Top grass layer - varied height
                    const grassHeight = 4 + Math.random() * 2;
                    const grassGeo = new THREE.BoxGeometry(blockSize - 1, grassHeight, blockSize - 1);
                    const grassColor = grassColors[Math.floor(Math.random() * grassColors.length)];
                    const grassMat = new THREE.MeshLambertMaterial({ 
                        color: grassColor
                    });
                    const grassBlock = new THREE.Mesh(grassGeo, grassMat);
                    grassBlock.position.set(worldX, 2 + heightVar, worldZ);
                    grassBlock.receiveShadow = true;
                    scene.add(grassBlock);
                    
                    // Add grass highlight patches
                    if (Math.random() > 0.7) {
                        const highlightGeo = new THREE.BoxGeometry(blockSize * 0.3, 0.5, blockSize * 0.3);
                        const highlightColor = grassHighlightColors[Math.floor(Math.random() * grassHighlightColors.length)];
                        const highlightMat = new THREE.MeshLambertMaterial({ color: highlightColor });
                        const highlight = new THREE.Mesh(highlightGeo, highlightMat);
                        highlight.position.set(
                            worldX + (Math.random() - 0.5) * 10,
                            4.5 + heightVar,
                            worldZ + (Math.random() - 0.5) * 10
                        );
                        scene.add(highlight);
                    }
                    
                    // Dirt layer below - thicker with variation
                    const dirtHeight = 6 + Math.random() * 4;
                    const dirtGeo = new THREE.BoxGeometry(blockSize - 1, dirtHeight, blockSize - 1);
                    const dirtColor = dirtColors[Math.floor(Math.random() * dirtColors.length)];
                    const dirtMat = new THREE.MeshLambertMaterial({ 
                        color: dirtColor
                    });
                    const dirtBlock = new THREE.Mesh(dirtGeo, dirtMat);
                    dirtBlock.position.set(worldX, -2 - dirtHeight/2 + 4, worldZ);
                    dirtBlock.receiveShadow = true;
                    scene.add(dirtBlock);
                    
                    // Stone layer at bottom
                    const stoneGeo = new THREE.BoxGeometry(blockSize - 1, 6, blockSize - 1);
                    const stoneColor = stoneColors[Math.floor(Math.random() * stoneColors.length)];
                    const stoneMat = new THREE.MeshLambertMaterial({ 
                        color: stoneColor
                    });
                    const stoneBlock = new THREE.Mesh(stoneGeo, stoneMat);
                    stoneBlock.position.set(worldX, -8 - 3, worldZ);
                    stoneBlock.receiveShadow = true;
                    scene.add(stoneBlock);
                }
            }
            
            // Add water streams (blue patches)
            const waterColors = [0x4FC3F7, 0x29B6F6, 0x03A9F4, 0x0288D1];
            for (let i = 0; i < 8; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const waterGeo = new THREE.BoxGeometry(blockSize * 0.8, 0.3, blockSize * 0.6);
                const waterColor = waterColors[Math.floor(Math.random() * waterColors.length)];
                const waterMat = new THREE.MeshLambertMaterial({ 
                    color: waterColor,
                    transparent: true,
                    opacity: 0.7
                });
                const water = new THREE.Mesh(waterGeo, waterMat);
                water.position.set(
                    x * blockSize + blockSize / 2,
                    0.5,
                    z * blockSize + blockSize / 2
                );
                scene.add(water);
            }
            
            // Add decorative elements - flowers, mushrooms, trees
            const flowerColors = [0xff6b9d, 0xffeb3b, 0xffffff, 0xe91e63, 0x9c27b0];
            const flowerGeo = new THREE.SphereGeometry(2, 6, 6);
            
            // Flowers
            for (let i = 0; i < 35; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColor });
                const flower = new THREE.Mesh(flowerGeo, flowerMat);
                flower.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 10,
                    5,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 10
                );
                scene.add(flower);
            }
            
            // Mushrooms - red caps with white spots
            const mushGeo = new THREE.SphereGeometry(2.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
            const mushStemGeo = new THREE.CylinderGeometry(1, 1.2, 3);
            for (let i = 0; i < 20; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const mushMat = new THREE.MeshLambertMaterial({ color: 0xff4444 });
                const mushCap = new THREE.Mesh(mushGeo, mushMat);
                mushCap.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 12,
                    4,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 12
                );
                scene.add(mushCap);
                const stemMat = new THREE.MeshLambertMaterial({ color: 0xffeecc });
                const mushStem = new THREE.Mesh(mushStemGeo, stemMat);
                mushStem.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 12,
                    2.5,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 12
                );
                scene.add(mushStem);
            }
            
            // Small trees - pine style
            const trunkGeo = new THREE.CylinderGeometry(1.5, 2, 8);
            const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            const leavesGeo = new THREE.ConeGeometry(6, 12, 6);
            const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
            
            // Pine trees
            for (let i = 0; i < 8; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15,
                    6,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15
                );
                scene.add(trunk);
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15,
                    14,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15
                );
                scene.add(leaves);
            }
            
            // Deciduous trees - round canopy
            const trunkGeo2 = new THREE.CylinderGeometry(2, 3, 10);
            const trunkMat2 = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
            const canopyGeo = new THREE.SphereGeometry(8, 8, 6);
            const canopyColors = [0x4CAF50, 0x66BB6A, 0x388E3C, 0x2E7D32];
            
            for (let i = 0; i < 6; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const trunk2 = new THREE.Mesh(trunkGeo2, trunkMat2);
                trunk2.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15,
                    7,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15
                );
                scene.add(trunk2);
                
                const canopyColor = canopyColors[Math.floor(Math.random() * canopyColors.length)];
                const canopyMat = new THREE.MeshLambertMaterial({ color: canopyColor });
                const canopy = new THREE.Mesh(canopyGeo, canopyMat);
                canopy.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15,
                    16,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15
                );
                canopy.scale.set(1, 0.8, 1);
                scene.add(canopy);
            }
            
            // Berry bushes
            const bushGeo = new THREE.SphereGeometry(4, 6, 6);
            const bushMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
            const berryColors = [0xE53935, 0x8E24AA, 0x1E88E5];
            
            for (let i = 0; i < 15; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const bush = new THREE.Mesh(bushGeo, bushMat);
                bush.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 18,
                    4,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 18
                );
                bush.scale.set(1.2, 0.8, 1.2);
                scene.add(bush);
                
                // Add berries
                for (let j = 0; j < 3; j++) {
                    const berryGeo = new THREE.SphereGeometry(1, 4, 4);
                    const berryColor = berryColors[Math.floor(Math.random() * berryColors.length)];
                    const berryMat = new THREE.MeshLambertMaterial({ color: berryColor });
                    const berry = new THREE.Mesh(berryGeo, berryMat);
                    berry.position.set(
                        x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 8,
                        5 + j * 0.5,
                        z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 8
                    );
                    scene.add(berry);
                }
            }
            
            // Small decorative rocks - darker variation
            const rockColors = [0x505050, 0x404040, 0x606060, 0x3a3a3a];
            const rockGeo = new THREE.BoxGeometry(5, 3, 4);
            
            for (let i = 0; i < 25; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const rockColor = rockColors[Math.floor(Math.random() * rockColors.length)];
                const rockMat = new THREE.MeshLambertMaterial({ color: rockColor });
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15,
                    3,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 15
                );
                rock.rotation.y = Math.random() * Math.PI;
                scene.add(rock);
            }
            
            // Grass tufts - small vertical boxes
            const grassTuftColors = [0x3d6b2d, 0x4a8c3a, 0x2f5c28];
            for (let i = 0; i < 50; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const tuftColor = grassTuftColors[Math.floor(Math.random() * grassTuftColors.length)];
                const tuftMat = new THREE.MeshLambertMaterial({ color: tuftColor });
                const tuftGeo = new THREE.BoxGeometry(1, 4 + Math.random() * 3, 1);
                const tuft = new THREE.Mesh(tuftGeo, tuftMat);
                tuft.position.set(
                    x * blockSize + blockSize / 2 + (Math.random() - 0.5) * 20,
                    4,
                    z * blockSize + blockSize / 2 + (Math.random() - 0.5) * 20
                );
                scene.add(tuft);
            }
            
            // Add some darker grass patches for variety
            const darkGrassGeo = new THREE.BoxGeometry(blockSize - 3, 4.5, blockSize - 3);
            const darkGrassMat = new THREE.MeshLambertMaterial({ color: 0x1a3d15 });
            
            for (let i = 0; i < 15; i++) {
                const x = Math.floor(Math.random() * CONFIG.MAP_WIDTH);
                const z = Math.floor(Math.random() * CONFIG.MAP_HEIGHT);
                const darkPatch = new THREE.Mesh(darkGrassGeo, darkGrassMat);
                darkPatch.position.set(
                    x * blockSize + blockSize / 2,
                    2.5,
                    z * blockSize + blockSize / 2
                );
                scene.add(darkPatch);
            }
            
            // Add ambient particles - floating fireflies
            createAmbientParticles();
            
            // Map border/frame
            const borderMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
            const borderH = 8;
            const borderW = 4;
            const mapW = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
            const mapH = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;
            
            // North border
            const northGeo = new THREE.BoxGeometry(mapW + borderW * 2, borderH, borderW);
            const north = new THREE.Mesh(northGeo, borderMat);
            north.position.set(mapW / 2, borderH / 2, -borderW / 2);
            north.receiveShadow = true;
            scene.add(north);
            
            // South border
            const south = new THREE.Mesh(northGeo, borderMat);
            south.position.set(mapW / 2, borderH / 2, mapH + borderW / 2);
            south.receiveShadow = true;
            scene.add(south);
            
            // West border
            const westGeo = new THREE.BoxGeometry(borderW, borderH, mapH);
            const west = new THREE.Mesh(westGeo, borderMat);
            west.position.set(-borderW / 2, borderH / 2, mapH / 2);
            west.receiveShadow = true;
            scene.add(west);
            
            // East border
            const east = new THREE.Mesh(westGeo, borderMat);
            east.position.set(mapW + borderW / 2, borderH / 2, mapH / 2);
            east.receiveShadow = true;
            scene.add(east);
        }

        function drawPath(path) {
            if (!path || !Array.isArray(path)) return;
            
            const pathColors = [0x3d2817, 0x4a3520, 0x2d1f12]; // Dark dirt colors
            
            for (let i = 0; i < path.length; i++) {
                const p = path[i];
                if (!p || p.x === undefined) continue;

                const x = p.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                const z = p.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                
                // Create glowing "mole hole" entrance - visible opening in grass
                const holeGeo = new THREE.CylinderGeometry(12, 14, 3, 16);
                const holeMat = new THREE.MeshLambertMaterial({ 
                    color: 0x1a1008,
                    emissive: 0xff6b6b,
                    emissiveIntensity: 0.4
                });
                const hole = new THREE.Mesh(holeGeo, holeMat);
                hole.position.set(x, 1.5, z); // Just below grass surface
                scene.add(hole);
                pathSegments.push({ mesh: hole });
                
                // Glowing ring around hole entrance
                const ringGeo = new THREE.TorusGeometry(14, 2, 8, 24);
                const ringMat = new THREE.MeshLambertMaterial({ 
                    color: 0xffd43b,
                    emissive: 0xffd43b,
                    emissiveIntensity: 0.5
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.set(x, 3, z); // At grass level
                scene.add(ring);
                pathSegments.push({ mesh: ring });
                
                // Glass-like tunnel walls - see-through burrow effect
                const tunnelGeo = new THREE.BoxGeometry(CONFIG.TILE_SIZE - 2, 10, CONFIG.TILE_SIZE - 2);
                const tunnelMat = new THREE.MeshLambertMaterial({ 
                    color: 0x2d1f12,
                    transparent: true,
                    opacity: 0.4,
                    emissive: 0x1a1008,
                    emissiveIntensity: 0.2
                });
                const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
                tunnel.position.set(x, -2, z); // Below surface
                scene.add(tunnel);
                pathSegments.push({ mesh: tunnel });
                
                // Glowing tunnel floor - where enemies walk
                const floorGeo = new THREE.BoxGeometry(CONFIG.TILE_SIZE - 3, 1, CONFIG.TILE_SIZE - 3);
                const floorMat = new THREE.MeshLambertMaterial({ 
                    color: 0x1a1008,
                    emissive: 0x3d2817,
                    emissiveIntensity: 0.3
                });
                const floor = new THREE.Mesh(floorGeo, floorMat);
                floor.position.set(x, -6, z); // Deep in the burrow
                scene.add(floor);
                pathSegments.push({ mesh: floor });
                
                // Side walls of tunnel - darker dirt
                const wallGeo = new THREE.BoxGeometry(2, 10, CONFIG.TILE_SIZE);
                const wallMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
                
                // Left wall
                const wallL = new THREE.Mesh(wallGeo, wallMat);
                wallL.position.set(x - CONFIG.TILE_SIZE/2 + 1, -2, z);
                scene.add(wallL);
                
                // Right wall  
                const wallR = new THREE.Mesh(wallGeo, wallMat);
                wallR.position.set(x + CONFIG.TILE_SIZE/2 - 1, -2, z);
                scene.add(wallR);
                
                // Directional marker on tunnel ceiling (visible from above)
                if (i % 3 === 0 && i < path.length - 1) {
                    const nextP = path[i + 1];
                    const markerGeo = new THREE.ConeGeometry(2, 5, 4);
                    markerGeo.rotateX(Math.PI / 2);
                    const markerMat = new THREE.MeshLambertMaterial({ 
                        color: 0xffd43b, 
                        emissive: 0xffd43b, 
                        emissiveIntensity: 0.6,
                        transparent: true,
                        opacity: 0.7
                    });
                    const marker = new THREE.Mesh(markerGeo, markerMat);
                    marker.position.set(x, 3, z); // Just below surface
                    marker.lookAt(
                        nextP.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, 
                        3, 
                        nextP.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
                    );
                    scene.add(marker);
                }
            }
        }

        function generatePathOptions() {
            // Static paths - no dynamic generation needed
        }

        function startGame() {
            gameState.gameStarted = true;
            gameState.gamePhase = 'PREPARATION';
            gameState.preparationTimer = CONFIG.PREPARATION_TIME;
            preparationStartTime = Date.now(); // Reset prep timer
            
            // Generate first path
            generateNewPath();
            
            // Clear old path tiles and draw new ones
            clearPathTiles();
            drawPath(currentPath);
            
            updateUI();
        }
        
        function generateNewPath() {
            const path = selectPathForWave(gameState.wave);
            currentPath = path;
            
            // Build pathGrid for collision detection
            gameState.pathGrid = [];
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
                gameState.pathGrid[x] = [];
                for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
                    gameState.pathGrid[x][y] = false;
                }
            }
            
            path.forEach(p => {
                if (p.x >= 0 && p.x < CONFIG.MAP_WIDTH && p.y >= 0 && p.y < CONFIG.MAP_HEIGHT) {
                    gameState.pathGrid[p.x][p.y] = true;
                }
            });
            
            // Check for turrets in path and destroy them
            destroyOverlappingTurrets();
        }
        
        function destroyOverlappingTurrets() {
            const turretsToDestroy = [];
            
            gameState.towers.forEach((tower, index) => {
                if (tower.gridX >= 0 && tower.gridX < CONFIG.MAP_WIDTH &&
                    tower.gridY >= 0 && tower.gridY < CONFIG.MAP_HEIGHT) {
                    if (gameState.pathGrid[tower.gridX] && gameState.pathGrid[tower.gridX][tower.gridY]) {
                        turretsToDestroy.push(index);
                    }
                }
            });
            
            // Destroy turrets from highest index first
            turretsToDestroy.sort((a, b) => b - a).forEach(index => {
                const tower = gameState.towers[index];
                const towerType = tower.typeKey;
                const refund = Math.floor(TOWER_TYPES[towerType].cost * 0.8);
                
                // Energy refund
                gameState.energy = Math.min(CONFIG.MAX_ENERGY, gameState.energy + refund);
                
                // Visual destruction effect
                createExplosion(tower.mesh.position.x, tower.mesh.position.y, tower.mesh.position.z, 1.5);
                
                // Remove from scene
                scene.remove(tower.mesh);
                
                // Remove from array
                gameState.towers.splice(index, 1);
            });
            
            if (turretsToDestroy.length > 0) {
                showFloatingText(window.innerWidth / 2, window.innerHeight / 2, 0, 
                    `+${turretsToDestroy.length} turrets destroyed!`, '#ff6b6b');
            }
        }
        
        function clearPathTiles() {
            // Remove old path meshes
            pathSegments.forEach(seg => {
                if (seg.mesh && seg.mesh.parent) {
                    scene.remove(seg.mesh);
                }
            });
            pathSegments = [];
        }
        
        function startWave() {
            if (gameState.gamePhase === 'GAME_OVER') return;
            
            // If in preparation phase, start wave early
            if (gameState.gamePhase === 'PREPARATION') {
                startWaveActive();
                return;
            }
            
            // If game not started yet, start it
            if (!gameState.gameStarted) {
                startGame();
                return;
            }
        }
        
        function startWaveActive() {
            gameState.gamePhase = 'WAVE_ACTIVE';
            gameState.waveActive = true;
            
            const waveData = generateWaveEnemies(gameState.wave);
            currentWaveNum = gameState.wave;
            currentWave = waveData;
            waveEnemies = [...waveData.enemies]; // Create copy to not modify original
            lastSpawnTime = Date.now();
            
            // Calculate wave duration
            const path = currentPath || [];
            const pathLength = path.length * CONFIG.TILE_SIZE;
            const baseSpeed = 2 + (gameState.wave * 0.2);
            const travelTime = (pathLength / baseSpeed);
            const spawnTime = (waveEnemies.length * waveData.spawnDelay) / 1000;
            waveDuration = Math.ceil(spawnTime + travelTime + 15); // More time for enemies to complete
            waveStartTime = Date.now();
            
            // Hide start button during wave
            document.getElementById('start-wave-btn').style.display = 'none';
            showWaveAnnouncement(gameState.wave);
            updateUI();
            
            console.log('Wave started:', gameState.wave, 'enemies:', waveEnemies.length);
        }
        
        function startPreparationPhase() {
            gameState.gamePhase = 'PREPARATION';
            gameState.preparationTimer = CONFIG.PREPARATION_TIME;
            gameState.waveActive = false;
            preparationStartTime = Date.now();
            
            const startBtn = document.getElementById('start-wave-btn');
            startBtn.style.display = 'block';
            startBtn.textContent = 'START WAVE';
            
            gameState.pathChanges = (gameState.pathChanges || 0) + 1;
            
            // Grow map every 5 waves
            const wave = gameState.wave;
            if (wave > 1 && wave % 5 === 1 && CONFIG.MAP_WIDTH < 20) {
                const oldWidth = CONFIG.MAP_WIDTH;
                const oldHeight = CONFIG.MAP_HEIGHT;
                CONFIG.MAP_WIDTH = Math.min(20, oldWidth + 2);
                CONFIG.MAP_HEIGHT = Math.min(20, oldHeight + 2);
                
                // Rebuild terrain with new size (simplified - would need full rebuild in production)
                console.log(`Map growing: ${oldWidth}x${oldHeight} -> ${CONFIG.MAP_WIDTH}x${CONFIG.MAP_HEIGHT}`);
            }
            
            gameState.wave++;
            generateNewPath();
            clearPathTiles();
            drawPath(currentPath);
            
            updateUI();
        }

        function createUI() {
            // Tower cards with enhanced visuals
            const container = document.getElementById('tower-buttons');
            Object.entries(TOWER_TYPES).forEach(([key, type]) => {
                const btn = document.createElement('div');
                btn.className = 'tower-btn';
                
                // Enhanced tower card with visual preview
                const towerColors = {
                    BASIC: '#ff6b6b',
                    SNIPER: '#4ecdc4',
                    CANNON: '#ffe66d',
                    TRAP: '#ff8787',
                    SLOW: '#74c0fc'
                };
                const color = towerColors[key] || '#fff';
                
                const dmg = type.damage || 1;
                const rate = type.fireRate ? Math.round(1000/type.fireRate) : 1;
                
                btn.innerHTML = `
                    <div class="tower-icon" style="background:linear-gradient(135deg, ${color}33, ${color}66); border: 2px solid ${color};">
                        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                            <svg width="40" height="40" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="15" fill="${color}" opacity="0.3"/>
                                <circle cx="20" cy="20" r="10" fill="${color}"/>
                                <rect x="15" y="8" width="10" height="20" fill="${color}" rx="2"/>
                                <circle cx="20" cy="20" r="5" fill="#fff" opacity="0.8"/>
                            </svg>
                        </div>
                    </div>
                    <div class="tower-name" style="color:${color};font-weight:bold;">${type.name}</div>
                    <div class="tower-cost" style="color:#ffd43b;">⚡ ${type.cost}</div>
                    <div class="tower-stats" style="color:#aaa;font-size:10px;">DMG: ${dmg} | SPD: ${rate}/s</div>
                `;
                if (gameState.energy < type.cost) btn.classList.add('disabled');
                
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (gameState.selectedTower === key) {
                        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                        gameState.selectedTower = null;
                    } else {
                        document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        gameState.selectedTower = key;
                    }
                });
                btn.setAttribute('data-tower', key);
                container.appendChild(btn);
            });

            // Start wave button
            const startBtn = document.getElementById('start-wave-btn');
            startBtn.textContent = 'START WAVE';
            
            startBtn.addEventListener('click', () => {
                if (gameState.gamePhase === 'GAME_OVER') {
                    location.reload();
                    return;
                }
                
                if (!gameState.gameStarted) {
                    // First click - start game
                    startGame();
                    startBtn.textContent = 'START WAVE';
                } else if (gameState.gamePhase === 'PREPARATION') {
                    // Click during preparation - start wave early
                    startWaveActive();
                } else if (gameState.gamePhase === 'WAVE_ACTIVE' && !gameState.waveActive) {
                    // Wave completed - start next preparation
                    startPreparationPhase();
                }
            });
        }

        function setupEventListeners() {
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // Camera rotation and zoom controls
            window.addEventListener('keydown', (e) => {
                if (gameState.gameOver || !gameState.gameStarted) return;
                const rotationSpeed = 0.15;
                const zoomSpeed = 0.1;
                
                if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') {
                    gameState.cameraAngle -= rotationSpeed;
                } else if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') {
                    gameState.cameraAngle += rotationSpeed;
                } else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                    gameState.cameraZoom = Math.max(0.3, gameState.cameraZoom - zoomSpeed);
                } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                    gameState.cameraZoom = Math.min(2, gameState.cameraZoom + zoomSpeed);
                }
                updateCameraPosition();
            });

            // Tower placement preview tile
            let previewTile = null;
            let rangeCircle = null;
            
            document.getElementById('game-container').addEventListener('mousemove', (e) => {
                if (!gameState.selectedTower || gameState.gameOver) {
                    if (previewTile) { scene.remove(previewTile); previewTile = null; }
                    if (rangeCircle) { scene.remove(rangeCircle); rangeCircle = null; }
                    return;
                }

                // Use window dimensions, not e.target (which could be canvas or child element)
                const mouse = new THREE.Vector2(
                    (e.clientX / window.innerWidth) * 2 - 1,
                    -(e.clientY / window.innerHeight) * 2 + 1
                );
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, camera);
                
                // Raycast against a ground plane at y=4
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4);
                const intersection = new THREE.Vector3();
                raycaster.ray.intersectPlane(groundPlane, intersection);
                
                if (!intersection) {
                    if (previewTile) { scene.remove(previewTile); previewTile = null; }
                    if (rangeCircle) { scene.remove(rangeCircle); rangeCircle = null; }
                    return;
                }

                const gridX = Math.floor(intersection.x / CONFIG.TILE_SIZE);
                const gridZ = Math.floor(intersection.z / CONFIG.TILE_SIZE);

                if (gridX < 0 || gridX >= CONFIG.MAP_WIDTH || 
                    gridZ < 0 || gridZ >= CONFIG.MAP_HEIGHT) {
                    if (previewTile) { scene.remove(previewTile); previewTile = null; }
                    if (rangeCircle) { scene.remove(rangeCircle); rangeCircle = null; }
                    return;
                }

                const isPath = gameState.pathGrid[gridX] && gameState.pathGrid[gridX] && gameState.pathGrid[gridX][gridZ];
                const isOccupied = gameState.towers.some(t => t.gridX === gridX && t.gridZ === gridZ);
                const canPlace = !isPath && !isOccupied && gameState.energy >= TOWER_TYPES[gameState.selectedTower].cost;

                if (!previewTile) {
                    const previewGeo = new THREE.BoxGeometry(CONFIG.TILE_SIZE - 2, 12, CONFIG.TILE_SIZE - 2);
                    const previewMat = new THREE.MeshLambertMaterial({ 
                        color: canPlace ? 0x69db7c : 0xff6b6b,
                        transparent: true,
                        opacity: 0.7
                    });
                    previewTile = new THREE.Mesh(previewGeo, previewMat);
                    scene.add(previewTile);
                } else {
                    previewTile.material.color.setHex(canPlace ? 0x69db7c : 0xff6b6b);
                }

                previewTile.position.set(
                    gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    6,
                    gridZ * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
                );

                const towerDef = TOWER_TYPES[gameState.selectedTower];
                const range = towerDef.range * CONFIG.TILE_SIZE;
                
                if (!rangeCircle) {
                    const ringGeo = new THREE.RingGeometry(range - 1, range, 64);
                    ringGeo.rotateX(-Math.PI / 2);
                    const ringMat = new THREE.MeshBasicMaterial({ 
                        color: canPlace ? 0x69db7c : 0xff6b6b,
                        transparent: true,
                        opacity: 0.35,
                        side: THREE.DoubleSide
                    });
                    rangeCircle = new THREE.Mesh(ringGeo, ringMat);
                    scene.add(rangeCircle);
                } else {
                    rangeCircle.material.color.setHex(canPlace ? 0x69db7c : 0xff6b6b);
                }
                
                rangeCircle.position.set(
                    gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    1,
                    gridZ * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
                );
            });

            document.getElementById('game-container').addEventListener('mouseleave', () => {
                if (previewTile) {
                    scene.remove(previewTile);
                    previewTile = null;
                }
                if (rangeCircle) {
                    scene.remove(rangeCircle);
                    rangeCircle = null;
                }
            });

            // Tower placement click handler
            document.getElementById('game-container').addEventListener('click', (e) => {
                if (!gameState.selectedTower || gameState.gameOver) return;

                // Use window dimensions, not e.target
                const mouse = new THREE.Vector2(
                    (e.clientX / window.innerWidth) * 2 - 1,
                    -(e.clientY / window.innerHeight) * 2 + 1
                );
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, camera);
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4);
                const intersection = new THREE.Vector3();
                raycaster.ray.intersectPlane(groundPlane, intersection);
                
                if (!intersection) return;

                const gridX = Math.floor(intersection.x / CONFIG.TILE_SIZE);
                const gridZ = Math.floor(intersection.z / CONFIG.TILE_SIZE);

                // Check if valid placement
                if (gridX < 0 || gridX >= CONFIG.MAP_WIDTH || 
                    gridZ < 0 || gridZ >= CONFIG.MAP_HEIGHT) return;

                const isPath = gameState.pathGrid[gridX] && gameState.pathGrid[gridX] && gameState.pathGrid[gridX][gridZ];
                if (isPath) return;

                if (gameState.towers.some(t => t.gridX === gridX && t.gridZ === gridZ)) return;

                const towerDef = TOWER_TYPES[gameState.selectedTower];
                if (gameState.energy < towerDef.cost) {
                    showEnergyPopup(e.clientX, e.clientY, -50);
                    return;
                }

                // Place tower
                gameState.energy -= towerDef.cost;
                createTower(gridX, gridZ, gameState.selectedTower);
                updateUI();
            });
        }

        function createTower(gridX, gridZ, typeKey) {
            const towerDef = TOWER_TYPES[typeKey];
            const meshGroup = new THREE.Group();
            
            let barrel = null;
            let head = null;
            
            if (typeKey === 'BASIC') {
                // Basic turret - box base with rotating top
                const baseGeo = new THREE.BoxGeometry(CONFIG.TILE_SIZE * 0.7, 8, CONFIG.TILE_SIZE * 0.7);
                const baseMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 }); // Dark gray base
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.y = 4;
                base.castShadow = true;
                meshGroup.add(base);

                // Rotating turret head
                const headGeo = new THREE.BoxGeometry(CONFIG.TILE_SIZE * 0.5, 6, CONFIG.TILE_SIZE * 0.5);
                const headMat = new THREE.MeshLambertMaterial({ color: 0x718096 }); // Lighter gray
                head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 11;
                head.castShadow = true;
                meshGroup.add(head);

                // Barrel
                const barrelGeo = new THREE.CylinderGeometry(2, 2, 10);
                barrelGeo.rotateZ(Math.PI / 2);
                const barrelMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
                barrel = new THREE.Mesh(barrelGeo, barrelMat);
                barrel.position.set(8, 11, 0);
                barrel.castShadow = true;
                meshGroup.add(barrel);
                
            } else if (typeKey === 'SNIPER') {
                // Sniper tower - tall with long barrel
                const baseGeo = new THREE.CylinderGeometry(8, 10, 6, 8);
                const baseMat = new THREE.MeshLambertMaterial({ color: 0x553c9a }); // Purple base
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.y = 3;
                base.castShadow = true;
                meshGroup.add(base);

                // Tall body
                const bodyGeo = new THREE.CylinderGeometry(5, 6, 12, 6);
                const bodyMat = new THREE.MeshLambertMaterial({ color: 0x6b46c1 }); // Purple
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 12;
                body.castShadow = true;
                meshGroup.add(body);
                head = body;

                // Long barrel
                const barrelGeo = new THREE.CylinderGeometry(1.5, 2, 20);
                barrelGeo.rotateZ(Math.PI / 2);
                const barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a202c });
                barrel = new THREE.Mesh(barrelGeo, barrelMat);
                barrel.position.set(15, 14, 0);
                barrel.castShadow = true;
                meshGroup.add(barrel);

                // Scope
                const scopeGeo = new THREE.SphereGeometry(3, 8, 8);
                const scopeMat = new THREE.MeshLambertMaterial({ color: 0xe53e3e }); // Red dot
                const scope = new THREE.Mesh(scopeGeo, scopeMat);
                scope.position.set(22, 14, 0);
                meshGroup.add(scope);
                
            } else if (typeKey === 'CANNON') {
                // Cannon tower - heavy, round, with thick barrel
                const baseGeo = new THREE.CylinderGeometry(12, 14, 6, 12);
                const baseMat = new THREE.MeshLambertMaterial({ color: 0xc53030 }); // Red base
                const base = new THREE.Mesh(baseGeo, baseMat);
                base.position.y = 3;
                base.castShadow = true;
                meshGroup.add(base);

                // Dome top
                const domeGeo = new THREE.SphereGeometry(10, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
                const domeMat = new THREE.MeshLambertMaterial({ color: 0x9b2c2c }); // Dark red
                const dome = new THREE.Mesh(domeGeo, domeMat);
                dome.position.y = 6;
                dome.castShadow = true;
                meshGroup.add(dome);

                // Thick cannon barrel
                const barrelGeo = new THREE.CylinderGeometry(4, 5, 14);
                barrelGeo.rotateZ(Math.PI / 2);
                const barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a202c });
                const barrel = new THREE.Mesh(barrelGeo, barrelMat);
                barrel.position.set(10, 8, 0);
                barrel.castShadow = true;
                meshGroup.add(barrel);

                // Second barrel
                const barrel2Geo = new THREE.CylinderGeometry(4, 5, 14);
                barrel2Geo.rotateZ(Math.PI / 2);
                const barrel2 = new THREE.Mesh(barrel2Geo, barrelMat);
                barrel2.position.set(10, 8, 6);
                barrel2.castShadow = true;
                meshGroup.add(barrel2);
            }

            // Position at tile center - on top of terrain
            const tileCenterX = gridX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const tileCenterZ = gridZ * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            meshGroup.position.set(tileCenterX, 6, tileCenterZ);

            scene.add(meshGroup);

            // Create range indicator (hidden by default)
            const range = TOWER_TYPES[typeKey].range * CONFIG.TILE_SIZE;
            const rangeGeo = new THREE.RingGeometry(range - 2, range, 32);
            const rangeMat = new THREE.MeshBasicMaterial({ 
                color: TOWER_TYPES[typeKey].color,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            const rangeIndicator = new THREE.Mesh(rangeGeo, rangeMat);
            rangeIndicator.rotation.x = -Math.PI / 2;
            rangeIndicator.position.set(tileCenterX, 0.5, tileCenterZ);
            scene.add(rangeIndicator);

            gameState.towers.push({
                mesh: meshGroup,
                gridX: gridX,
                gridZ: gridZ,
                damageMult: 1.0,
                typeKey: typeKey,
                fireRate: TOWER_TYPES[typeKey].fireRate || 60,
                lastFired: 0,
                rangeIndicator: rangeIndicator,
                barrel: barrel,
                head: head
            });

            // Mark that towers have been placed
            gameState.placedTowers = true;
            updateStartButton();

            updateUI();
        }

        function updateStartButton() {
            const startBtn = document.getElementById('start-wave-btn');
            if (gameState.placedTowers && !gameState.waveActive) {
                startBtn.textContent = `START WAVE ${gameState.wave}`;
                startBtn.style.background = '#69db7c';
            }
        }

        function spawnEnemy(type, variant, waveNum) {
			let speed = 0.6 + (waveNum * 0.04);  // Much slower, minimal increase
			let health; let damage; let geo; let color;

			switch(type) {
				case 'basic':
					health = 15 + (waveNum * 2);
					damage = 1;
					geo = new THREE.SphereGeometry(8, 16, 16);
					color = '#6B8E23';
					break;
				case 'fast':
					health = 15 + (waveNum * 2);
					damage = 1 + Math.floor(waveNum / 5);
					speed *= 1.8;
					geo = new THREE.SphereGeometry(6, 12, 12);
					color = '#DAA520';
					break;
				case 'tank':
					health = 50 + (waveNum * 6);
					damage = 3 + Math.floor(waveNum / 4);
					speed *= 0.5;
					geo = new THREE.BoxGeometry(14, 14, 14);
					color = '#4682B4';
					break;
				case 'sniper':
					health = 15 + waveNum;
					damage = 4 + Math.floor(waveNum / 3);
					speed *= 0.6;
					geo = new THREE.OctahedronGeometry(9);
					color = '#9370DB';
					break;
				case 'burrowing':
					health = 20 + (waveNum * 3);
					damage = 2 + Math.floor(waveNum / 4);
					speed *= 0.8;
					geo = new THREE.CylinderGeometry(8, 8, 12, 8);
					color = '#8B4513';
					break;
				case 'spawner':
					health = 35 + (waveNum * 5);
					damage = 1;
					speed *= 0.4;
					geo = new THREE.IcosahedronGeometry(12);
					color = '#DA70D6';
					break;
				case 'boss':
					health = (waveNum % 5 === 0) ? (80 + waveNum * 15) : 60;
					damage = (waveNum % 5 === 0) ? (15 + Math.floor(waveNum / 4)) : 5;
					speed *= 0.4;
					geo = new THREE.IcosahedronGeometry(20);
					color = '#8B0000';
					break;
				default:
					// Default to basic
					health = 25 + (waveNum * 4);
					damage = 1 + Math.floor(waveNum / 5);
					geo = new THREE.SphereGeometry(8, 16, 16);
					color = '#6B8E23';
			}

            const mat = new THREE.MeshLambertMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 0.4 // Stronger glow
            });

            // Add glow effect - slightly larger transparent sphere around enemy
            const glowGeo = new THREE.SphereGeometry(geo.parameters.radius * 1.4, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.25
            });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);

            const path = currentPath || [];
            
            if (path.length === 0) {
                console.error('No path defined!');
                return null;
            }
            
            const startPos = path[0];
            const firstWaypoint = path[1] || path[path.length - 1];

            // Convert grid coords to world coords: grid.x -> world.x, grid.y -> world.z
            const startX = startPos.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const startZ = startPos.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const targetX = firstWaypoint.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const targetZ = firstWaypoint.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            // Spawn enemies above ground for visibility
            const enemy = {
                mesh: new THREE.Mesh(geo, mat),
                position: new THREE.Vector3(startX, 8, startZ), // Above ground for visibility
                target: new THREE.Vector3(targetX, 8, targetZ),
                path: path,
                pathIndex: 0,
                speed: speed,
                health: health,
                maxHealth: health,
                damage: damage,
                variant: variant,
                id: Math.random(),
                type: type
            };

            enemy.mesh.position.copy(enemy.position);
            enemy.mesh.castShadow = true;
            scene.add(enemy.mesh);
            
            // Spawn animation - scale up from 0
            enemy.mesh.scale.set(0, 0, 0);
            animateSpawn(enemy.mesh);
            
            // Add glow mesh
            glowMesh.position.copy(enemy.position);
            scene.add(glowMesh);
            enemy.glowMesh = glowMesh;
            
            // Health bar
            const healthBarGeo = new THREE.PlaneGeometry(16, 3);
            const healthBarMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
            const healthBar = new THREE.Mesh(healthBarGeo, healthBarMat);
            healthBar.position.set(0, 20, 0);
            enemy.mesh.add(healthBar);
            enemy.healthBar = healthBar;
            
            return enemy;
        }
        
        // Enemy spawn animation
        function animateSpawn(mesh) {
            let scale = 0;
            const spawnInterval = setInterval(() => {
                scale += 0.1;
                mesh.scale.set(scale, scale, scale);
                if (scale >= 1) {
                    mesh.scale.set(1, 1, 1);
                    clearInterval(spawnInterval);
                }
            }, 30);
        }
        
        // Spawn wave announcement with animation
        function showWaveAnnouncement(waveNum) {
            const overlay = document.createElement('div');
            overlay.id = 'wave-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.6);
                z-index: 500;
                animation: fadeInOut 2s ease-in-out forwards;
            `;
            
            // Wave difficulty preview
            const difficulty = calculateWaveDifficulty(waveNum);
            const enemyCount = calculateEnemyCount(waveNum);
            const bossWave = waveNum % 5 === 0;
            
            overlay.innerHTML = `
                <div style="text-align: center; animation: wavePopIn 0.5s ease-out;">
                    <div style="font-size: 48px; color: #69db7c; font-weight: bold; text-shadow: 0 4px 20px rgba(105,219,124,0.5);">WAVE ${waveNum}</div>
                    <div style="font-size: 18px; color: #fff; margin-top: 10px;">Get Ready!</div>
                    <div style="font-size: 14px; color: #ffd43b; margin-top: 8px;">
                        ${enemyCount} enemies • Difficulty: ${difficulty}
                        ${bossWave ? '<br><span style="color:#ff6b6b; font-size:18px;">⚠️ BOSS WAVE ⚠️</span>' : ''}
                    </div>
                </div>
            `;
            document.getElementById('game-container').appendChild(overlay);
            
            // Add animation keyframes dynamically
            if (!document.getElementById('wave-animations')) {
                const style = document.createElement('style');
                style.id = 'wave-animations';
                style.textContent = `
                    @keyframes wavePopIn {
                        0% { transform: scale(0.5); opacity: 0; }
                        70% { transform: scale(1.1); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            setTimeout(() => overlay.remove(), 2500);
        }
        
        function updateEnemyHealthBars() {
            gameState.enemies.forEach(enemy => {
                if (!enemy.mesh.parent || !enemy.healthBar) return;
                
                const healthPercent = enemy.health / enemy.maxHealth;
                enemy.healthBar.material.color.setHex(healthPercent > 0.5 ? 0x51cf66 : (healthPercent > 0.25 ? 0xffd43b : 0xff6b6b));
                enemy.healthBar.scale.x = healthPercent;
                enemy.healthBar.position.y = 20 + Math.sin(Date.now() * 0.005) * 1;
            });
        }
        
        // Tower range indicator on mouse hover
        let hoveredTower = null;
        let mousePos = { x: 0, z: 0 };
        
        function updateTowerRangeIndicators() {
            // Check if mouse is over any tower
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(
                (mousePos.x / window.innerWidth) * 2 - 1,
                -(mousePos.z / window.innerHeight) * 2 + 1
            );
            raycaster.setFromCamera(mouse, camera);
            
            const towerMeshes = gameState.towers.map(t => t.mesh);
            const intersects = raycaster.intersectObjects(towerMeshes, true);
            
            // Hide all first
            gameState.towers.forEach(tower => {
                if (tower.rangeIndicator) {
                    tower.rangeIndicator.material.opacity = 0;
                }
            });
            
            // Show hovered tower range
            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                const tower = gameState.towers.find(t => t.mesh === hitMesh || t.mesh.children.includes(hitMesh));
                if (tower && tower.rangeIndicator) {
                    tower.rangeIndicator.material.opacity = 0.3;
                    // Pulse effect
                    const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 0.3;
                    tower.rangeIndicator.material.opacity = pulse;
                }
            }
        }
        
        // Track mouse position for range indicators
        document.addEventListener('mousemove', (e) => {
            mousePos.x = e.clientX;
            mousePos.z = e.clientY;
        });

        function updateEnemies(delta) {
            gameState.enemies.forEach((enemy, index) => {
                if (!enemy.mesh.parent || gameState.gameOver) return;

                const dir = enemy.target.clone().sub(enemy.position);
                const dist = dir.length();
                
                if (dist < 15) {
                    enemy.pathIndex = (enemy.pathIndex || 0) + 1;
                    
                    if (enemy.pathIndex >= enemy.path.length) {
                        removeEnemy(index, true);
                        gameState.lives--;
                        pulseHeart();
                        updateUI();
                        if (gameState.lives <= 0) {
                            endGame(false);
                        }
                        return;
                    }
                    
                    const nextWaypoint = enemy.path[enemy.pathIndex];
                    enemy.target.set(
                        nextWaypoint.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                        8, // Above ground for visibility
                        nextWaypoint.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
                    );
                }

                if (dist > 1) {
                    dir.normalize();
                    enemy.position.add(dir.multiplyScalar(enemy.speed));
                    enemy.mesh.position.copy(enemy.position);
                    if (enemy.glowMesh) enemy.glowMesh.position.copy(enemy.position);
                    enemy.mesh.lookAt(enemy.target);
                }
            });

            gameState.enemies = gameState.enemies.filter(e => e.mesh.parent && e.health > 0);
        }

        function removeEnemy(index, reachedEnd = false) {
            const enemy = gameState.enemies[index];
            if (!enemy || !enemy.mesh) return;

            scene.remove(enemy.mesh);
            
            // Track kills
            if (!reachedEnd) {
                gameState.totalKills = (gameState.totalKills || 0) + 1;
                
                // Track boss defeats
                if (enemy.type === 'boss') {
                    gameState.bossesDefeated = (gameState.bossesDefeated || 0) + 1;
                }
            }
            
            // Create explosion effect
            createExplosion(
                enemy.position.x,
                enemy.position.y,
                enemy.position.z,
                enemy.type === 'boss' ? 3 : 1
            );

            // Award energy for defeating enemy
            if (!reachedEnd) {
                let energyReward = 10;
                switch(enemy.type) {
                    case 'boss': energyReward = 30; break;
                    case 'spawner': energyReward = 20; break;
                    case 'tank': energyReward = 15; break;
                    case 'sniper': energyReward = 12; break;
                    case 'burrowing': energyReward = 15; break;
                    case 'fast': energyReward = 8; break;
                    default: energyReward = 10;
                }
                gameState.energy = Math.min(CONFIG.MAX_ENERGY, gameState.energy + energyReward);
                showFloatingText(enemy.position.x, enemy.position.y, enemy.position.z, `+${energyReward} ⚡`, '#feca57');
            }

            gameState.enemies.splice(index, 1);
        }

        function showFloatingText(x, y, z, text, color) {
            const div = document.createElement('div');
            div.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                color: ${color};
                font-size: 24px;
                font-weight: bold;
                pointer-events: none;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                animation: floatUp 1s ease-out forwards;
            `;
            div.textContent = text;
            document.getElementById('game-container').appendChild(div);
            setTimeout(() => div.remove(), 1000);
        }

        function pulseHeart() {
            const hearts = document.querySelectorAll('.heart');
            if (hearts.length > 0) {
                hearts[hearts.length - 1].classList.add('pulse');
            }
        }

        function createProjectile(towerIndex) {
            const tower = gameState.towers[towerIndex];
            const typeKey = tower.typeKey;
            
            // Find target at fire time
            let targetEnemy = null;
            let closestDist = Infinity;
            const towerPos = tower.mesh.position;
            const range = TOWER_TYPES[typeKey].range * CONFIG.TILE_SIZE;
            
            for (const enemy of gameState.enemies) {
                if (!enemy.mesh.parent) continue;
                const dist = towerPos.distanceTo(enemy.position);
                if (dist < range && dist < closestDist) {
                    closestDist = dist;
                    targetEnemy = enemy;
                }
            }
            
            if (!targetEnemy) return; // No target, don't fire
            
            const geo = new THREE.SphereGeometry(2, 8, 8);
            let color;
            let trailColor;
            
            switch(typeKey) {
                case 'BASIC':
                    color = '#ff6b6b';
                    trailColor = 0xff6b6b;
                    break;
                case 'SNIPER':
                    fireSniper(tower);
                    return;
                case 'CANNON':
                    color = '#ffe66d';
                    trailColor = 0xffe66d;
                    break;
            }

            const mat = new THREE.MeshLambertMaterial({ color: color });
            const projectileMesh = new THREE.Mesh(geo, mat);
            
            if (typeKey === 'CANNON') {
                projectileMesh.scale.set(2.5, 2, 2.5);
            }
            
            const startPos = tower.mesh.position.clone();
            startPos.y += 12;

            projectileMesh.position.copy(startPos);
            scene.add(projectileMesh);

            const projectile = {
                mesh: projectileMesh,
                position: startPos.clone(),
                target: targetEnemy,
                targetId: targetEnemy.id,
                damage: TOWER_TYPES[typeKey].damage * tower.damageMult,
                speed: 12,
                gridX: tower.gridX,
                gridZ: tower.gridZ,
                typeKey: typeKey,
                trail: [],
                trailColor: trailColor
            };
            
            for (let i = 0; i < 5; i++) {
                const trailGeo = new THREE.SphereGeometry(1.5 - i * 0.25);
                const trailMat = new THREE.MeshBasicMaterial({ 
                    color: trailColor, 
                    transparent: true, 
                    opacity: 0.5 - i * 0.1 
                });
                const trailMesh = new THREE.Mesh(trailGeo, trailMat);
                trailMesh.position.copy(startPos);
                scene.add(trailMesh);
                projectile.trail.push({ mesh: trailMesh, offset: i * 3 });
            }
            
            gameState.projectiles.push(projectile);
        }

        function updateProjectiles(delta) {
            gameState.projectiles = gameState.projectiles.filter((proj) => {
                if (!proj.mesh.parent && !gameState.gameOver) {
                    proj.trail.forEach(t => { if (t.mesh.parent) scene.remove(t.mesh); });
                    return false;
                }

                // Track the assigned target enemy
                let targetEnemy = null;
                if (proj.target && proj.target.mesh && proj.target.mesh.parent) {
                    targetEnemy = proj.target;
                } else {
                    // Target dead - find nearest replacement
                    let closestDist = Infinity;
                    for (const enemy of gameState.enemies) {
                        if (!enemy.mesh.parent) continue;
                        const dist = proj.position.distanceTo(enemy.position);
                        if (dist < closestDist && dist < 200) {
                            closestDist = dist;
                            targetEnemy = enemy;
                        }
                    }
                }

                if (targetEnemy) {
                    const dir = new THREE.Vector3().subVectors(targetEnemy.position, proj.position);
                    const dist = dir.length();
                    
                    if (dist < 12) {
                        // Hit!
                        targetEnemy.health -= proj.damage;
                        createExplosion(proj.position.x, proj.position.y, proj.position.z, 0.8);
                        createHitFlash(targetEnemy.position, proj.trailColor);
                        proj.trail.forEach(t => { if (t.mesh.parent) scene.remove(t.mesh); });
                        scene.remove(proj.mesh);
                        return false;
                    }
                    
                    dir.normalize();
                    proj.position.add(dir.multiplyScalar(proj.speed));
                    proj.mesh.position.copy(proj.position);
                    
                    // Update trail
                    for (let i = proj.trail.length - 1; i >= 0; i--) {
                        const t = proj.trail[i];
                        if (i > 0) {
                            t.mesh.position.copy(proj.trail[i-1].mesh.position);
                        } else {
                            t.mesh.position.lerp(proj.position, 0.3);
                        }
                    }
                } else {
                    // No target at all - remove projectile
                    proj.trail.forEach(t => { if (t.mesh.parent) scene.remove(t.mesh); });
                    scene.remove(proj.mesh);
                    return false;
                }

                // Out of bounds check
                if (proj.position.length() > CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE * 2) {
                    proj.trail.forEach(t => { if (t.mesh.parent) scene.remove(t.mesh); });
                    scene.remove(proj.mesh);
                    return false;
                }

                return true;
            });
        }

        function fireSniper(tower) {
            const range = TOWER_TYPES.SNIPER.range * CONFIG.TILE_SIZE;
            let hitEnemy = null;
            let closestDist = Infinity;

            for (const enemy of gameState.enemies) {
                if (!enemy.mesh.parent) continue;
                const dist = tower.mesh.position.distanceTo(enemy.position);
                if (dist < range && dist < closestDist) {
                    closestDist = dist;
                    hitEnemy = enemy;
                }
            }

            if (hitEnemy) {
                hitEnemy.health -= TOWER_TYPES.SNIPER.damage * tower.damageMult;
                
                // Enhanced laser beam with glow
                const laserGeo = new THREE.CylinderGeometry(0.8, 0.8, closestDist, 8);
                laserGeo.rotateZ(Math.PI / 2);
                const laserMat = new THREE.MeshBasicMaterial({ 
                    color: 0x4ecdc4, 
                    transparent: true, 
                    opacity: 0.9 
                });
                const laser = new THREE.Mesh(laserGeo, laserMat);
                
                // Outer glow
                const glowGeo = new THREE.CylinderGeometry(2, 2, closestDist, 8);
                glowGeo.rotateZ(Math.PI / 2);
                const glowMat = new THREE.MeshBasicMaterial({ 
                    color: 0x4ecdc4, 
                    transparent: true, 
                    opacity: 0.3 
                });
                const glow = new THREE.Mesh(glowGeo, glowMat);
                
                const midPoint = tower.mesh.position.clone().add(hitEnemy.position.clone()).multiplyScalar(0.5);
                midPoint.y += 12;
                laser.position.copy(midPoint);
                glow.position.copy(midPoint);
                laser.lookAt(hitEnemy.position.clone().add(new THREE.Vector3(0, 12, 0)));
                glow.lookAt(hitEnemy.position.clone().add(new THREE.Vector3(0, 12, 0)));
                scene.add(laser);
                scene.add(glow);
                
                // Hit flash effect
                createHitFlash(hitEnemy.position, 0x4ecdc4);
                
                setTimeout(() => {
                    if (laser.parent) scene.remove(laser);
                    if (glow.parent) scene.remove(glow);
                    laser.geometry.dispose();
                    laser.material.dispose();
                    glow.geometry.dispose();
                    glow.material.dispose();
                }, 150);

                createExplosion(hitEnemy.position.x, hitEnemy.position.y, hitEnemy.position.z, 0.5);
            } else {
                const geo = new THREE.SphereGeometry(2);
                const mat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.8 });
                const beam = new THREE.Mesh(geo, mat);
                beam.position.copy(tower.mesh.position);
                beam.position.y += 15;
                scene.add(beam);

                let alpha = 0.8;
                const fadeInterval = setInterval(() => {
                    if (!beam.parent || alpha <= 0) {
                        clearInterval(fadeInterval);
                        if (beam.parent) scene.remove(beam);
                        beam.geometry.dispose();
                        beam.material.dispose();
                        return;
                    }
                    alpha -= 0.08;
                    beam.material.opacity = alpha;
                    beam.scale.multiplyScalar(1.1);
                }, 16);
            }
        }

        function createExplosion(x, y, z, intensity = 1) {
            const radius = 20 * intensity;
            const particleCount = 15 * intensity;
            
            // Explosion colors based on intensity
            const colors = intensity > 0.8 ? 
                ['#ff6b6b', '#ff8888', '#ffff44'] : // Boss kill - red/gold
                ['#ff8844', '#ffaa66', '#ffcc44']; // Normal - orange/gold
            
            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 0.5;
                const vx = Math.cos(angle) * speed;
                const vz = Math.sin(angle) * speed;
                
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                debrisParticles.push({
                    x: x,
                    y: y,
                    z: z,
                    vx: vx,
                    vz: vz,
                    vy: Math.random() * 3 + 2,
                    life: 60 + intensity * 20,
                    color: color,
                    size: radius / particleCount * (0.8 + Math.random() * 0.4)
                });
            }
            
            // Add a flash effect
            const flashGeo = new THREE.SphereGeometry(8 * intensity, 8, 8);
            const flashMat = new THREE.MeshBasicMaterial({
                color: 0xffff88,
                transparent: true,
                opacity: 0.8
            });
            const flash = new THREE.Mesh(flashGeo, flashMat);
            flash.position.set(x, y, z);
            scene.add(flash);
            
            // Fade out flash
            const flashInterval = setInterval(() => {
                flash.material.opacity -= 0.15;
                flash.scale.multiplyScalar(1.1);
                if (flash.material.opacity <= 0) {
                    scene.remove(flash);
                    clearInterval(flashInterval);
                }
            }, 30);
        }
        
        // Hit flash effect for sniper/precision hits
        function createHitFlash(position, color = 0xff6b6b) {
            const flashGeo = new THREE.RingGeometry(2, 8, 16);
            const flashMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const flash = new THREE.Mesh(flashGeo, flashMat);
            flash.position.copy(position);
            flash.position.y += 10;
            flash.rotation.x = -Math.PI / 2;
            scene.add(flash);
            
            // Expand and fade
            const flashInterval = setInterval(() => {
                flash.material.opacity -= 0.1;
                flash.scale.multiplyScalar(1.15);
                if (flash.material.opacity <= 0) {
                    scene.remove(flash);
                    clearInterval(flashInterval);
                }
            }, 30);
        }

        function updateTerrain(delta) {
            const time = Date.now() * 0.001;
            pathSegments.forEach((segment, i) => {
                if (segment.mesh) {
                    segment.mesh.position.y += Math.sin(time + i * 0.5) * 0.02;
                }
            });
            
            // Animate clouds drifting
            clouds.forEach((cloud, i) => {
                if (cloud.group && cloud.group.parent) {
                    const phase = cloud.phase || 0;
                    // Drift horizontally with gentle bobbing
                    cloud.group.position.x += cloud.speed * 0.5;
                    cloud.group.position.y += Math.sin(time * 0.5 + phase) * 0.1;
                    
                    // Wrap around map
                    const maxX = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE * 1.5;
                    if (cloud.group.position.x > maxX) {
                        cloud.group.position.x = -100;
                    }
                }
            });
            
            ambientParticles.forEach((p, i) => {
                if (p.mesh && p.mesh.parent) {
                    // Firefly-style floating motion
                    const phase = p.phase || 0;
                    p.mesh.position.y += Math.sin(time * 2 + phase) * 0.15;
                    p.mesh.position.x += Math.cos(time * 0.5 + phase) * 0.08;
                    p.mesh.position.z += Math.sin(time * 0.3 + phase) * 0.05;
                    
                    // Pulse glow effect
                    p.mesh.material.opacity = 0.3 + Math.sin(time * 3 + phase) * 0.3;
                    
                    // Wrap around map bounds
                    const maxX = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
                    const maxZ = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;
                    if (p.mesh.position.y > 40) p.mesh.position.y = 5;
                    if (p.mesh.position.x > maxX) p.mesh.position.x = 0;
                    if (p.mesh.position.z > maxZ) p.mesh.position.z = 0;
                    if (p.mesh.position.x < 0) p.mesh.position.x = maxX;
                    if (p.mesh.position.z < 0) p.mesh.position.z = maxZ;
                }
            });
        }
        
        function createAmbientParticles() {
            const particleGeo = new THREE.SphereGeometry(1, 6, 6);
            const particleMat = new THREE.MeshBasicMaterial({ 
                color: 0xffff44, 
                transparent: true, 
                opacity: 0.6 
            });
            
            for (let i = 0; i < 40; i++) {
                const particle = new THREE.Mesh(particleGeo, particleMat.clone());
                particle.position.set(
                    Math.random() * CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE,
                    Math.random() * 30 + 8,
                    Math.random() * CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE
                );
                particle.material.opacity = 0.3 + Math.random() * 0.4;
                particle.material.color.setHex(Math.random() > 0.5 ? 0xffff44 : 0x88ff88);
                scene.add(particle);
                ambientParticles.push({ 
                    mesh: particle, 
                    speed: 0.3 + Math.random() * 0.3,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        
        // clouds, ambientParticles, pathSegments, debrisParticles declared at top

        function updateUI() {
            // Battery bar fill
            const batteryFill = document.getElementById('battery-fill');
            if (batteryFill) {
                const pct = (gameState.energy / CONFIG.MAX_ENERGY) * 100;
                batteryFill.style.width = `${pct}%`;
                batteryFill.classList.remove('low', 'medium');
                if (pct < 25) {
                    batteryFill.classList.add('low');
                } else if (pct < 50) {
                    batteryFill.classList.add('medium');
                }
            }
            
            // Energy ring (legacy, may not exist)
            const ring = document.getElementById('energy-ring-progress');
            if (ring) {
                const circumference = 214;
                const offset = circumference - (gameState.energy / CONFIG.MAX_ENERGY) * circumference;
                ring.style.strokeDashoffset = offset;
            }
            
            const energyVal = document.getElementById('energy-val');
            if (energyVal) energyVal.textContent = Math.floor(gameState.energy);
            
            const livesContainer = document.getElementById('lives-display');
            if (livesContainer) {
                const hearts = '❤️'.repeat(Math.max(0, Math.min(gameState.lives, CONFIG.BASE_LIVES)));
                livesContainer.innerHTML = hearts.split('').map((h, i) => 
                    `<span class="heart">${h}</span>`
                ).join('');
            }

            const waveInfo = document.getElementById('wave-info');
            if (waveInfo) {
                const waveText = gameState.waveActive ? `Wave ${gameState.wave} (Active)` : `Wave ${gameState.wave}`;
                waveInfo.textContent = waveText;
            }
            
            // Wave preview/difficulty
            const wavePreview = document.getElementById('wave-preview');
            if (wavePreview && !gameState.waveActive) {
                const nextDiff = calculateWaveDifficulty(gameState.wave);
                const nextCount = calculateEnemyCount(gameState.wave);
                const isBoss = gameState.wave % 5 === 0;
                wavePreview.textContent = `${nextCount} enemies • Diff: ${nextDiff}${isBoss ? ' (BOSS)' : ''}`;
            }

            const timerEl = document.getElementById('wave-timer');
            const timerValEl = document.getElementById('wave-timer-val');
            if (timerEl && timerValEl) {
                if (gameState.waveActive && waveStartTime > 0) {
                    const elapsed = Math.floor((Date.now() - waveStartTime) / 1000);
                    const remaining = Math.max(0, waveDuration - elapsed);
                    const minutes = Math.floor(remaining / 60);
                    const seconds = remaining % 60;
                    timerEl.style.display = 'inline-block';
                    timerValEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                } else {
                    timerEl.style.display = 'none';
                }
            }

            // Wave progress bar (may not exist)
            const progressFill = document.getElementById('wave-progress-fill');
            if (progressFill) {
                const progress = Math.min(100, (gameState.wave / Math.max(gameState.wave, 10)) * 100);
                progressFill.style.width = `${progress}%`;
            }

            Object.entries(TOWER_TYPES).forEach(([key, type]) => {
                const btn = document.querySelector(`[data-tower="${key}"]`);
                if (!btn) return;
                if (gameState.energy < type.cost) {
                    btn.classList.add('disabled');
                } else {
                    btn.classList.remove('disabled');
                }
            });
        }

        function showEnergyPopup(x, y, amount) {
            const div = document.createElement('div');
            div.className = 'energy-popup';
            div.innerHTML = `+${amount}⚡`;
            div.style.left = `${x}px`;
            div.style.top = `${y}px`;
            document.body.appendChild(div);

            // Cleanup after animation
            setTimeout(() => div.remove(), 1000);
        }

        function updateChaosMeter(delta) {
            const fill = document.getElementById('chaos-fill');
            if (!fill) return;
            const baseGain = 0.1 * delta;
            const currentRate = baseGain;
            let newChaos = (gameState.chaos || 0) + currentRate;
            const percent = Math.min(100, (newChaos / 25) * 100);
            fill.style.width = `${percent}%`;
        }

        // ==================== WAVE GENERATION ====================
        function checkWaveCompletion() {
            if (!gameState.waveActive) return;
            if (!waveEnemies || !currentWave) return;

            const now = Date.now();
            
            // Spawn enemies based on timestamp
            if (waveEnemies.length > 0 && now - lastSpawnTime >= currentWave.spawnDelay) {
                const enemyData = waveEnemies.shift();
                const enemy = spawnEnemy(enemyData.type, enemyData.variant, currentWaveNum);
                if (enemy) {
                    gameState.enemies.push(enemy);
                }
                lastSpawnTime = now;
            }

            const elapsed = (now - waveStartTime) / 1000;
            const timerExpired = elapsed >= waveDuration;
            
            // Wave complete when: timer expired OR all enemies cleared
            if (timerExpired || (waveEnemies.length === 0 && gameState.enemies.length === 0)) {
                // Kill any remaining enemies
                gameState.enemies.forEach(enemy => {
                    if (enemy.mesh && enemy.mesh.parent) {
            scene.remove(enemy.mesh);
            
            // Remove glow mesh
            if (enemy.glowMesh && enemy.glowMesh.parent) {
                scene.remove(enemy.glowMesh);
            }
            
            // Remove health bar
            if (enemy.healthBar && enemy.healthBar.parent) {
                enemy.mesh.remove(enemy.healthBar);
            }
                    }
                });
                gameState.enemies = [];
                waveComplete();
            }
        }

        function waveComplete() {
            // Wave completion bonus
            gameState.energy = Math.min(CONFIG.MAX_ENERGY, gameState.energy + 20);
            
            if (Math.random() < 0.35) {
                showEventPopup();
            }

            // Update max wave reached
            if (gameState.wave > gameState.maxWaveReached) {
                gameState.maxWaveReached = gameState.wave;
            }
            
            // Transition to preparation phase for next wave
            startPreparationPhase();
            
            updateUI();
        }

        function showEventPopup() {
            const effects = [
                { type: 'energy', amount: 50, text: '+50 Energy' },
                { type: 'lives', amount: 2, text: '+2 Lives' },
                { type: 'buff', amount: 1.5, text: '+50% Damage (60s)' }
            ];

            const effect = effects[Math.floor(Math.random() * effects.length)];
            const popup = document.getElementById('event-popup');
            
            if (effect.type === 'buff') {
                gameState.towers.forEach(t => t.damageMult *= 1.5);
            }

            popup.innerHTML = `<strong>EVENT!</strong><br>${effect.text}`;
            popup.classList.add('show');
            setTimeout(() => popup.classList.remove('show'), 3000);
        }

        let lastEnergyRegen = Date.now();
        
        function animate() {
            requestAnimationFrame(animate);

            if (gameState.gameOver) return;

            const delta = 16;
            const now = Date.now();
            
            // Energy regeneration (+1 per second)
            if (now - lastEnergyRegen >= 1000) {
                gameState.energy = Math.min(CONFIG.MAX_ENERGY, gameState.energy + CONFIG.ENERGY_REGEN);
                lastEnergyRegen = now;
                updateUI();
            }
            
            // Preparation phase countdown
            if (gameState.gamePhase === 'PREPARATION') {
                const elapsed = Math.floor((now - preparationStartTime) / 1000);
                gameState.preparationTimer = Math.max(0, CONFIG.PREPARATION_TIME - elapsed);
                
                const startBtn = document.getElementById('start-wave-btn');
                startBtn.textContent = gameState.preparationTimer > 0 ? 
                    `WAVE ${gameState.wave} - ${gameState.preparationTimer}s` : 'START WAVE';
                
                if (gameState.preparationTimer <= 0) {
                    startWaveActive();
                }
            }

            // Tower combat logic
            if (gameState.waveActive && gameState.enemies.length > 0) {
                gameState.towers.forEach((tower, index) => {
                    // Find nearest enemy in range
                    let closestEnemy = null;
                    let closestDist = Infinity;
                    const towerPos = tower.mesh.position;
                    const range = TOWER_TYPES[tower.typeKey].range * CONFIG.TILE_SIZE;
                    
                    for (const enemy of gameState.enemies) {
                        if (!enemy.mesh.parent) continue;
                        const dist = towerPos.distanceTo(enemy.position);
                        if (dist < range && dist < closestDist) {
                            closestDist = dist;
                            closestEnemy = enemy;
                        }
                    }
                    
                    // Rotate entire tower mesh toward target (Y axis only)
                    if (closestEnemy) {
                        const dx = closestEnemy.position.x - towerPos.x;
                        const dz = closestEnemy.position.z - towerPos.z;
                        const targetAngle = Math.atan2(dx, dz);
                        // Smooth rotation
                        let currentAngle = tower.mesh.rotation.y;
                        let diff = targetAngle - currentAngle;
                        // Normalize to -PI to PI
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        tower.mesh.rotation.y += diff * 0.15;
                    }
                    
                    const fireRate = tower.fireRate || 1000;
                    if (now - tower.lastFired > fireRate) {
                        createProjectile(index);
                        tower.lastFired = now;
                    }
                });
            }
            
            // Tower range indicator hover
            updateTowerRangeIndicators();
            
            checkWaveCompletion();
            updateEnemies(delta);
            updateProjectiles(delta);
            updateTerrain(delta);
            updateEnemyHealthBars();
            updateUI();

            renderer.render(scene, camera);
        }
        
        let preparationStartTime = Date.now();

        function endGame(victory) {
            gameState.gameOver = true;
            gameState.gamePhase = 'GAME_OVER';
            
            // Save score to leaderboard
            saveScore(gameState.maxWaveReached);
            
            // Update achievements
            updateAchievements();
            
            // Save game state
            saveGameState();
            
            const screen = document.getElementById('game-over-screen');
            screen.classList.remove('hidden');
            document.getElementById('end-title').textContent = victory ? 'VICTORY!' : 'GAME OVER';
            document.getElementById('end-reason').textContent = 
                victory ? `You reached wave ${gameState.maxWaveReached}!` : `You reached wave ${gameState.wave}. Better luck next time!`;
            
            // Show stats
            showGameStats();
        }

        // ==================== LEADERBOARD SYSTEM ====================
        const LEADERBOARD_KEY = 'finalTower_leaderboard';
        const MAX_SCORES = 10;
        
        function getLeaderboard() {
            try {
                const data = localStorage.getItem(LEADERBOARD_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                return [];
            }
        }
        
        function saveScore(wave) {
            if (wave < 1) return;
            
            const leaderboard = getLeaderboard();
            leaderboard.push({
                wave: wave,
                date: new Date().toISOString(),
                score: wave * 100
            });
            
            // Sort by wave (highest first)
            leaderboard.sort((a, b) => b.wave - a.wave);
            
            // Keep only top scores
            const topScores = leaderboard.slice(0, MAX_SCORES);
            
            try {
                localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topScores));
            } catch (e) {
                console.log('Could not save leaderboard');
            }
        }
        
        function showGameStats() {
            const leaderboard = getLeaderboard();
            const statsDiv = document.getElementById('game-stats') || createStatsDiv();
            
            let statsHTML = '<div id="game-stats" style="text-align:center; margin-top:20px;">';
            statsHTML += '<h3>Your Stats</h3>';
            statsHTML += `<p>Highest Wave: ${gameState.maxWaveReached}</p>`;
            statsHTML += `<p>Total Kills: ${gameState.totalKills || 0}</p>`;
            
            if (leaderboard.length > 0) {
                statsHTML += '<h3>Leaderboard</h3>';
                leaderboard.slice(0, 5).forEach((entry, i) => {
                    statsHTML += `<p>${i + 1}. Wave ${entry.wave} - ${entry.date.substring(0, 10)}</p>`;
                });
            }
            statsHTML += '</div>';
            
            const endReason = document.getElementById('end-reason');
            endReason.innerHTML += statsHTML;
        }
        
        function createStatsDiv() {
            const div = document.createElement('div');
            div.id = 'game-stats';
            return div;
        }
        
        // ==================== ACHIEVEMENTS SYSTEM ====================
        const ACHIEVEMENTS_KEY = 'finalTower_achievements';
        
        const ACHIEVEMENTS = {
            MOLE_MASHER: { id: 'mole_masher', name: 'Mole Masher', desc: 'Kill 100 enemies', target: 100, reward: 50 },
            SURVIVALIST: { id: 'survivalist', name: 'Survivalist', desc: 'Reach wave 20', target: 20, reward: 100 },
            PATHMASTER: { id: 'pathmaster', name: 'Pathmaster', desc: 'Survive 5 path changes', target: 5, reward: 75 },
            BOSS_BASHER: { id: 'boss_basher', name: 'Boss Basher', desc: 'Defeat 10 bosses', target: 10, reward: 100 },
            ENDLESS_DEFENDER: { id: 'endless_defender', name: 'Endless Defender', desc: 'Reach wave 50', target: 50, reward: 200 }
        };
        
        function getAchievements() {
            try {
                const data = localStorage.getItem(ACHIEVEMENTS_KEY);
                return data ? JSON.parse(data) : {};
            } catch (e) {
                return {};
            }
        }
        
        function saveAchievements(achievements) {
            try {
                localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
            } catch (e) {
                console.log('Could not save achievements');
            }
        }
        
        function unlockAchievement(id) {
            const achievements = getAchievements();
            if (!achievements[id]) {
                achievements[id] = { unlocked: true, date: new Date().toISOString() };
                saveAchievements(achievements);
                
                const achievement = ACHIEVEMENTS[id];
                if (achievement) {
                    gameState.energy = Math.min(CONFIG.MAX_ENERGY, gameState.energy + achievement.reward);
                    showFloatingText(window.innerWidth / 2, window.innerHeight / 2, 0, 
                        `🏆 ${achievement.name}! +${achievement.reward}⚡`, '#ffd700');
                }
            }
        }
        
        function updateAchievements() {
            const kills = gameState.totalKills || 0;
            const wave = gameState.maxWaveReached;
            const pathChanges = gameState.pathChanges || 0;
            const bossesDefeated = gameState.bossesDefeated || 0;
            
            if (kills >= 100) unlockAchievement('MOLE_MASHER');
            if (wave >= 20) unlockAchievement('SURVIVALIST');
            if (pathChanges >= 5) unlockAchievement('PATHMASTER');
            if (bossesDefeated >= 10) unlockAchievement('BOSS_BASHER');
            if (wave >= 50) unlockAchievement('ENDLESS_DEFENDER');
        }
        
        // ==================== SAVE/LOAD SYSTEM ====================
        const SAVE_KEY = 'finalTower_save';
        
        function saveGameState() {
            const saveData = {
                wave: gameState.wave,
                maxWaveReached: gameState.maxWaveReached,
                energy: gameState.energy,
                lives: gameState.lives,
                towers: gameState.towers.map(t => ({
                    typeKey: t.typeKey,
                    gridX: t.gridX,
                    gridY: t.gridY,
                    damageMult: t.damageMult
                })),
                totalKills: gameState.totalKills || 0,
                pathChanges: gameState.pathChanges || 0,
                bossesDefeated: gameState.bossesDefeated || 0,
                savedAt: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            } catch (e) {
                console.log('Could not save game');
            }
        }
        
        function loadGameState() {
            try {
                const data = localStorage.getItem(SAVE_KEY);
                if (data) {
                    const saveData = JSON.parse(data);
                    
                    gameState.wave = saveData.wave || 1;
                    gameState.maxWaveReached = saveData.maxWaveReached || 0;
                    gameState.energy = saveData.energy || CONFIG.BASE_ENERGY;
                    gameState.lives = saveData.lives || CONFIG.BASE_LIVES;
                    gameState.totalKills = saveData.totalKills || 0;
                    gameState.pathChanges = saveData.pathChanges || 0;
                    gameState.bossesDefeated = saveData.bossesDefeated || 0;
                    
                    return true;
                }
            } catch (e) {
                console.log('Could not load game');
            }
            return false;
        }
        
        function hasSavedGame() {
            try {
                return localStorage.getItem(SAVE_KEY) !== null;
            } catch (e) {
                return false;
            }
        }

        // ==================== GAME LOOP VARIABLES ====================
        let waveStartTime = 0;
        let waveDuration = 0;
        let currentWave = null;
        let waveEnemies = [];
        let lastSpawnTime = 0;
        let currentPathIndex = 0;
        // debrisParticles, pathSegments declared at top
        
        // ==================== VISUAL EFFECTS ====================
        function createProjectileTrail() {
            if (gameState.projectiles.length === 0) return;

            // Create particle trail for each projectile
            gameState.projectiles.forEach((proj, idx) => {
                if (!proj.mesh.parent && !gameState.gameOver) return;

                // Add a small trail sphere behind projectile
                const trailGeo = new THREE.SphereGeometry(1.5);
                const trailMat = new THREE.MeshBasicMaterial({
                    color: TOWER_TYPES[proj.gridX ? 'BASIC' : (proj.typeKey || 'CANNON')].color,
                    transparent: true,
                    opacity: 0.6
                });

                const trailMesh = new THREE.Mesh(trailGeo, trailMat);
                trailMesh.position.copy(proj.position).sub(new THREE.Vector3(5, -5, 5));
                scene.add(trailMesh);

                // Store cleanup info
                proj.trails.push({ mesh: trailMesh });
            });

            // Cleanup old trails (limit to last 20 frames)
            const maxTrails = gameState.projectiles.length * 3;
            let totalTrails = 0;
            
            gameState.projectiles.forEach((proj, idx) => {
                if (!proj.trails) proj.trails = [];
                while (proj.trails.length > maxTrails) {
                    const oldTrail = proj.trails.shift();
                    if (oldTrail && oldTrail.mesh.parent) {
                        scene.remove(oldTrail.mesh);
                        oldTrail.mesh.geometry.dispose();
                        oldTrail.mesh.material.dispose();
                    }
                }
            });
        }
        
        // Start the game
        init();
        
        // Always start fresh - don't load saved games
        // This ensures player always starts at wave 1 after death
        // (can re-enable save/load later if needed)
        console.log('Starting fresh - wave 1');
    