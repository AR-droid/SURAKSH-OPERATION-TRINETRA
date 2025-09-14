// Suraksh Core - AI-Driven Defence Digital Twin
// Integrated simulation for ammunition logistics, drone swarms, environment, and gunshot detection

class ANTS {
    constructor() {
        this.convoy = [
            { id: 1, type: 'truck', position: { x: 0, y: 0 }, supplies: { ammo: 100, fuel: 100, medical: 100 }, status: 'operational' },
            { id: 2, type: 'jeep', position: { x: 10, y: 0 }, supplies: { ammo: 50, fuel: 80, medical: 30 }, status: 'operational' },
            { id: 3, type: 'truck', position: { x: -10, y: 0 }, supplies: { ammo: 80, fuel: 120, medical: 60 }, status: 'operational' }
        ];
        this.pheromoneMap = new Map();
        this.baseLocation = { x: 0, y: 0 };
        this.supplyRoutes = [];
        this.threats = [];
        this.lastUpdateTime = Date.now();
    }

    updateConvoy(positions) {
        this.convoy = positions.map((pos, i) => ({
            ...(this.convoy[i] || {}),
            position: { x: pos.x, y: pos.y },
            lastUpdated: Date.now()
        }));
        this.updatePheromoneTrail();
        this.checkSupplies();
    }

    updatePheromoneTrail() {
        // Update pheromone trails based on convoy movement
        const currentTime = Date.now();
        const decayRate = 0.95; // Pheromone decay rate per second
        const newPheromoneMap = new Map();

        // Decay existing pheromones
        for (const [key, {strength, timestamp}] of this.pheromoneMap.entries()) {
            const age = (currentTime - timestamp) / 1000; // in seconds
            const decayedStrength = strength * Math.pow(decayRate, age);
            if (decayRate > 0.01) { // Threshold to remove weak pheromones
                newPheromoneMap.set(key, {
                    strength: decayedStrength,
                    timestamp: currentTime
                });
            }
        }

        // Add new pheromones from convoy positions
        this.convoy.forEach(vehicle => {
            const key = this.getGridKey(vehicle.position);
            const existing = newPheromoneMap.get(key) || { strength: 0 };
            newPheromoneMap.set(key, {
                strength: existing.strength + 0.5, // Base strength for new pheromones
                timestamp: currentTime
            });
        });

        this.pheromoneMap = newPheromoneMap;
    }

    getGridKey(position, gridSize = 5) {
        // Convert position to grid coordinates
        const x = Math.round(position.x / gridSize) * gridSize;
        const y = Math.round(position.y / gridSize) * gridSize;
        return `${x},${y}`;
    }

    checkSupplies() {
        const warningThreshold = 20; // Percentage
        
        this.convoy.forEach(vehicle => {
            // Check each supply type
            Object.entries(vehicle.supplies).forEach(([type, amount]) => {
                const percentage = (amount / 100) * 100;
                if (percentage < warningThreshold) {
                    console.warn(`Low ${type} (${percentage.toFixed(0)}%) in vehicle ${vehicle.id}`);
                    this.requestResupply(vehicle, type);
                }
            });
        });
    }

    requestResupply(vehicle, supplyType) {
        // Find nearest base or supply point
        const nearestBase = this.findNearestBase(vehicle.position);
        
        // Create resupply route
        const route = {
            vehicleId: vehicle.id,
            supplyType,
            from: vehicle.position,
            to: nearestBase.position,
            status: 'pending',
            priority: 'high',
            createdAt: Date.now()
        };
        
        this.supplyRoutes.push(route);
        return route;
    }

    findNearestBase(position) {
        // In a real implementation, this would query known bases
        // For now, return the main base
        return {
            id: 'base-1',
            position: this.baseLocation,
            type: 'main',
            supplies: { ammo: 1000, fuel: 2000, medical: 500 }
        };
    }

    updateThreats(threats) {
        this.threats = threats;
        this.evadeThreats();
    }

    evadeThreats() {
        const threatRadius = 50; // meters
        
        this.convoy.forEach(vehicle => {
            const nearbyThreats = this.threats.filter(threat => {
                const dx = threat.position.x - vehicle.position.x;
                const dy = threat.position.y - vehicle.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < threatRadius;
            });

            if (nearbyThreats.length > 0) {
                console.log(`Vehicle ${vehicle.id} taking evasive action!`);
                // In a real implementation, this would calculate an escape vector
                vehicle.status = 'evading';
            } else if (vehicle.status === 'evading') {
                vehicle.status = 'operational';
            }
        });
    }

    getStatus() {
        return {
            convoyStatus: this.convoy.map(v => ({
                id: v.id,
                position: v.position,
                status: v.status,
                supplies: v.supplies,
                lastUpdated: v.lastUpdated
            })),
            activeRoutes: this.supplyRoutes.length,
            activeThreats: this.threats.length
        };
    }
    getOptimalRoute(currentPos, targetPos) {
        // Simplified A* pathfinding with pheromone trails
        // In a real implementation, this would consider terrain, threats, etc.
        return {
            path: [currentPos, targetPos],
            risk: this.calculateRouteRisk([currentPos, targetPos])
        };
    }

    calculateRouteRisk(path) {
        let risk = 1.0; // Base risk
        // In a real implementation, this would consider terrain, threats, etc.
        path.forEach(point => {
            const key = this.getGridKey(point);
            const pheromone = this.pheromoneMap.get(key) || { strength: 0 };
            risk -= pheromone.strength * 0.1; // More pheromones = safer
        });
        return Math.max(0, risk);
    }
}

class BIRDS {
    constructor() {
        this.drones = [
            this.createDrone(1, { x: -20, y: 0 }),
            this.createDrone(2, { x: 20, y: 0 }),
            this.createDrone(3, { x: 0, y: 20 }),
            this.createDrone(4, { x: 0, y: -20 })
        ];
        this.swarmBehavior = {
            separation: 0.05,
            alignment: 0.05,
            cohesion: 0.02,
            maxSpeed: 5.0,
            targetInfluence: 0.1,
            threatAvoidance: 0.5,
            searchRadius: 100
        };
        this.mission = {
            type: 'patrol', // patrol, search, track, return
            target: null,
            area: {
                center: { x: 0, y: 0 },
                radius: 200
            },
            waypoints: []
        };
        this.threats = [];
        this.lastUpdate = Date.now();
    }

    createDrone(id, position) {
        return {
            id,
            position: { ...position },
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2
            },
            status: 'idle',
            battery: 100,
            sensors: {
                camera: 'operational',
                lidar: 'operational',
                thermal: 'operational'
            },
            lastSeen: {}
        };
    }

    updateSwarm(drones) {
        this.drones = drones || this.drones;
        const now = Date.now();
        const deltaTime = (now - (this.lastUpdate || now)) / 1000; // Convert to seconds
        this.lastUpdate = now;
        
        // Update each drone's behavior
        this.drones.forEach(drone => {
            if (drone.status === 'active') {
                this.applyFlockingBehavior(drone, deltaTime);
                this.updateDronePosition(drone, deltaTime);
                this.updateBattery(drone, deltaTime);
            }
        });
        
        return this.drones;
    }

    applyFlockingBehavior(drone, deltaTime) {
        if (!drone) return;
        
        const separation = { x: 0, y: 0 };
        const alignment = { x: 0, y: 0 };
        const cohesion = { x: 0, y: 0 };
        let neighborCount = 0;
        
        // Find nearby drones
        this.drones.forEach(other => {
            if (drone === other) return;
            
            const dx = other.position.x - drone.position.x;
            const dy = other.position.y - drone.position.y;
            const distanceSq = dx * dx + dy * dy;
            const desiredSeparation = 15 * 15; // Square for efficiency
            
            if (distanceSq < desiredSeparation * 4) { // Only consider close neighbors
                // Separation: steer to avoid crowding
                if (distanceSq > 0) {
                    const distance = Math.sqrt(distanceSq);
                    const diffX = dx / distance;
                    const diffY = dy / distance;
                    separation.x -= diffX / distanceSq;
                    separation.y -= diffY / distanceSq;
                }
                
                // Alignment: steer towards average heading of neighbors
                alignment.x += other.velocity.x;
                alignment.y += other.velocity.y;
                
                // Cohesion: steer towards average position of neighbors
                cohesion.x += other.position.x;
                cohesion.y += other.position.y;
                
                neighborCount++;
            }
        });
        
        // Apply behaviors if we have neighbors
        if (neighborCount > 0) {
            // Normalize and scale separation
            this.normalizeVector(separation);
            separation.x *= this.swarmBehavior.separation;
            separation.y *= this.swarmBehavior.separation;
            
            // Normalize and scale alignment
            this.normalizeVector(alignment);
            alignment.x *= this.swarmBehavior.alignment;
            alignment.y *= this.swarmBehavior.alignment;
            
            // Calculate cohesion (average position)
            cohesion.x /= neighborCount;
            cohesion.y /= neighborCount;
            
            // Steer towards cohesion point
            let cohesionForce = {
                x: cohesion.x - drone.position.x,
                y: cohesion.y - drone.position.y
            };
            this.normalizeVector(cohesionForce);
            cohesionForce.x *= this.swarmBehavior.cohesion;
            cohesionForce.y *= this.swarmBehavior.cohesion;
            
            // Apply all forces to velocity
            drone.velocity.x += separation.x + alignment.x + cohesionForce.x;
            drone.velocity.y += separation.y + alignment.y + cohesionForce.y;
        }
        
        // Apply mission-specific behaviors
        this.applyMissionBehavior(drone, deltaTime);
        
        // Limit speed
        this.limitSpeed(drone);
    }
    
    // Helper method to normalize a vector
    normalizeVector(vector) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length > 0) {
            vector.x /= length;
            vector.y /= length;
        }
    }
    
    // Limit drone speed to maximum allowed
    limitSpeed(drone) {
        const speed = Math.sqrt(drone.velocity.x * drone.velocity.x + drone.velocity.y * drone.velocity.y);
        if (speed > this.swarmBehavior.maxSpeed) {
            drone.velocity.x = (drone.velocity.x / speed) * this.swarmBehavior.maxSpeed;
            drone.velocity.y = (drone.velocity.y / speed) * this.swarmBehavior.maxSpeed;
        }
    }
    
    // Update drone position based on velocity
    updateDronePosition(drone, deltaTime) {
        if (!drone) return;
        
        // Update position based on velocity
        drone.position.x += drone.velocity.x * deltaTime;
        drone.position.y += drone.velocity.y * deltaTime;
        
        // Apply boundary conditions (optional)
        const boundary = 1000; // Define your boundary
        if (Math.abs(drone.position.x) > boundary) drone.velocity.x *= -1;
        if (Math.abs(drone.position.y) > boundary) drone.velocity.y *= -1;
    }
    
    // Update drone battery level
    updateBattery(drone, deltaTime) {
        // Decrease battery over time
        const batteryDrainRate = 0.1; // % per second
        drone.battery = Math.max(0, drone.battery - (batteryDrainRate * deltaTime));
        
        if (drone.battery < 10) {
            // Initiate return to base if battery is low
            this.initiateReturnToBase(drone);
        }
    }
    
    // Apply mission-specific behavior
    applyMissionBehavior(drone, deltaTime) {
        if (!drone) return;
        
        switch (this.mission.type) {
            case 'patrol':
                this.patrolBehavior(drone, deltaTime);
                break;
            case 'search':
                this.searchBehavior(drone, deltaTime);
                break;
            case 'track':
                this.trackBehavior(drone, deltaTime);
                break;
            case 'return':
                this.returnToBaseBehavior(drone, deltaTime);
                break;
        }
    }
    
    // Patrol behavior - circular pattern around center
    patrolBehavior(drone, deltaTime) {
        const center = this.mission.area.center;
        const radius = this.mission.area.radius || 100;
        
        // Calculate vector to center
        const toCenter = {
            x: center.x - drone.position.x,
            y: center.y - drone.position.y
        };
        
        // Calculate distance to center
        const distance = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
        
        // Add tangential velocity for circular motion
        if (distance > 0) {
            // Normalize toCenter
            toCenter.x /= distance;
            toCenter.y /= distance;
            
            // Calculate tangent (perpendicular) vector
            const tangent = { x: -toCenter.y, y: toCenter.x };
            
            // Scale tangent by desired speed
            const tangentSpeed = 0.5 * this.swarmBehavior.maxSpeed;
            tangent.x *= tangentSpeed;
            tangent.y *= tangentSpeed;
            
            // Add centripetal force to maintain circular path
            const centripetalForce = 0.1 * (distance - radius);
            toCenter.x *= centripetalForce;
            toCenter.y *= centripetalForce;
            
            // Apply forces
            drone.velocity.x += toCenter.x + tangent.x;
            drone.velocity.y += toCenter.y + tangent.y;
        }
    }
    
    // Search behavior - random walk pattern
    searchBehavior(drone, deltaTime) {
        // Implement search pattern (e.g., expanding square, lawnmower)
        // For now, just use random walk with some persistence
        if (Math.random() < 0.02) { // 2% chance to change direction each frame
            drone.velocity.x += (Math.random() - 0.5) * 0.5;
            drone.velocity.y += (Math.random() - 0.5) * 0.5;
        }
    }
    
    // Track behavior - follow a target
    trackBehavior(drone, deltaTime) {
        if (!this.mission.target) return;
        
        // Calculate vector to target
        const toTarget = {
            x: this.mission.target.x - drone.position.x,
            y: this.mission.target.y - drone.position.y
        };
        
        // Normalize and scale
        const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y);
        if (distance > 0) {
            toTarget.x = (toTarget.x / distance) * this.swarmBehavior.maxSpeed;
            toTarget.y = (toTarget.y / distance) * this.swarmBehavior.maxSpeed;
            
            // Apply steering force (weighted average)
            drone.velocity.x = drone.velocity.x * 0.7 + toTarget.x * 0.3;
            drone.velocity.y = drone.velocity.y * 0.7 + toTarget.y * 0.3;
        }
    }
    
    // Return to base behavior
    returnToBaseBehavior(drone, deltaTime) {
        const base = { x: 0, y: 0 }; // Default base position
        const toBase = {
            x: base.x - drone.position.x,
            y: base.y - drone.position.y
        };
        
        // Normalize and scale
        const distance = Math.sqrt(toBase.x * toBase.x + toBase.y * toBase.y);
        if (distance > 10) { // If not at base
            toBase.x = (toBase.x / distance) * this.swarmBehavior.maxSpeed;
            toBase.y = (toBase.y / distance) * this.swarmBehavior.maxSpeed;
            
            // Apply steering force
            drone.velocity.x = toBase.x;
            drone.velocity.y = toBase.y;
        } else {
            // Reached base, recharge
            drone.battery = Math.min(100, drone.battery + 10 * deltaTime);
            if (drone.battery >= 80) {
                // Resume previous mission or go to idle
                drone.status = 'idle';
            }
        }
    }
    
    // Initiate return to base sequence
    initiateReturnToBase(drone) {
        const prevMission = { ...this.mission };
        this.mission = {
            type: 'return',
            previousMission: prevMission,
            priority: 'high'
        };
        drone.status = 'returning';
    }
    
    // Get status of all drones
    getStatus() {
        return this.drones.map(drone => ({
            id: drone.id,
            position: { ...drone.position },
            velocity: { ...drone.velocity },
            battery: Math.round(drone.battery * 10) / 10,
            status: drone.status,
            sensors: { ...drone.sensors }
        }));
    }
    
    // Update mission parameters
    updateMission(missionUpdate) {
        this.mission = { ...this.mission, ...missionUpdate };
        
        // Update all drones' status based on new mission
        this.drones.forEach(drone => {
            if (drone.status !== 'returning') {
                drone.status = 'active';
            }
        });
    }
    
    // Add a new threat to be avoided
    addThreat(threat) {
        this.threats.push({
            ...threat,
            id: `threat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            detectedAt: Date.now()
        });
    }
    
    // Remove expired threats
    cleanupThreats(maxAge = 30000) { // 30 seconds default
        const now = Date.now();
        this.threats = this.threats.filter(
            threat => now - threat.detectedAt < maxAge
        );
    }
}

// FISH - Environmental Simulation
class FISH {
    constructor() {
        this.timeOfDay = 0; // 0-24 hours
        this.weather = 'clear'; // clear, rain, storm, fog
        this.temperature = 25; // Celsius
        this.wind = { speed: 5, direction: 0 }; // km/h, degrees
        this.terrain = [];
        this.terrainTypes = ['flat', 'hills', 'mountains', 'water', 'urban'];
        this.terrainSize = 1000; // meters
        this.cellSize = 50; // meters
        this.initializeTerrain();
    }
    
    initializeTerrain() {
        // Create a simple grid-based terrain
        const cells = Math.ceil(this.terrainSize / this.cellSize);
        this.terrain = [];
        
        for (let x = 0; x < cells; x++) {
            this.terrain[x] = [];
            for (let y = 0; y < cells; y++) {
                // Simple noise-based terrain generation
                const value = Math.random();
                let type;
                
                if (value < 0.1) type = 'water';
                else if (value < 0.3) type = 'flat';
                else if (value < 0.7) type = 'hills';
                else if (value < 0.9) type = 'mountains';
                else type = 'urban';
                
                this.terrain[x][y] = {
                    type,
                    elevation: this.calculateElevation(x, y, type),
                    moisture: Math.random(),
                    temperature: this.temperature + (Math.random() * 4 - 2),
                    hasCover: type === 'urban' || (type === 'hills' && Math.random() > 0.7),
                    isPassable: type !== 'water' && type !== 'mountains'
                };
            }
        }
    }
    
    calculateElevation(x, y, type) {
        // Simple elevation based on terrain type and position
        switch (type) {
            case 'water': return 0.1 + Math.random() * 0.2;
            case 'flat': return 0.3 + Math.random() * 0.3;
            case 'hills': return 0.6 + Math.random() * 0.5;
            case 'mountains': return 1.0 + Math.random() * 1.5;
            case 'urban': return 0.4 + Math.random() * 0.3;
            default: return 0.5;
        }
    }
    
    updateEnvironment(deltaTime) {
        // Update time of day (24-hour cycle)
        this.timeOfDay = (this.timeOfDay + (deltaTime / 3600)) % 24;
        
        // Update weather (simplified model)
        this.updateWeather(deltaTime);
        
        // Update temperature based on time of day
        this.updateTemperature();
        
        // Update wind (simplified)
        this.wind.speed += (Math.random() - 0.5) * 0.1;
        this.wind.speed = Math.max(0, Math.min(20, this.wind.speed));
        this.wind.direction = (this.wind.direction + (Math.random() - 0.5) * 5) % 360;
    }
    
    updateWeather(deltaTime) {
        // Simple weather state machine
        const weatherChangeChance = 0.001 * (deltaTime / 1000);
        
        if (Math.random() < weatherChangeChance) {
            const weatherTypes = ['clear', 'rain', 'fog', 'storm'];
            this.weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        }
        
        // Adjust parameters based on weather
        switch (this.weather) {
            case 'rain':
                this.temperature -= 0.01 * deltaTime;
                break;
            case 'storm':
                this.wind.speed = Math.min(20, this.wind.speed + 0.1 * deltaTime);
                this.temperature -= 0.02 * deltaTime;
                break;
            case 'fog':
                // Fog reduces visibility
                break;
            default: // clear
                this.temperature += 0.005 * deltaTime;
        }
    }
    
    updateTemperature() {
        // Daily temperature cycle (colder at night, warmer during the day)
        const timeRad = (this.timeOfDay / 24) * Math.PI * 2;
        const dailyVariation = Math.sin(timeRad - Math.PI/2) * 5; // ±5°C variation
        
        // Seasonal variation (simplified)
        const now = new Date();
        const dayOfYear = (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - 
                          Date.UTC(now.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
        const annualVariation = Math.sin((dayOfYear / 365) * Math.PI * 2) * 10; // ±10°C variation
        
        // Base temperature + daily + annual variation
        this.temperature = 15 + dailyVariation + annualVariation;
    }
    
    getTerrainAt(x, y) {
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor((x + this.terrainSize/2) / this.cellSize);
        const gridY = Math.floor((y + this.terrainSize/2) / this.cellSize);
        
        // Check bounds
        if (gridX < 0 || gridY < 0 || 
            gridX >= this.terrain.length || 
            gridY >= (this.terrain[0]?.length || 0)) {
            return {
                type: 'out_of_bounds',
                elevation: 0,
                isPassable: false,
                hasCover: false,
                temperature: this.temperature
            };
        }
        
        return this.terrain[gridX][gridY];
    }
    
    getWeatherEffects() {
        return {
            visibility: this.getVisibility(),
            windEffects: this.getWindEffects(),
            temperature: this.temperature,
            weather: this.weather,
            timeOfDay: this.timeOfDay
        };
    }
    
    getVisibility() {
        // In meters
        switch (this.weather) {
            case 'fog': return 50 + Math.random() * 100;
            case 'rain': return 200 + Math.random() * 300;
            case 'storm': return 100 + Math.random() * 200;
            default: return 1000 + Math.random() * 2000; // Clear weather
        }
    }
    
    getWindEffects() {
        return {
            speed: this.wind.speed,
            direction: this.wind.direction,
            // Wind affects movement speed and accuracy
            movementPenalty: this.wind.speed > 15 ? 0.8 : 1,
            accuracyPenalty: this.wind.speed > 10 ? (this.wind.speed - 10) * 0.02 : 0
        };
    }
}

// ACOUSTIC - Gunshot Detection
class ACOUSTIC {
    constructor() {
        this.sensors = [];
        this.sensorRange = 500; // meters
        this.detectionHistory = [];
        this.soundSpeed = 343; // m/s at 20°C
        this.maxHistory = 1000; // Max number of detections to keep
    }
    
    addSensor(position) {
        const sensor = {
            id: `sensor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            position,
            status: 'active',
            lastDetection: null,
            sensitivity: 1.0,
            falsePositiveRate: 0.01 // 1% chance of false positive
        };
        this.sensors.push(sensor);
        return sensor;
    }
    
    processGunshot(gunshot) {
        // Gunshot format: { position, type, timestamp, energy }
        const detections = [];
        
        this.sensors.forEach(sensor => {
            if (sensor.status !== 'active') return;
            
            // Calculate distance to gunshot
            const dx = gunshot.position.x - sensor.position.x;
            const dy = gunshot.position.y - sensor.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if within range
            if (distance <= this.sensorRange) {
                // Calculate time of arrival
                const timeOfArrival = gunshot.timestamp + (distance / this.soundSpeed * 1000);
                
                // Calculate signal strength (inverse square law)
                const signalStrength = (gunshot.energy || 1) / (distance * distance);
                
                // Check if detected (considering sensor sensitivity and false positives)
                const detectionChance = Math.min(1, signalStrength) * sensor.sensitivity;
                
                if (Math.random() < detectionChance || Math.random() < sensor.falsePositiveRate) {
                    const detection = {
                        sensorId: sensor.id,
                        position: { ...sensor.position },
                        gunshotType: gunshot.type || 'unknown',
                        timestamp: timeOfArrival,
                        signalStrength,
                        confidence: Math.min(1, signalStrength * 0.9 + Math.random() * 0.1),
                        isFalsePositive: Math.random() < sensor.falsePositiveRate
                    };
                    
                    detections.push(detection);
                    sensor.lastDetection = detection;
                    
                    // Add to history
                    this.detectionHistory.push(detection);
                    if (this.detectionHistory.length > this.maxHistory) {
                        this.detectionHistory.shift();
                    }
                }
            }
        });
        
        return detections;
    }
    
    triangulateSource(detections) {
        if (detections.length < 2) return null;
        
        // Simple centroid calculation (for demonstration)
        // In a real system, use time difference of arrival (TDOA)
        let sumX = 0, sumY = 0, sumWeight = 0;
        
        detections.forEach(detection => {
            const weight = detection.confidence * (detection.isFalsePositive ? 0.1 : 1);
            sumX += detection.position.x * weight;
            sumY += detection.position.y * weight;
            sumWeight += weight;
        });
        
        if (sumWeight === 0) return null;
        
        return {
            x: sumX / sumWeight,
            y: sumY / sumWeight,
            confidence: Math.min(1, sumWeight / detections.length),
            timestamp: Date.now(),
            detectionCount: detections.length
        };
    }
    
    getRecentDetections(timeWindow = 60000) {
        const now = Date.now();
        return this.detectionHistory.filter(
            d => now - d.timestamp <= timeWindow
        );
    }
    
    getSensorStatus() {
        return this.sensors.map(sensor => ({
            id: sensor.id,
            position: { ...sensor.position },
            status: sensor.status,
            lastDetection: sensor.lastDetection ? {
                timestamp: sensor.lastDetection.timestamp,
                gunshotType: sensor.lastDetection.gunshotType,
                confidence: sensor.lastDetection.confidence
            } : null
        }));
    }
}

// Main Suraksh Class
export class Suraksh {
    constructor() {
        this.ants = new ANTS();
        this.birds = new BIRDS();
        this.fish = new FISH();
        this.acoustic = new ACOUSTIC();
        this.lastUpdate = Date.now();
    }
    
    update() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;
        
        // Update all subsystems
        this.fish.updateEnvironment(deltaTime);
        this.birds.updateSwarm();
        
        // Process any pending detections
        this.processDetections();
        
        return {
            timestamp: now,
            environment: this.fish.getWeatherEffects(),
            drones: this.birds.getStatus(),
            convoy: this.ants.getStatus(),
            sensors: this.acoustic.getSensorStatus()
        };
    }
    
    processDetections() {
        // Get recent detections and group them by time window
        const recentDetections = this.acoustic.getRecentDetections(5000); // 5-second window
        
        if (recentDetections.length >= 2) {
            // Try to triangulate the source
            const source = this.acoustic.triangulateSource(recentDetections);
            
            if (source && source.confidence > 0.5) {
                // Notify relevant systems
                this.ants.updateThreats([{
                    position: { x: source.x, y: source.y },
                    type: 'gunfire',
                    confidence: source.confidence,
                    timestamp: source.timestamp
                }]);
                
                // Update drone mission to investigate
                this.birds.updateMission({
                    type: 'track',
                    target: { x: source.x, y: source.y },
                    priority: 'high'
                });
            }
        }
    }
    
    // Public API methods
    addSensor(position) {
        return this.acoustic.addSensor(position);
    }
    
    reportGunshot(gunshot) {
        return this.acoustic.processGunshot({
            timestamp: Date.now(),
            ...gunshot
        });
    }
    
    updateConvoy(positions) {
        this.ants.updateConvoy(positions);
        return this.ants.getStatus();
    }
    
    updateDroneMission(mission) {
        this.birds.updateMission(mission);
        return this.birds.getStatus();
    }
}

// Export a singleton instance
export const suraksh = new Suraksh();

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Suraksh,
        ANTS,
        BIRDS,
        FISH,
        ACOUSTIC
    };
} else {
    // Browser global
    window.Suraksh = Suraksh;
    window.SurakshModules = { ANTS, BIRDS, FISH, ACOUSTIC };
}
