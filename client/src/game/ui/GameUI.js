import * as THREE from 'three';

export class GameUI {
    constructor() {
        this.setupBossHealthBar();
        this.setupPlayerHealthBars();
        this.setupWeaponSystem();
        this.setupBossRespawnNotifications();
    }

    setupBossHealthBar() {
        // Create boss health bar container
        const bossContainer = document.createElement('div');
        bossContainer.id = 'boss-health-container';
        bossContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 500px;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            display: none;
            text-align: center;
        `;

        // Boss name
        const bossName = document.createElement('div');
        bossName.id = 'boss-name';
        bossName.textContent = 'SEMI-"TRUMP"';
        bossName.style.cssText = `
            color: #ff0000;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
        `;

        // Health bar
        const healthBar = document.createElement('div');
        healthBar.id = 'boss-health-bar';
        healthBar.style.cssText = `
            width: 100%;
            height: 25px;
            background: #300;
            border-radius: 3px;
            overflow: hidden;
        `;

        const healthFill = document.createElement('div');
        healthFill.id = 'boss-health-fill';
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: #0f0;
            transition: width 0.3s ease;
        `;

        healthBar.appendChild(healthFill);
        bossContainer.appendChild(bossName);
        bossContainer.appendChild(healthBar);
        document.body.appendChild(bossContainer);
    }

    setupPlayerHealthBars() {
        // Create player health bars container
        const container = document.createElement('div');
        container.id = 'player-health-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 200px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        document.body.appendChild(container);
    }

    setupWeaponSystem() {
        // Create weapon system container
        const container = document.createElement('div');
        container.id = 'weapon-system';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 280px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;

        // Controls header
        const controlsHeader = document.createElement('div');
        controlsHeader.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            color: #ffcc00;
            margin-bottom: 12px;
            text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            padding-bottom: 8px;
        `;
        controlsHeader.textContent = 'CONTROLS';
        container.appendChild(controlsHeader);
        
        const controls = document.createElement('div');
        controls.id = 'controls-container';
        controls.style.cssText = `
            font-size: 14px;
            color: #ffffff;
            padding-top: 8px;
        `;
        
        // Create a styled control label function
        const createControlLabel = (key, action, ammoType = null, primary = false) => {
            // If this is a weapon control with ammo, add ammo display
            let ammoDisplay = '';
            if (ammoType) {
                const ammoCount = ammoType === 'machineGun' ? '∞' : '0';
                const ammoColor = ammoType === 'machineGun' || ammoCount > 0 ? '#00ff00' : '#ff0000';
                ammoDisplay = `<span style="margin-left: 5px; color: ${ammoColor};" id="ammo-${ammoType}">[${ammoCount}]</span>`;
            }
            
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; ${primary ? 'background: rgba(0,100,200,0.2); padding: 5px; border-radius: 4px;' : ''}">
                <span style="font-weight: ${primary ? 'bold' : 'normal'}; color: ${primary ? '#ffffff' : '#cccccc'};">
                    ${action}${ammoDisplay}
                </span>
                <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px; margin-left: 5px; color: #ffffff; min-width: 40px; text-align: center; font-weight: bold;">${key}</span>
            </div>`;
        };
        
        controls.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                ${createControlLabel('M', 'Machine Gun', 'machineGun', true)}
                ${createControlLabel('SPACE', 'Special Attack', 'specialAttack', true)}
                <div style="height: 10px;"></div>
                ${createControlLabel('W / ↑', 'Forward')}
                ${createControlLabel('S / ↓', 'Backward')}
                ${createControlLabel('A / ←', 'Turn Left')}
                ${createControlLabel('D / →', 'Turn Right')}
            </div>
        `;
        
        container.appendChild(controls);
        document.body.appendChild(container);
    }

    updateBossHealth(health, maxHealth, level) {
        const container = document.getElementById('boss-health-container');
        const healthFill = document.getElementById('boss-health-fill');
        const bossName = document.getElementById('boss-name');

        if (health > 0) {
            container.style.display = 'block';
            const percentage = (health / maxHealth) * 100;
            healthFill.style.width = `${percentage}%`;
            
            // Update boss name to include level if provided
            if (level !== undefined) {
                bossName.textContent = `SEMI-"TRUMP": Level ${level}`;
            }
            
            // Update color based on health percentage
            if (percentage > 60) {
                healthFill.style.background = '#0f0'; // Green
            } else if (percentage > 30) {
                healthFill.style.background = '#ff0'; // Yellow
            } else {
                healthFill.style.background = '#f00'; // Red
            }
        } else {
            container.style.display = 'none';
        }
    }

    updatePlayerHealth(playerId, health, maxHealth, username) {
        let playerBar = document.getElementById(`health-${playerId}`);

        if (!playerBar) {
            // Create new health bar for player
            playerBar = this.createPlayerHealthBar(playerId, username);
        }

        const healthFill = playerBar.querySelector('.health-fill');
        const percentage = (health / maxHealth) * 100;
        healthFill.style.width = `${percentage}%`;
        
        // Update color based on health percentage
        if (percentage > 60) {
            healthFill.style.background = '#0f0'; // Green
        } else if (percentage > 30) {
            healthFill.style.background = '#ff0'; // Yellow
        } else {
            healthFill.style.background = '#f00'; // Red
        }
    }

    createPlayerHealthBar(playerId, username) {
        const container = document.getElementById('player-health-container');

        const playerBar = document.createElement('div');
        playerBar.id = `health-${playerId}`;
        playerBar.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            border-radius: 3px;
        `;

        const playerName = document.createElement('div');
        playerName.textContent = username;
        playerName.style.cssText = `
            color: #fff;
            font-size: 14px;
            margin-bottom: 3px;
        `;

        const healthBar = document.createElement('div');
        healthBar.style.cssText = `
            width: 100%;
            height: 15px;
            background: #300;
            border-radius: 2px;
            overflow: hidden;
        `;

        const healthFill = document.createElement('div');
        healthFill.className = 'health-fill';
        healthFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: #0f0;
            transition: width 0.3s ease;
        `;

        healthBar.appendChild(healthFill);
        playerBar.appendChild(playerName);
        playerBar.appendChild(healthBar);
        container.appendChild(playerBar);

        return playerBar;
    }

    removePlayerHealthBar(playerId) {
        const playerBar = document.getElementById(`health-${playerId}`);
        if (playerBar) {
            playerBar.remove();
        }
    }

    updateWeaponSystem(weapons, currentWeapon, ammo) {
        // Update ammo counts for weapons in the controls display
        const machineGunAmmo = document.getElementById('ammo-machineGun');
        const specialAttackAmmo = document.getElementById('ammo-specialAttack');
        
        if (specialAttackAmmo) {
            const specialAmmoCount = ammo.get('specialAttack') || 0;
            specialAttackAmmo.textContent = `[${specialAmmoCount}]`;
            specialAttackAmmo.style.color = specialAmmoCount > 0 ? '#00ff00' : '#ff0000';
        }
    }

    setupBossRespawnNotifications() {
        // Create boss respawn notification container
        const container = document.createElement('div');
        container.id = 'boss-respawn-notification';
        container.style.position = 'fixed';
        container.style.top = '80px'; // Position just below boss health bar
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.width = '500px';
        container.style.textAlign = 'center';
        container.style.fontSize = '32px';
        container.style.fontWeight = 'bold';
        container.style.display = 'none';
        container.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
        container.style.zIndex = '1000';
        
        // Add countdown element
        const countdown = document.createElement('div');
        countdown.id = 'boss-respawn-countdown';
        countdown.style.fontSize = '24px';
        countdown.style.marginTop = '10px';
        
        container.appendChild(countdown);
        document.body.appendChild(container);
    }
    
    showGracePeriod(seconds) {
        let notification = document.getElementById('boss-respawn-notification');
        
        // Create notification container if it doesn't exist
        if (!notification) {
            console.warn('Boss respawn notification container not found, recreating it');
            this.setupBossRespawnNotifications();
            notification = document.getElementById('boss-respawn-notification');
            if (!notification) {
                console.error('Failed to create boss respawn notification container');
                return;
            }
        }
        
        // Set text and style for grace period
        notification.textContent = 'GRACE PERIOD';
        notification.style.color = '#00ff00'; // Green text
        notification.style.display = 'block';
        
        // Create countdown element if it doesn't exist
        let countdown = document.getElementById('boss-respawn-countdown');
        if (!countdown) {
            countdown = document.createElement('div');
            countdown.id = 'boss-respawn-countdown';
            countdown.style.fontSize = '24px';
            countdown.style.marginTop = '10px';
            notification.appendChild(countdown);
        }
        
        // Start countdown
        this.updateRespawnCountdown(seconds);
        
        // Update countdown every second
        this.countdownInterval = setInterval(() => {
            seconds--;
            this.updateRespawnCountdown(seconds);
            
            if (seconds <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    }
    
    showSpawningSoon() {
        let notification = document.getElementById('boss-respawn-notification');
        
        // Create notification container if it doesn't exist
        if (!notification) {
            console.warn('Boss respawn notification container not found, recreating it');
            this.setupBossRespawnNotifications();
            notification = document.getElementById('boss-respawn-notification');
            if (!notification) {
                console.error('Failed to create boss respawn notification container');
                return;
            }
        }
        
        // Set text and style for spawning soon warning
        notification.textContent = 'SEMI-TRUMP IS SPAWNING SOON';
        notification.style.color = '#ff0000'; // Red text
        notification.style.display = 'block';
        
        // Clear previous countdown
        const countdown = document.getElementById('boss-respawn-countdown');
        if (countdown) {
            countdown.textContent = '';
        }
        
        // Set up flashing effect
        let visible = true;
        this.flashInterval = setInterval(() => {
            visible = !visible;
            notification.style.visibility = visible ? 'visible' : 'hidden';
        }, 500); // Flash every 500ms
        
        // Show for 5 seconds then hide
        setTimeout(() => {
            clearInterval(this.flashInterval);
            this.hideRespawnNotification();
        }, 5000);
    }
    
    hideRespawnNotification() {
        const notification = document.getElementById('boss-respawn-notification');
        if (notification) {
            notification.style.display = 'none';
            notification.style.visibility = 'visible'; // Reset visibility
        }
        
        // Clear any active intervals
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
    }
    
    updateRespawnCountdown(seconds) {
        const countdown = document.getElementById('boss-respawn-countdown');
        if (!countdown) {
            console.warn('Boss respawn countdown element not found, recreating it');
            // Try to get the notification container
            const notification = document.getElementById('boss-respawn-notification');
            if (notification) {
                // Create countdown element again
                const newCountdown = document.createElement('div');
                newCountdown.id = 'boss-respawn-countdown';
                newCountdown.style.fontSize = '24px';
                newCountdown.style.marginTop = '10px';
                notification.appendChild(newCountdown);
                
                // Format and set time
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                newCountdown.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            }
            return;
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        countdown.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}